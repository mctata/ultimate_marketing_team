"""
Agent runner module for starting the appropriate agents based on environment variables.
Supports running multiple agents in a single container for better resource utilization.
"""

import os
import sys
import time
import threading
import argparse
from typing import Dict, Any, List, Optional
from loguru import logger

# Fix database connection for Docker containers
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@postgres:5432/ultimatemarketing"
os.environ["REDIS_URL"] = "redis://redis:6379/0"
os.environ["RABBITMQ_URL"] = "amqp://guest:guest@rabbitmq:5672/"

# Setup database connection
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Import models
import src.models

# Agent imports
from src.agents.auth_integration_agent import AuthIntegrationAgent
from src.agents.brand_project_management_agent import BrandProjectManagementAgent
from src.agents.content_strategy_research_agent import ContentStrategyResearchAgent
from src.agents.content_creation_testing_agent import ContentCreationTestingAgent
from src.agents.content_ad_management_agent import ContentAdManagementAgent

# Available agent classes
AGENT_CLASSES = {
    "auth_integration_agent": AuthIntegrationAgent,
    "brand_project_management_agent": BrandProjectManagementAgent,
    "content_strategy_agent": ContentStrategyResearchAgent,
    "content_creation_agent": ContentCreationTestingAgent,
    "content_ad_management_agent": ContentAdManagementAgent
}

def get_agent_class(agent_name: str):
    """Returns the appropriate agent class based on the agent name."""
    if agent_name not in AGENT_CLASSES:
        raise ValueError(f"Unknown agent name: {agent_name}")
    
    return AGENT_CLASSES[agent_name]

def run_agent(agent_name: str, stop_event: threading.Event):
    """Run a single agent in a separate thread."""
    try:
        # Get the agent class and create instance
        AgentClass = get_agent_class(agent_name)
        logger.info(f"Starting agent: {agent_name}")
        
        # Create and start the agent
        agent = AgentClass(agent_id=agent_name, name=agent_name.replace("_", " ").title())
        agent.start()
        
        # Wait until stop event is set
        while not stop_event.is_set():
            time.sleep(1)
            
        # Stop the agent
        logger.info(f"Shutting down agent: {agent_name}")
        agent.stop()
        
    except Exception as e:
        logger.error(f"Error running agent {agent_name}: {e}")

def initialize_database():
    """Initialize the database schema if needed."""
    # Create a database connection
    engine = create_engine(os.environ["DATABASE_URL"])
    
    # Create schema if it doesn't exist
    try:
        with engine.connect() as conn:
            conn.execute(text('CREATE SCHEMA IF NOT EXISTS umt;'))
            conn.commit()
        logger.info("Database schema initialized")
    except Exception as e:
        logger.error(f"Error initializing database schema: {e}")
        raise

def main():
    """Main entry point for the agent runner."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Ultimate Marketing Team Agent Runner")
    parser.add_argument("--all-agents", action="store_true", help="Run all available agents")
    args = parser.parse_args()
    
    # Initialize the database schema
    initialize_database()
    
    # Determine which agents to run
    agent_names = []
    
    if args.all_agents:
        # Run all available agents
        agent_names = list(AGENT_CLASSES.keys())
    else:
        # Get agent names from environment variable
        env_agents = os.environ.get("AGENT_NAMES")
        if env_agents:
            agent_names = [name.strip() for name in env_agents.split(",")]
        else:
            # Fallback to single agent mode
            single_agent = os.environ.get("AGENT_NAME")
            if single_agent:
                agent_names = [single_agent]
    
    if not agent_names:
        logger.error("No agents specified. Set AGENT_NAME, AGENT_NAMES, or use --all-agents")
        sys.exit(1)
    
    logger.info(f"Starting {len(agent_names)} agents: {', '.join(agent_names)}")
    
    # Create a stop event for clean shutdown
    stop_event = threading.Event()
    
    # Start each agent in a separate thread
    threads = []
    for agent_name in agent_names:
        thread = threading.Thread(target=run_agent, args=(agent_name, stop_event))
        thread.daemon = True
        thread.start()
        threads.append(thread)
        # Short delay to avoid race conditions with message broker connections
        time.sleep(1)
    
    # Wait for KeyboardInterrupt to exit
    try:
        # Join threads to keep process running
        while True:
            # Check if all threads are alive
            alive_threads = [t for t in threads if t.is_alive()]
            if not alive_threads:
                logger.error("All agent threads have terminated")
                break
                
            # Sleep to avoid busy waiting
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Shutdown signal received, stopping all agents...")
        
    finally:
        # Signal threads to stop
        stop_event.set()
        
        # Wait for all threads to complete (with timeout)
        for thread in threads:
            thread.join(timeout=5)
        
        logger.info("All agents stopped")

if __name__ == "__main__":
    main()