#!/usr/bin/env python
"""
Generate API documentation from the OpenAPI spec.

This script:
1. Extracts the OpenAPI spec from the FastAPI application
2. Writes the OpenAPI spec to YAML and JSON files
3. Copies static documentation files to the build directory
4. Generates client SDK packages for Python and JavaScript

Usage:
    python scripts/generate_api_docs.py [--output-dir OUTPUT_DIR] [--format {yaml,json}]
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

try:
    import yaml
    from fastapi.openapi.utils import get_openapi
except ImportError:
    print("Required packages not found. Install dependencies with:")
    print("pip install fastapi pyyaml")
    sys.exit(1)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Generate API documentation from the OpenAPI spec.")
    parser.add_argument(
        "--output-dir",
        default="docs/api",
        help="Output directory for generated documentation (default: docs/api)",
    )
    parser.add_argument(
        "--format",
        choices=["yaml", "json", "both"],
        default="both",
        help="Output format for OpenAPI spec (default: both)",
    )
    parser.add_argument(
        "--generate-sdks",
        action="store_true",
        help="Generate client SDKs for Python and JavaScript",
    )
    return parser.parse_args()

def ensure_directory(directory):
    """Ensure a directory exists."""
    os.makedirs(directory, exist_ok=True)
    return directory

def get_app_instance():
    """Get the FastAPI application instance."""
    # Import the app module dynamically to avoid import issues
    sys.path.insert(0, ".")
    try:
        from src.api.main import app
        return app
    except ImportError as e:
        print(f"Error importing app: {e}")
        print("Make sure you're running this script from the project root.")
        sys.exit(1)

def generate_openapi_spec(app, output_dir, output_format="both"):
    """Generate the OpenAPI spec from the FastAPI application."""
    print("Generating OpenAPI spec...")
    
    # Get the OpenAPI spec dict
    openapi_spec = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    
    # Ensure the output directory exists
    ensure_directory(output_dir)
    
    # Write the OpenAPI spec to a file
    if output_format in ["yaml", "both"]:
        yaml_path = os.path.join(output_dir, "openapi.yaml")
        with open(yaml_path, "w") as f:
            yaml.dump(openapi_spec, f, sort_keys=False)
        print(f"OpenAPI spec written to {yaml_path}")
    
    if output_format in ["json", "both"]:
        json_path = os.path.join(output_dir, "openapi.json")
        with open(json_path, "w") as f:
            json.dump(openapi_spec, f, indent=2)
        print(f"OpenAPI spec written to {json_path}")
    
    return openapi_spec

def copy_static_docs(output_dir):
    """Copy static documentation files to the output directory."""
    print("Copying static documentation files...")
    
    # Source and destination directories
    src_dir = "docs/api"
    dst_dir = output_dir
    
    # Ensure the output directory exists
    ensure_directory(dst_dir)
    
    # Copy files
    try:
        # Create a list of files to copy (excluding OpenAPI spec files that we generate)
        exclude_patterns = ["openapi.yaml", "openapi.json"]
        
        # Get a list of all files in the source directory
        for root, _, files in os.walk(src_dir):
            for file in files:
                if file not in exclude_patterns:
                    src_path = os.path.join(root, file)
                    # Get the relative path from src_dir
                    rel_path = os.path.relpath(src_path, src_dir)
                    # Construct the destination path
                    dst_path = os.path.join(dst_dir, rel_path)
                    # Ensure the destination directory exists
                    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                    # Copy the file
                    shutil.copy2(src_path, dst_path)
                    print(f"Copied {src_path} to {dst_path}")
    except Exception as e:
        print(f"Error copying static documentation files: {e}")
        return False
    
    return True

def generate_client_sdks(openapi_spec, output_dir):
    """Generate client SDKs for Python and JavaScript."""
    print("Generating client SDKs...")
    
    # Ensure the output directory exists
    sdk_dir = os.path.join(output_dir, "sdks")
    ensure_directory(sdk_dir)
    
    # Write the OpenAPI spec to a temporary file for the SDK generators
    temp_spec_path = os.path.join(sdk_dir, "openapi.json")
    with open(temp_spec_path, "w") as f:
        json.dump(openapi_spec, f, indent=2)
    
    # Generate Python SDK
    try:
        python_sdk_dir = os.path.join(sdk_dir, "python")
        ensure_directory(python_sdk_dir)
        
        print("Generating Python SDK...")
        result = subprocess.run(
            [
                "openapi-generator-cli", "generate",
                "-i", temp_spec_path,
                "-g", "python",
                "-o", python_sdk_dir,
                "--additional-properties=packageName=umt_client,projectName=Ultimate Marketing Team Client"
            ],
            check=True,
            capture_output=True,
        )
        print("Python SDK generated successfully.")
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Error generating Python SDK: {e}")
        print("Make sure you have the OpenAPI Generator CLI installed.")
        print("Install it with: npm install @openapitools/openapi-generator-cli -g")
    
    # Generate JavaScript SDK
    try:
        js_sdk_dir = os.path.join(sdk_dir, "javascript")
        ensure_directory(js_sdk_dir)
        
        print("Generating JavaScript SDK...")
        result = subprocess.run(
            [
                "openapi-generator-cli", "generate",
                "-i", temp_spec_path,
                "-g", "javascript",
                "-o", js_sdk_dir,
                "--additional-properties=projectName=umt-client,moduleName=UmtClient"
            ],
            check=True,
            capture_output=True,
        )
        print("JavaScript SDK generated successfully.")
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Error generating JavaScript SDK: {e}")
        print("Make sure you have the OpenAPI Generator CLI installed.")
        print("Install it with: npm install @openapitools/openapi-generator-cli -g")
    
    # Clean up
    try:
        os.remove(temp_spec_path)
    except OSError:
        pass

def main():
    """Main function."""
    args = parse_args()
    
    # Normalize the output directory path
    output_dir = os.path.normpath(args.output_dir)
    
    # Get the FastAPI application instance
    app = get_app_instance()
    
    # Generate the OpenAPI spec
    openapi_spec = generate_openapi_spec(app, output_dir, args.format)
    
    # Copy static documentation files
    copy_static_docs(output_dir)
    
    # Generate client SDKs if requested
    if args.generate_sdks:
        generate_client_sdks(openapi_spec, output_dir)
    
    print(f"API documentation generation completed. Documentation is available at: {output_dir}")

if __name__ == "__main__":
    main()