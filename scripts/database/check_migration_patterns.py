#!/usr/bin/env python
"""
Script to scan migration files for improper SQLAlchemy patterns that may cause issues.
Specifically looks for:
1. Direct SQL execution without using text() function
2. SQL injection vulnerabilities from f-string interpolation
3. Improper datetime handling in SQL strings
"""

import os
import re
import sys
import ast
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple, Set, Optional, Any
from datetime import datetime

# Import the logging utility
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from scripts.utilities.logging_utils import setup_logger

# Setup logger
logger = setup_logger('migration_checker')

# Pattern to match direct SQL execution
RAW_SQL_PATTERNS = [
    r"op\.execute\(['\"]",  # Direct string in op.execute()
    r"connection\.execute\(['\"]",  # Direct string in connection.execute()
    r"op\.execute\(f['\"]",  # f-string in op.execute()
    r"connection\.execute\(f['\"]",  # f-string in connection.execute()
]

# Files to ignore (if any)
IGNORE_FILES = []

def find_migration_files(base_path: str) -> List[str]:
    """
    Find all migration files in the specified path
    """
    migration_files = []
    versions_dir = os.path.join(base_path, 'migrations', 'versions')
    
    if not os.path.exists(versions_dir):
        logger.error(f"Versions directory not found at {versions_dir}")
        return []
    
    for file in os.listdir(versions_dir):
        if file.endswith('.py') and file not in IGNORE_FILES:
            migration_files.append(os.path.join(versions_dir, file))
    
    return migration_files

def check_ast_for_issues(file_path: str) -> Dict[str, List[Tuple[int, str]]]:
    """
    Use AST to check for specific code patterns that may cause issues
    """
    issues = defaultdict(list)
    
    with open(file_path, 'r') as f:
        file_content = f.read()
    
    try:
        tree = ast.parse(file_content)
        
        # Look for imports
        has_text_import = False
        has_sqlalchemy_import = False
        
        for node in ast.walk(tree):
            # Check imports
            if isinstance(node, ast.Import):
                for name in node.names:
                    if name.name == 'sqlalchemy':
                        has_sqlalchemy_import = True
            elif isinstance(node, ast.ImportFrom):
                if node.module == 'sqlalchemy':
                    for name in node.names:
                        if name.name == 'text':
                            has_text_import = True
            
            # Check for execute calls
            if isinstance(node, ast.Call):
                # Look for execute() function calls
                if isinstance(node.func, ast.Attribute) and node.func.attr == 'execute':
                    # Check if the first argument is a string or f-string
                    if node.args and isinstance(node.args[0], ast.Constant) and isinstance(node.args[0].value, str):
                        issues['direct_string_execution'].append((node.lineno, node.args[0].value))
                    elif node.args and isinstance(node.args[0], ast.JoinedStr):
                        issues['fstring_execution'].append((node.lineno, ast.unparse(node.args[0])))
                    # Check if not using text() - but don't flag cases where we're using a variable
                    # that might already contain a text() object (like a 'query' variable)
                    elif (node.args and 
                          not isinstance(node.args[0], ast.Name) and  # Skip if it's a simple variable
                          not (isinstance(node.args[0], ast.Call) and 
                               isinstance(node.args[0].func, ast.Name) and 
                               node.args[0].func.id == 'text') and
                          not (isinstance(node.args[0], ast.Call) and
                               isinstance(node.args[0].func, ast.Attribute) and
                               node.args[0].func.attr == 'bindparams')
                         ):
                        issues['potential_non_text_execution'].append((node.lineno, ast.unparse(node)))
        
        # Check if text is imported when needed
        if issues and not has_text_import:
            issues['missing_text_import'].append((0, "Missing 'from sqlalchemy import text' import"))
        
    except SyntaxError as e:
        issues['syntax_error'].append((e.lineno, str(e)))
    
    return issues

def check_file_patterns(file_path: str) -> Dict[str, List[Tuple[int, str]]]:
    """
    Use regex to check for patterns that may indicate issues
    """
    issues = defaultdict(list)
    
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # Check for raw SQL execution patterns
    for i, line in enumerate(lines, 1):
        for pattern in RAW_SQL_PATTERNS:
            if re.search(pattern, line):
                if 'text(' not in line:
                    issues['raw_sql_execution'].append((i, line.strip()))
        
        # Check for datetime usage in SQL strings
        if 'datetime' in line and 'execute' in line and 'f"' in line or "f'" in line:
            issues['datetime_in_sql'].append((i, line.strip()))
    
    # Check for text import if raw SQL is used
    if issues and not any('from sqlalchemy import text' in line for line in lines):
        issues['missing_text_import'].append((0, "Missing 'from sqlalchemy import text' import"))
    
    return issues

