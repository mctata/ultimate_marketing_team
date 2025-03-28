#!/usr/bin/env python3
"""
UMT Script Runner

A CLI utility to discover and run scripts in the Ultimate Marketing Team project.
This makes it easier to find and execute scripts without remembering their exact paths.

Usage:
    python scripts/run.py [category] [script_name] [args...]
    
    Example: python scripts/run.py deployment deploy_staging --help
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent.absolute()
CATEGORIES = [
    "deployment",  # Includes deploy.py, deploy_staging.sh and quick_deploy.sh
    "database", 
    "monitoring",
    "testing",
    "compliance",
    "seeding",
    "performance",
    "notifications",
    "utilities"
]


def list_category_scripts(category):
    """List all scripts in a category directory."""
    category_dir = SCRIPT_DIR / category
    if not category_dir.exists():
        print(f"Category '{category}' not found")
        return []
        
    scripts = []
    for item in os.listdir(category_dir):
        path = category_dir / item
        if path.is_file() and not item.startswith("__"):
            # Strip extension for python files to make it easier to call
            name = item
            if item.endswith(".py"):
                name = item[:-3]
            scripts.append((name, item))
    return scripts


def list_all_scripts():
    """List all scripts in all categories."""
    all_scripts = {}
    for category in CATEGORIES:
        scripts = list_category_scripts(category)
        if scripts:
            all_scripts[category] = scripts
    return all_scripts


def run_script(category, script_name, args):
    """Run a script with the given arguments."""
    category_dir = SCRIPT_DIR / category
    
    # Look for the script with its original filename
    script_path = category_dir / script_name
    
    # If not found, try adding .py extension
    if not script_path.exists() and not script_name.endswith(".py"):
        script_path = category_dir / f"{script_name}.py"
    
    # If not found, try adding .sh extension
    if not script_path.exists() and not script_name.endswith(".sh"):
        script_path = category_dir / f"{script_name}.sh"
        
    if not script_path.exists():
        print(f"Script '{script_name}' not found in category '{category}'")
        # List available scripts in this category
        scripts = list_category_scripts(category)
        if scripts:
            print("\nAvailable scripts in this category:")
            for name, filename in scripts:
                print(f"  - {name}")
        return 1
    
    # Run the script with the appropriate interpreter
    if script_path.name.endswith(".py"):
        cmd = [sys.executable, str(script_path)] + args
    elif script_path.name.endswith(".sh"):
        cmd = ["bash", str(script_path)] + args
    else:
        # Try to execute directly if it has execute permissions
        if os.access(script_path, os.X_OK):
            cmd = [str(script_path)] + args
        else:
            print(f"Don't know how to execute '{script_path.name}'")
            return 1
            
    try:
        return subprocess.run(cmd).returncode
    except KeyboardInterrupt:
        print("\nScript execution interrupted")
        return 130
    except Exception as e:
        print(f"Error executing script: {e}")
        return 1


def print_usage():
    """Print usage instructions."""
    print("UMT Script Runner\n")
    print("Usage:")
    print("  python scripts/run.py [category] [script_name] [args...]\n")
    print("Categories:")
    for category in CATEGORIES:
        print(f"  - {category}")
    print("\nExamples:")
    print("  python scripts/run.py list                     # List all scripts")
    print("  python scripts/run.py list deployment          # List deployment scripts")
    print("  python scripts/run.py deployment deploy_staging  # Run the staging deployment script")


def main():
    """Main entry point."""
    if len(sys.argv) < 2 or sys.argv[1] == "-h" or sys.argv[1] == "--help":
        print_usage()
        return 0
        
    command = sys.argv[1]
    
    # List all scripts
    if command == "list":
        if len(sys.argv) > 2:
            category = sys.argv[2]
            if category in CATEGORIES:
                scripts = list_category_scripts(category)
                if scripts:
                    print(f"\nScripts in category '{category}':")
                    for name, filename in scripts:
                        print(f"  - {name}")
                else:
                    print(f"No scripts found in category '{category}'")
            else:
                print(f"Category '{category}' not found")
                print("\nAvailable categories:")
                for cat in CATEGORIES:
                    print(f"  - {cat}")
        else:
            all_scripts = list_all_scripts()
            print("\nAvailable scripts by category:")
            for category, scripts in all_scripts.items():
                print(f"\n{category}:")
                for name, filename in scripts:
                    print(f"  - {name}")
        return 0
        
    # Run a script
    if command in CATEGORIES:
        if len(sys.argv) < 3:
            print(f"Please specify a script name from the '{command}' category")
            scripts = list_category_scripts(command)
            if scripts:
                print("\nAvailable scripts:")
                for name, filename in scripts:
                    print(f"  - {name}")
            return 1
            
        script_name = sys.argv[2]
        script_args = sys.argv[3:]
        return run_script(command, script_name, script_args)
    else:
        print(f"Unknown category: {command}")
        print_usage()
        return 1


if __name__ == "__main__":
    sys.exit(main())