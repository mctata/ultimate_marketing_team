#!/usr/bin/env python3
"""
WebSocket Client for testing the Calendar WebSocket feature.
This script connects to the WebSocket server and sends/receives messages.
"""

import asyncio
import websockets
import json
import time
import jwt
import argparse
from datetime import datetime, timedelta


def create_test_token(user_id="1", secret="your-jwt-secret-key"):
    """Create a test JWT token for authenticating WebSocket connections."""
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, secret, algorithm="HS256")


async def send_message(websocket, message_type, **kwargs):
    """Send a message to the WebSocket server."""
    message = {"type": message_type, **kwargs}
    await websocket.send(json.dumps(message))
    print(f"Sent message: {json.dumps(message, indent=2)}")


async def connect_and_test(uri, token, project_id, interactive=False):
    """Connect to WebSocket and test calendar functionality."""
    ws_uri = f"{uri}?token={token}"
    
    async with websockets.connect(ws_uri) as websocket:
        print(f"Connected to {uri}")
        
        # Listen for messages in the background
        listen_task = asyncio.create_task(listen_for_messages(websocket))
        
        try:
            # Join a project
            await send_message(websocket, "join_project", 
                               project_id=project_id,
                               user_data={"name": "Test User", "email": "test@example.com"})
            
            # Wait for a moment to receive messages
            await asyncio.sleep(2)
            
            if interactive:
                await interactive_mode(websocket, project_id)
            else:
                # Lock a content item
                await send_message(websocket, "lock_content", 
                                  content_id="1", 
                                  user_data={"name": "Test User"})
                
                # Wait for a moment
                await asyncio.sleep(2)
                
                # Unlock the content
                await send_message(websocket, "unlock_content", content_id="1")
                
                # Wait for a moment
                await asyncio.sleep(2)
                
                # Start an operation
                operation_id = f"op-{int(time.time())}"
                await send_message(websocket, "start_operation",
                                  operation_id=operation_id,
                                  operation_type="update",
                                  content_id="2",
                                  data={"field": "title", "value": "Updated Title"})
                
                # Wait for a moment
                await asyncio.sleep(2)
                
                # Complete the operation
                await send_message(websocket, "complete_operation",
                                  operation_id=operation_id,
                                  content_id="2")
                
                # Leave the project
                await send_message(websocket, "leave_project", project_id=project_id)
                
                # Wait for response messages
                await asyncio.sleep(2)
        
        finally:
            # Cancel the listening task
            listen_task.cancel()
            
            print("Disconnected from WebSocket")


async def listen_for_messages(websocket):
    """Listen for messages from the WebSocket server."""
    try:
        while True:
            message = await websocket.recv()
            try:
                parsed = json.loads(message)
                print("\nReceived message:")
                print(json.dumps(parsed, indent=2))
            except json.JSONDecodeError:
                print(f"\nReceived non-JSON message: {message}")
    except asyncio.CancelledError:
        # Task was cancelled, just exit
        pass
    except Exception as e:
        print(f"Error listening for messages: {e}")


async def interactive_mode(websocket, project_id):
    """Run an interactive WebSocket client session."""
    print("\n=== Interactive WebSocket Client ===")
    print("Available commands:")
    print("  join - Join project")
    print("  leave - Leave project")
    print("  lock <id> - Lock content item")
    print("  unlock <id> - Unlock content item")
    print("  users - List active users")
    print("  ping - Send ping message")
    print("  op <id> <type> - Start operation")
    print("  complete <op_id> <content_id> - Complete operation")
    print("  quit - Exit the client")
    
    while True:
        command = input("\nEnter command: ").strip()
        
        if command.lower() == "quit":
            break
            
        elif command.lower() == "join":
            await send_message(websocket, "join_project", 
                             project_id=project_id,
                             user_data={"name": "Interactive User"})
                             
        elif command.lower() == "leave":
            await send_message(websocket, "leave_project", project_id=project_id)
            
        elif command.lower().startswith("lock "):
            content_id = command[5:].strip()
            await send_message(websocket, "lock_content", 
                             content_id=content_id, 
                             user_data={"name": "Interactive User"})
                             
        elif command.lower().startswith("unlock "):
            content_id = command[7:].strip()
            await send_message(websocket, "unlock_content", content_id=content_id)
            
        elif command.lower() == "ping":
            await send_message(websocket, "ping")
            
        elif command.lower().startswith("op "):
            parts = command[3:].strip().split()
            if len(parts) >= 2:
                content_id = parts[0]
                op_type = parts[1]
                await send_message(websocket, "start_operation",
                                 operation_id=f"op-{int(time.time())}",
                                 operation_type=op_type,
                                 content_id=content_id,
                                 data={"interactive": True})
            else:
                print("Usage: op <content_id> <operation_type>")
                
        elif command.lower().startswith("complete "):
            parts = command[9:].strip().split()
            if len(parts) >= 2:
                op_id = parts[0]
                content_id = parts[1]
                await send_message(websocket, "complete_operation",
                                 operation_id=op_id,
                                 content_id=content_id)
            else:
                print("Usage: complete <operation_id> <content_id>")
                
        else:
            print(f"Unknown command: {command}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WebSocket Client for testing the Calendar WebSocket")
    parser.add_argument("--uri", default="ws://localhost:8000/ws/calendar", 
                        help="WebSocket URI (default: ws://localhost:8000/ws/calendar)")
    parser.add_argument("--token", default=None, 
                        help="JWT token for authentication (default: auto-generated)")
    parser.add_argument("--secret", default="your-jwt-secret-key", 
                        help="JWT secret key for generating tokens")
    parser.add_argument("--user-id", default="1", 
                        help="User ID to include in the JWT token")
    parser.add_argument("--project-id", default="1", 
                        help="Project ID to join")
    parser.add_argument("--interactive", action="store_true", 
                        help="Run in interactive mode")

    args = parser.parse_args()
    
    # Create token if not provided
    token = args.token if args.token else create_test_token(args.user_id, args.secret)
    
    # Run the WebSocket client
    asyncio.run(connect_and_test(args.uri, token, args.project_id, args.interactive))