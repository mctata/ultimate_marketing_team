import os
import re

def fix_imports_in_file(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
    
    # Replace imports
    updated_content = re.sub(r'from src\.ultimate_marketing_team\.', 'from src.', content)
    
    if content \!= updated_content:
        with open(file_path, 'w') as file:
            file.write(updated_content)
        print(f"Fixed imports in {file_path}")

def find_and_fix_py_files(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                fix_imports_in_file(file_path)

if __name__ == "__main__":
    find_and_fix_py_files('/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/src')
