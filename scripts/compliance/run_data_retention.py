#!/usr/bin/env python
"""
Script to execute data retention policies.
This script can be scheduled to run periodically via cron or another scheduler.

Usage:
    python scripts/run_data_retention.py [--entity-type TYPE]

Options:
    --entity-type TYPE   Optional entity type to process (e.g., 'user', 'content')
                         If not provided, all entity types will be processed
"""

import argparse
import logging
import sys
import os
from datetime import datetime

# Add the project root directory to the Python path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from src.core.database import get_db_session
from src.core.compliance import DataRetentionService
from src.core.logging import setup_logging, get_logger


def configure_logging():
    """Configure logging for the script."""
    setup_logging()
    logger = get_logger(component="data_retention")
    
    # Configure file logging specific to data retention tasks
    log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    file_handler = logging.FileHandler(
        os.path.join(log_dir, f'data_retention_{datetime.now().strftime("%Y%m%d")}.log')
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    
    logger.addHandler(file_handler)
    return logger


def run_data_retention(entity_type=None):
    """
    Run the data retention process.
    
    Args:
        entity_type: Optional entity type to process
    """
    logger = configure_logging()
    logger.info(f"Starting data retention process for {entity_type or 'all entity types'}")
    
    try:
        with get_db_session() as db:
            retention_service = DataRetentionService(db)
            results = retention_service.apply_retention_policies(entity_type)
            
            # Log the results
            logger.info(f"Data retention completed with the following results:")
            logger.info(f"- Total records processed: {results['total_records_processed']}")
            logger.info(f"- Total records archived: {results['total_records_archived']}")
            logger.info(f"- Total records deleted: {results['total_records_deleted']}")
            logger.info(f"- Execution time: {results['execution_time_sec']:.2f} seconds")
            
            # Log details for each entity type
            for entity_type, entity_result in results['entity_results'].items():
                logger.info(f"- {entity_type}:")
                logger.info(f"  - Records processed: {entity_result['records_processed']}")
                logger.info(f"  - Records archived: {entity_result['records_archived']}")
                logger.info(f"  - Records deleted: {entity_result['records_deleted']}")
                
                if entity_result['status'] == 'error':
                    logger.error(f"  - Error: {entity_result['error_message']}")
    
    except Exception as e:
        logger.exception(f"Error executing data retention policies: {str(e)}")
        sys.exit(1)
    
    logger.info("Data retention process completed successfully")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Execute data retention policies")
    parser.add_argument(
        "--entity-type",
        help="Optional entity type to process (e.g., 'user', 'content')",
        default=None
    )
    
    args = parser.parse_args()
    run_data_retention(args.entity_type)