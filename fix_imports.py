#!/usr/bin/env python3
"""
This script verifies and fixes import paths in the project to ensure proper structure.
It checks for any imports from the root src/ directory in frontend code and fixes them.
"""

import os
import re
import sys
from pathlib import Path

def find_frontend_files():
    """Find all TypeScript and JavaScript files in the frontend directory."""
    frontend_dir = Path("frontend/src")
    if not frontend_dir.exists():
        print(f"Error: {frontend_dir} does not exist.")
        sys.exit(1)
        
    files = []
    for ext in ["*.ts", "*.tsx", "*.js", "*.jsx"]:
        files.extend(frontend_dir.glob(f"**/{ext}"))
    return files

def check_and_fix_imports(file_path, dry_run=True):
    """Check for improper imports and fix them if needed."""
    with open(file_path, "r") as f:
        content = f.read()
    
    # Look for imports from the src directory
    wrong_import_pattern = re.compile(r'from\s+[\'"](?:\.\.\/)*src\/(.+)[\'"]')
    matches = wrong_import_pattern.findall(content)
    
    if not matches:
        return False
    
    print(f"Found improper imports in {file_path}:")
    
    # Fix the imports
    fixed_content = content
    for match in matches:
        old_import = f'from "../src/{match}"'
        new_import = f'from "../{match}"'
        
        # Also check for variations with different number of ../
        variations = [
            f'from "../../src/{match}"',
            f'from "../../../src/{match}"',
            f'from "../../../../src/{match}"',
            f'from "src/{match}"',
        ]
        
        replacement_variations = [
            f'from "../../{match}"',
            f'from "../../../{match}"',
            f'from "../../../../{match}"',
            f'from "./{match}"',
        ]
        
        print(f"  - {old_import} -> {new_import}")
        fixed_content = fixed_content.replace(old_import, new_import)
        
        for old, new in zip(variations, replacement_variations):
            if old in fixed_content:
                print(f"  - {old} -> {new}")
                fixed_content = fixed_content.replace(old, new)
    
    if not dry_run:
        with open(file_path, "w") as f:
            f.write(fixed_content)
        print(f"Fixed imports in {file_path}")
    
    return True

def fix_imports_in_py_file(file_path):
    """Fix imports in Python files (legacy functionality)."""
    with open(file_path, 'r') as file:
        content = file.read()
    
    # Replace imports
    updated_content = re.sub(r'from src\.ultimate_marketing_team\.', 'from src.', content)
    
    if content != updated_content:
        with open(file_path, 'w') as file:
            file.write(updated_content)
        print(f"Fixed imports in {file_path}")

def find_and_fix_py_files(directory):
    """Find and fix imports in Python files (legacy functionality)."""
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                fix_imports_in_py_file(file_path)

def main():
    """Main function to find and fix improper imports."""
    # Check command line arguments
    if len(sys.argv) > 1 and sys.argv[1] == "--python-only":
        print("Checking Python files for improper imports...")
        find_and_fix_py_files('/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/src')
        return
    
    print("Checking frontend files for improper imports...")
    
    files = find_frontend_files()
    print(f"Found {len(files)} frontend files.")
    
    # First run in dry-run mode to just report issues
    issues_found = False
    for file_path in files:
        if check_and_fix_imports(file_path, dry_run=True):
            issues_found = True
    
    if not issues_found:
        print("No improper imports found in frontend files.")
        return
    
    # Ask user if they want to fix the issues
    response = input("Do you want to fix these improper imports? (y/n): ")
    if response.lower() != 'y':
        print("No changes made.")
        return
    
    # Fix the issues
    fixed_count = 0
    for file_path in files:
        if check_and_fix_imports(file_path, dry_run=False):
            fixed_count += 1
    
    print(f"Fixed imports in {fixed_count} files.")

if __name__ == "__main__":
    main()
