"""
Agent runner module for starting the appropriate agent based on environment variables.
"""

import os
import sys
import time
from typing import Dict, Any, Optional
from loguru import logger

# Fix database connection for Docker containers
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@postgres:5432/ultimatemarketing"
os.environ["REDIS_URL"] = "redis://redis:6379/0"
os.environ["RABBITMQ_URL"] = "amqp://guest:guest@rabbitmq:5672/"

# Setup database connection
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Direct database connection
engine = create_engine("postgresql://postgres:postgres@postgres:5432/ultimatemarketing")

# Create schema if it doesn't exist
with engine.connect() as conn:
    conn.execute(text('CREATE SCHEMA IF NOT EXISTS umt;'))
    conn.commit()

# Import models
import src.models

# Agent imports
from src.agents.auth_integration_agent import AuthIntegrationAgent
from src.agents.brand_project_management_agent import BrandProjectManagementAgent
from src.agents.content_strategy_research_agent import ContentStrategyResearchAgent
from src.agents.content_creation_testing_agent import ContentCreationTestingAgent
from src.agents.content_ad_management_agent import ContentAdManagementAgent

def get_agent_class(agent_name: str):
    """Returns the appropriate agent class based on the agent name."""
    agent_classes = {
        "auth_integration_agent": AuthIntegrationAgent,
        "brand_project_management_agent": BrandProjectManagementAgent,
        "content_strategy_agent": ContentStrategyResearchAgent,
        "content_creation_agent": ContentCreationTestingAgent,
        "content_ad_management_agent": ContentAdManagementAgent
    }
    
    if agent_name not in agent_classes:
        raise ValueError(f"Unknown agent name: {agent_name}")
    
    return agent_classes[agent_name]

def main():
    """Main entry point for the agent runner."""
    # Get agent name from environment variable
    agent_name = os.environ.get("AGENT_NAME")
    if not agent_name:
        logger.error("AGENT_NAME environment variable not set")
        sys.exit(1)
    
    # Get the agent class
    try:
        AgentClass = get_agent_class(agent_name)
        logger.info(f"Starting agent: {agent_name}")
        
        # Create and start the agent
        agent = AgentClass(agent_id=agent_name, name=agent_name.replace("_", " ").title())
        agent.start()
        
        # Keep the process running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Shutting down agent...")
            agent.stop()
            
    except Exception as e:
        logger.error(f"Error starting agent {agent_name}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()