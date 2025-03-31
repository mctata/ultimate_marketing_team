"""
Agent runner module for starting the consolidated marketing agent.
This optimized version reduces resource usage by combining multiple agent types.
"""

import os
import sys
import time
import threading
import argparse
from typing import Dict, Any, List, Optional
from loguru import logger

# Use environment variables for service connections, with defaults for Docker
database_url = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/ultimatemarketing")
redis_url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
rabbitmq_url = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")

# Setup database connection
from sqlalchemy import create_engine, text

# Import the consolidated agent
from src.agents.base_agent import BaseAgent

class ConsolidatedMarketingAgent(BaseAgent):
    """
    Consolidated marketing agent that combines functionality from:
    - Auth & Integration
    - Brand & Project Management
    - Content Creation
    
    This reduces container count and resource usage.
    """
    
    def __init__(self, agent_id: str, name: str):
        super().__init__(agent_id=agent_id, name=name)
        self.register_handlers()
        
    def register_handlers(self):
        """Register message handlers for all agent functionalities."""
        # Auth & Integration handlers
        self.register_task_handler("authenticate_user", self.handle_authentication)
        self.register_task_handler("integrate_service", self.handle_integration)
        
        # Brand & Project Management handlers
        self.register_task_handler("create_brand", self.handle_brand_creation)
        self.register_task_handler("create_project", self.handle_project_creation)
        
        # Content Creation handlers
        self.register_task_handler("generate_content", self.handle_content_generation)
        self.register_task_handler("optimize_content", self.handle_content_optimization)
        
        # Additional handlers can be added as needed
        
    def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task assigned to this agent.
        
        This method handles generic tasks that don't have specific handlers.
        All specialized tasks are routed to their specific handlers via register_task_handler.
        
        Args:
            task: A dictionary containing task details
            
        Returns:
            A dictionary containing the task result
        """
        task_type = task.get("task_type", "unknown")
        logger.warning(f"No specific handler for task type: {task_type}, using generic processing")
        
        # Process the task generically based on category
        category = task.get("category", "general")
        
        if category == "auth":
            return {"status": "processed", "message": f"Auth task {task_type} processed generically"}
        elif category == "brand":
            return {"status": "processed", "message": f"Brand task {task_type} processed generically"}
        elif category == "content":
            return {"status": "processed", "message": f"Content task {task_type} processed generically"}
        else:
            return {"status": "processed", "message": f"General task {task_type} processed generically"}
        
    # Authentication and integration handlers
    def handle_authentication(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle user authentication tasks."""
        user_id = task_data.get("user_id")
        logger.info(f"Processing authentication for user: {user_id}")
        # Simplified authentication logic
        return {"success": True, "user_id": user_id}
    
    def handle_integration(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle service integration tasks."""
        service_type = task_data.get("service_type")
        logger.info(f"Processing integration for service: {service_type}")
        # Simplified integration logic
        return {"success": True, "service_type": service_type}
    
    # Brand & Project Management handlers
    def handle_brand_creation(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle brand creation tasks."""
        brand_name = task_data.get("name")
        logger.info(f"Creating brand: {brand_name}")
        # Simplified brand creation logic
        return {"success": True, "brand_name": brand_name}
    
    def handle_project_creation(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle project creation tasks."""
        project_name = task_data.get("name")
        logger.info(f"Creating project: {project_name}")
        # Simplified project creation logic
        return {"success": True, "project_name": project_name}
    
    # Content Creation handlers
    def handle_content_generation(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle content generation tasks."""
        content_type = task_data.get("content_type")
        logger.info(f"Generating content of type: {content_type}")
        # Simplified content generation logic
        return {"success": True, "content_type": content_type}
    
    def handle_content_optimization(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle content optimization tasks."""
        content_id = task_data.get("content_id")
        logger.info(f"Optimizing content: {content_id}")
        # Simplified content optimization logic
        return {"success": True, "content_id": content_id}

# Available agent classes - just using the consolidated agent
AGENT_CLASSES = {
    "marketing_agent": ConsolidatedMarketingAgent,
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
        agent = AgentClass(agent_id=agent_name, name="Consolidated Marketing Agent")
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
    # Create a database connection using the environment variable
    engine = create_engine(database_url)
    
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
    
    # In the optimized version, we just run the consolidated agent
    agent_names = ["marketing_agent"]
    
    logger.info(f"Starting consolidated marketing agent")
    
    # Create a stop event for clean shutdown
    stop_event = threading.Event()
    
    # Start the agent in a separate thread
    thread = threading.Thread(target=run_agent, args=(agent_names[0], stop_event))
    thread.daemon = True
    thread.start()
    
    # Wait for KeyboardInterrupt to exit
    try:
        # Keep process running while thread is alive
        while thread.is_alive():
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Shutdown signal received, stopping agent...")
        
    finally:
        # Signal thread to stop
        stop_event.set()
        
        # Wait for thread to complete (with timeout)
        thread.join(timeout=5)
        
        logger.info("Agent stopped")

if __name__ == "__main__":
    main()