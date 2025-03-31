#!/usr/bin/env python
"""
GitHub Actions Workflow Verification Script

This script checks all GitHub Actions workflow files for correct script paths
and other common issues that might cause workflows to fail.

Usage:
    python scripts/utilities/verify_actions.py

Will output:
    - Any issues found with workflow files
    - Suggestions for fixing the issues
"""

import os
import sys
import glob
import yaml
import re
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class GitHubActionsVerifier:
    def __init__(self, project_root):
        """Initialize the verifier with the project root directory."""
        self.project_root = project_root
        self.workflows_dir = os.path.join(project_root, '.github', 'workflows')
        self.script_paths = []
        self.issues = []
    
    def collect_script_paths(self):
        """Collect all script paths from the project."""
        for ext in ['.py', '.sh']:
            for script_path in glob.glob(
                os.path.join(self.project_root, 'scripts', '**', f'*{ext}'), 
                recursive=True
            ):
                rel_path = os.path.relpath(script_path, self.project_root)
                self.script_paths.append(rel_path)
    
    def check_workflow_file(self, workflow_file):
        """Check a single workflow file for issues."""
        with open(workflow_file, 'r') as f:
            try:
                workflow_content = f.read()
                workflow_data = yaml.safe_load(workflow_content)
                
                # Extract all script paths referenced in the workflow
                script_refs = re.findall(r'python\s+([\w/./-]+\.py)', workflow_content)
                script_refs.extend(re.findall(r'bash\s+([\w/./-]+\.sh)', workflow_content))
                script_refs.extend(re.findall(r'sh\s+([\w/./-]+\.sh)', workflow_content))
                script_refs.extend(re.findall(r'\./([\w/./-]+\.sh)', workflow_content))
                script_refs.extend(re.findall(r'([\w/./-]+\.sh)', workflow_content))
                
                # Filter out duplicates and standard commands
                script_refs = [
                    ref for ref in set(script_refs) 
                    if not any(x in ref for x in ['pip', 'pytest', 'mv', 'rm', 'cp'])
                ]
                
                # Check if referenced scripts exist
                for script_ref in script_refs:
                    if script_ref.startswith('scripts/') and script_ref not in self.script_paths:
                        # Check if script exists in a subdirectory
                        parts = script_ref.split('/')
                        if len(parts) == 2 and parts[0] == 'scripts':
                            # This is a reference to a script in the scripts/ directory
                            script_name = parts[1]
                            matches = [
                                path for path in self.script_paths 
                                if path.endswith('/' + script_name)
                            ]
                            
                            if matches:
                                self.issues.append({
                                    'workflow': os.path.basename(workflow_file),
                                    'issue': f"Script path '{script_ref}' should be updated",
                                    'suggestion': f"Replace with '{matches[0]}'"
                                })
                            else:
                                self.issues.append({
                                    'workflow': os.path.basename(workflow_file),
                                    'issue': f"Script '{script_ref}' not found in any subdirectory",
                                    'suggestion': "Check if the script was renamed or moved"
                                })
                
            except yaml.YAMLError as e:
                self.issues.append({
                    'workflow': os.path.basename(workflow_file),
                    'issue': f"Invalid YAML: {str(e)}",
                    'suggestion': "Fix the YAML syntax"
                })
    
    def run_verification(self):
        """Run verification on all workflow files."""
        # Collect script paths
        self.collect_script_paths()
        
        # Check if workflows directory exists
        if not os.path.exists(self.workflows_dir):
            print(f"GitHub Actions workflows directory not found at: {self.workflows_dir}")
            return []
        
        # Get all workflow files
        workflow_files = glob.glob(os.path.join(self.workflows_dir, '*.yml'))
        
        # Check each workflow file
        for workflow_file in workflow_files:
            self.check_workflow_file(workflow_file)
        
        return self.issues
    
    def print_report(self):
        """Print a report of issues found."""
        if not self.issues:
            print("✅ No issues found in GitHub Actions workflow files.")
            return
        
        print(f"⚠️ Found {len(self.issues)} issues in GitHub Actions workflow files:")
        print()
        
        for i, issue in enumerate(self.issues, 1):
            print(f"{i}. Workflow: {issue['workflow']}")
            print(f"   Issue: {issue['issue']}")
            print(f"   Suggestion: {issue['suggestion']}")
            print()

def main():
    # Get project root directory
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Create and run verifier
    verifier = GitHubActionsVerifier(project_root)
    verifier.run_verification()
    verifier.print_report()

if __name__ == "__main__":
    main()