def generate_fix_recommendations(file_path: str, issues: Dict[str, List[Tuple[int, str]]]) -> List[str]:
    """
    Generate recommended fixes for identified issues
    """
    recommendations = []
    
    if 'missing_text_import' in issues:
        recommendations.append("Add import: from sqlalchemy import text")
    
    for issue_type, occurrences in issues.items():
        if issue_type == 'raw_sql_execution':
            for line_num, line in occurrences:
                # Simple pattern replacement recommendation
                if 'op.execute(' in line:
                    fixed_line = line.replace('op.execute(', 'op.execute(text(')
                    # Check if we need to add closing parenthesis
                    if not fixed_line.endswith('))') and fixed_line.endswith(')'):
                        fixed_line = fixed_line[:-1] + ')'
                    recommendations.append(f"Line {line_num}: Replace with: {fixed_line}")
                elif 'connection.execute(' in line:
                    fixed_line = line.replace('connection.execute(', 'connection.execute(text(')
                    if not fixed_line.endswith('))') and fixed_line.endswith(')'):
                        fixed_line = fixed_line[:-1] + ')'
                    recommendations.append(f"Line {line_num}: Replace with: {fixed_line}")
        
        elif issue_type == 'fstring_execution':
            for line_num, line in occurrences:
                recommendations.append(f"Line {line_num}: Use text() with parameters instead of f-strings: {line}")
        
        elif issue_type == 'datetime_in_sql':
            for line_num, line in occurrences:
                recommendations.append(f"Line {line_num}: Use bind parameters for datetime values instead of string interpolation")
    
    return recommendations

def check_migration_file(file_path: str) -> Tuple[bool, Dict[str, List[Tuple[int, str]]], List[str]]:
    """
    Check a single migration file for issues
    """
    logger.info(f"Checking file: {file_path}")
    
    # Combine both methods for more comprehensive analysis
    ast_issues = check_ast_for_issues(file_path)
    pattern_issues = check_file_patterns(file_path)
    
    # Merge the issues
    all_issues = defaultdict(list)
    for d in [ast_issues, pattern_issues]:
        for k, v in d.items():
            all_issues[k].extend(v)
    
    has_issues = bool(all_issues)
    recommendations = generate_fix_recommendations(file_path, all_issues)
    
    return has_issues, dict(all_issues), recommendations

def main():
    """
    Main function to check all migration files
    """
    # Get project root path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    logger.info(f"Scanning migration files in: {project_root}")
    
    migration_files = find_migration_files(project_root)
    if not migration_files:
        logger.error("No migration files found")
        return 1
    
    logger.info(f"Found {len(migration_files)} migration files to scan")
    
    issues_found = False
    issue_count = 0
    files_with_issues = 0
    
    # Detailed result for report
    results = []
    
    for file_path in migration_files:
        file_has_issues, file_issues, recommendations = check_migration_file(file_path)
        
        if file_has_issues:
            issues_found = True
            files_with_issues += 1
            issue_count += sum(len(issues) for issues in file_issues.values())
            
            # Simplified relative path for display
            rel_path = os.path.relpath(file_path, project_root)
            
            results.append({
                'file': rel_path,
                'issues': file_issues,
                'recommendations': recommendations
            })
    
    # Print summary
    logger.info(f"\n{'=' * 80}")
    logger.info(f"SUMMARY: {issue_count} issues found in {files_with_issues} files")
    logger.info(f"{'=' * 80}")
    
    if issues_found:
        logger.info("\nDetailed Issues:")
        for result in results:
            logger.info(f"\n{'-' * 80}")
            logger.info(f"File: {result['file']}")
            logger.info(f"{'-' * 80}")
            
            for issue_type, occurrences in result['issues'].items():
                logger.info(f"\nIssue Type: {issue_type}")
                for line_num, line in occurrences:
                    logger.info(f"  Line {line_num}: {line}")
            
            logger.info("\nRecommended Fixes:")
            for recommendation in result['recommendations']:
                logger.info(f"  - {recommendation}")
        
        return 1
    else:
        logger.info("All migration files use proper SQLAlchemy patterns!")
        return 0

if __name__ == "__main__":
    sys.exit(main())