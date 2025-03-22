#!/usr/bin/env python
"""
Script to generate data exports for data subject access requests.
This script creates standardized exports for GDPR and CCPA compliance.

Usage:
    python scripts/export_user_data.py --request-id ID --format FORMAT

Options:
    --request-id ID   The data subject request ID to process
    --format FORMAT   Export format: json, csv, pdf (default: json)
"""

import argparse
import json
import csv
import sys
import os
import logging
from datetime import datetime

# Add the project root directory to the Python path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from src.core.database import get_db_session
from src.core.compliance import DataSubjectRequestManager
from src.core.logging import setup_logging, get_logger


def configure_logging():
    """Configure logging for the script."""
    setup_logging()
    logger = get_logger(component="data_exports")
    
    # Configure file logging specific to data export tasks
    log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    file_handler = logging.FileHandler(
        os.path.join(log_dir, f'data_exports_{datetime.now().strftime("%Y%m%d")}.log')
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    
    logger.addHandler(file_handler)
    return logger


def export_user_data(request_id, export_format='json'):
    """
    Generate a data export for a data subject access request.
    
    Args:
        request_id: The data subject request ID
        export_format: The export format (json, csv, pdf)
    """
    logger = configure_logging()
    logger.info(f"Starting data export for request ID {request_id} in {export_format} format")
    
    try:
        with get_db_session() as db:
            # Get the data request manager
            request_manager = DataSubjectRequestManager(db)
            
            # Get the request
            request = request_manager.get_request(request_id)
            if not request:
                logger.error(f"Request ID {request_id} not found")
                sys.exit(1)
                
            if request.request_type != "access":
                logger.error(f"Request ID {request_id} is not an access request")
                sys.exit(1)
                
            # Execute the access request to get the data
            user_data = request_manager.execute_access_request(request_id)
            
            # Create export file name
            export_dir = os.path.join(os.path.dirname(__file__), '..', 'exports')
            os.makedirs(export_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            base_filename = f"user_data_export_{request_id}_{timestamp}"
            
            # Export the data based on the requested format
            if export_format == 'json':
                export_path = os.path.join(export_dir, f"{base_filename}.json")
                with open(export_path, 'w') as f:
                    json.dump(user_data, f, indent=2, default=str)
                
            elif export_format == 'csv':
                export_path = os.path.join(export_dir, f"{base_filename}.csv")
                
                # Flatten the nested data
                flattened_data = flatten_dict(user_data)
                
                with open(export_path, 'w', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow(['Key', 'Value'])
                    for key, value in flattened_data.items():
                        writer.writerow([key, value])
                
            elif export_format == 'pdf':
                # This would require additional dependencies like reportlab
                # For now, we'll just create a JSON file and log a message
                export_path = os.path.join(export_dir, f"{base_filename}.json")
                with open(export_path, 'w') as f:
                    json.dump(user_data, f, indent=2, default=str)
                logger.warning("PDF export not implemented yet. Created JSON file instead.")
            
            else:
                logger.error(f"Unsupported export format: {export_format}")
                sys.exit(1)
            
            # Update the request status
            request_manager.update_request_status(
                request_id=request_id,
                status="completed",
                admin_user_id=None,  # System action
                notes=f"Data exported to {export_path}"
            )
            
            logger.info(f"Data export completed successfully: {export_path}")
            print(f"Data export completed successfully: {export_path}")
            
    except Exception as e:
        logger.exception(f"Error exporting user data: {str(e)}")
        sys.exit(1)


def flatten_dict(nested_dict, parent_key='', sep='.'):
    """
    Flatten a nested dictionary into a single-level dictionary.
    
    Args:
        nested_dict: The nested dictionary to flatten
        parent_key: The parent key for nested values
        sep: The separator between keys
        
    Returns:
        A flattened dictionary
    """
    flattened = {}
    
    for key, value in nested_dict.items():
        new_key = f"{parent_key}{sep}{key}" if parent_key else key
        
        if isinstance(value, dict):
            flattened.update(flatten_dict(value, new_key, sep))
        elif isinstance(value, list):
            for i, item in enumerate(value):
                if isinstance(item, dict):
                    flattened.update(flatten_dict(item, f"{new_key}[{i}]", sep))
                else:
                    flattened[f"{new_key}[{i}]"] = item
        else:
            flattened[new_key] = value
            
    return flattened


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate data exports for data subject access requests")
    parser.add_argument(
        "--request-id",
        type=int,
        required=True,
        help="The data subject request ID to process"
    )
    parser.add_argument(
        "--format",
        choices=["json", "csv", "pdf"],
        default="json",
        help="Export format (default: json)"
    )
    
    args = parser.parse_args()
    export_user_data(args.request_id, args.format)