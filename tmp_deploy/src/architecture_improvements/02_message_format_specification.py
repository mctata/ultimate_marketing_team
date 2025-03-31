"""
Standardized message format specification for inter-agent communication.

This module defines standardized message formats for all types of messages
exchanged between agents, ensuring consistency in messaging patterns.
"""

from enum import Enum, auto
from typing import Any, Dict, List, Optional, TypeVar, Union
import uuid
from datetime import datetime
import json

T = TypeVar('T')  # Generic type for message payloads

class MessageType(Enum):
    """Enum for message types."""
    TASK = "task"
    EVENT = "event"
    RESPONSE = "response"
    ERROR = "error"
    HEARTBEAT = "heartbeat"
    SYSTEM = "system"

class MessagePriority(Enum):
    """Enum for message priorities."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"

class MessageStatus(Enum):
    """Enum for message processing status."""
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"
    THROTTLED = "throttled"
    CIRCUIT_OPEN = "circuit_open"

class Message:
    """Base class for all message types."""
    
    def __init__(
        self,
        message_type: MessageType,
        sender_agent_id: str,
        priority: MessagePriority = MessagePriority.NORMAL,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.message_id = str(uuid.uuid4())
        self.message_type = message_type
        self.timestamp = datetime.utcnow().isoformat()
        self.sender_agent_id = sender_agent_id
        self.priority = priority
        self.trace_context = trace_context or {}
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary for serialization."""
        return {
            "message_id": self.message_id,
            "message_type": self.message_type.value,
            "timestamp": self.timestamp,
            "sender_agent_id": self.sender_agent_id,
            "priority": self.priority.value,
            "trace_context": self.trace_context,
            "metadata": self.metadata,
        }
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Message':
        """Create a message from a dictionary."""
        message_type = MessageType(data.get("message_type", "system"))
        
        if message_type == MessageType.TASK:
            return TaskMessage.from_dict(data)
        elif message_type == MessageType.EVENT:
            return EventMessage.from_dict(data)
        elif message_type == MessageType.RESPONSE:
            return ResponseMessage.from_dict(data)
        elif message_type == MessageType.ERROR:
            return ErrorMessage.from_dict(data)
        elif message_type == MessageType.HEARTBEAT:
            return HeartbeatMessage.from_dict(data)
        else:
            return SystemMessage.from_dict(data)
    
    def to_json(self) -> str:
        """Convert message to JSON string."""
        return json.dumps(self.to_dict())
    
    @staticmethod
    def from_json(json_str: str) -> 'Message':
        """Create a message from a JSON string."""
        data = json.loads(json_str)
        return Message.from_dict(data)

class TaskMessage(Message):
    """Message representing a task to be processed by an agent."""
    
    def __init__(
        self,
        sender_agent_id: str,
        target_agent_id: str,
        task_type: str,
        payload: Dict[str, Any],
        priority: MessagePriority = MessagePriority.NORMAL,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        task_id: Optional[str] = None,
    ) -> None:
        super().__init__(
            message_type=MessageType.TASK,
            sender_agent_id=sender_agent_id,
            priority=priority,
            trace_context=trace_context,
            metadata=metadata,
        )
        self.task_id = task_id or str(uuid.uuid4())
        self.target_agent_id = target_agent_id
        self.task_type = task_type
        self.payload = payload
        self.status = MessageStatus.PENDING
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert task message to dictionary."""
        data = super().to_dict()
        data.update({
            "task_id": self.task_id,
            "target_agent_id": self.target_agent_id,
            "task_type": self.task_type,
            "payload": self.payload,
            "status": self.status.value,
        })
        return data
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'TaskMessage':
        """Create a task message from a dictionary."""
        return TaskMessage(
            sender_agent_id=data.get("sender_agent_id", "unknown"),
            target_agent_id=data.get("target_agent_id", "unknown"),
            task_type=data.get("task_type", "unknown"),
            payload=data.get("payload", {}),
            priority=MessagePriority(data.get("priority", "normal")),
            trace_context=data.get("trace_context", {}),
            metadata=data.get("metadata", {}),
            task_id=data.get("task_id"),
        )

class EventMessage(Message):
    """Message representing an event broadcasted by an agent."""
    
    def __init__(
        self,
        sender_agent_id: str,
        event_type: str,
        payload: Dict[str, Any],
        priority: MessagePriority = MessagePriority.NORMAL,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        event_id: Optional[str] = None,
    ) -> None:
        super().__init__(
            message_type=MessageType.EVENT,
            sender_agent_id=sender_agent_id,
            priority=priority,
            trace_context=trace_context,
            metadata=metadata,
        )
        self.event_id = event_id or str(uuid.uuid4())
        self.event_type = event_type
        self.payload = payload
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event message to dictionary."""
        data = super().to_dict()
        data.update({
            "event_id": self.event_id,
            "event_type": self.event_type,
            "payload": self.payload,
        })
        return data
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'EventMessage':
        """Create an event message from a dictionary."""
        return EventMessage(
            sender_agent_id=data.get("sender_agent_id", "unknown"),
            event_type=data.get("event_type", "unknown"),
            payload=data.get("payload", {}),
            priority=MessagePriority(data.get("priority", "normal")),
            trace_context=data.get("trace_context", {}),
            metadata=data.get("metadata", {}),
            event_id=data.get("event_id"),
        )

class ResponseMessage(Message):
    """Message representing a response to a task."""
    
    def __init__(
        self,
        sender_agent_id: str,
        target_agent_id: str,
        response_to: str,
        task_id: str,
        result: Any,
        status: MessageStatus = MessageStatus.SUCCESS,
        priority: MessagePriority = MessagePriority.NORMAL,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message_type=MessageType.RESPONSE,
            sender_agent_id=sender_agent_id,
            priority=priority,
            trace_context=trace_context,
            metadata=metadata,
        )
        self.target_agent_id = target_agent_id
        self.response_to = response_to
        self.task_id = task_id
        self.result = result
        self.status = status
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert response message to dictionary."""
        data = super().to_dict()
        data.update({
            "target_agent_id": self.target_agent_id,
            "response_to": self.response_to,
            "task_id": self.task_id,
            "result": self.result,
            "status": self.status.value,
        })
        return data
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'ResponseMessage':
        """Create a response message from a dictionary."""
        return ResponseMessage(
            sender_agent_id=data.get("sender_agent_id", "unknown"),
            target_agent_id=data.get("target_agent_id", "unknown"),
            response_to=data.get("response_to", "unknown"),
            task_id=data.get("task_id", "unknown"),
            result=data.get("result"),
            status=MessageStatus(data.get("status", "success")),
            priority=MessagePriority(data.get("priority", "normal")),
            trace_context=data.get("trace_context", {}),
            metadata=data.get("metadata", {}),
        )

class ErrorMessage(Message):
    """Message representing an error response to a task."""
    
    def __init__(
        self,
        sender_agent_id: str,
        target_agent_id: str,
        response_to: str,
        task_id: str,
        error: str,
        error_code: Optional[str] = None,
        error_details: Optional[Dict[str, Any]] = None,
        priority: MessagePriority = MessagePriority.NORMAL,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message_type=MessageType.ERROR,
            sender_agent_id=sender_agent_id,
            priority=priority,
            trace_context=trace_context,
            metadata=metadata,
        )
        self.target_agent_id = target_agent_id
        self.response_to = response_to
        self.task_id = task_id
        self.error = error
        self.error_code = error_code
        self.error_details = error_details or {}
        self.status = MessageStatus.ERROR
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error message to dictionary."""
        data = super().to_dict()
        data.update({
            "target_agent_id": self.target_agent_id,
            "response_to": self.response_to,
            "task_id": self.task_id,
            "error": self.error,
            "error_code": self.error_code,
            "error_details": self.error_details,
            "status": self.status.value,
        })
        return data
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'ErrorMessage':
        """Create an error message from a dictionary."""
        return ErrorMessage(
            sender_agent_id=data.get("sender_agent_id", "unknown"),
            target_agent_id=data.get("target_agent_id", "unknown"),
            response_to=data.get("response_to", "unknown"),
            task_id=data.get("task_id", "unknown"),
            error=data.get("error", "Unknown error"),
            error_code=data.get("error_code"),
            error_details=data.get("error_details", {}),
            priority=MessagePriority(data.get("priority", "normal")),
            trace_context=data.get("trace_context", {}),
            metadata=data.get("metadata", {}),
        )

class HeartbeatMessage(Message):
    """Message representing a heartbeat from an agent."""
    
    def __init__(
        self,
        sender_agent_id: str,
        status: str = "alive",
        metrics: Optional[Dict[str, Any]] = None,
        priority: MessagePriority = MessagePriority.LOW,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message_type=MessageType.HEARTBEAT,
            sender_agent_id=sender_agent_id,
            priority=priority,
            trace_context=trace_context,
            metadata=metadata,
        )
        self.status = status
        self.metrics = metrics or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert heartbeat message to dictionary."""
        data = super().to_dict()
        data.update({
            "status": self.status,
            "metrics": self.metrics,
        })
        return data
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'HeartbeatMessage':
        """Create a heartbeat message from a dictionary."""
        return HeartbeatMessage(
            sender_agent_id=data.get("sender_agent_id", "unknown"),
            status=data.get("status", "alive"),
            metrics=data.get("metrics", {}),
            priority=MessagePriority(data.get("priority", "low")),
            trace_context=data.get("trace_context", {}),
            metadata=data.get("metadata", {}),
        )

class SystemMessage(Message):
    """Message representing a system message."""
    
    def __init__(
        self,
        sender_agent_id: str,
        message: str,
        system_type: str = "info",
        priority: MessagePriority = MessagePriority.NORMAL,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(
            message_type=MessageType.SYSTEM,
            sender_agent_id=sender_agent_id,
            priority=priority,
            trace_context=trace_context,
            metadata=metadata,
        )
        self.message = message
        self.system_type = system_type
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert system message to dictionary."""
        data = super().to_dict()
        data.update({
            "message": self.message,
            "system_type": self.system_type,
        })
        return data
    
    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'SystemMessage':
        """Create a system message from a dictionary."""
        return SystemMessage(
            sender_agent_id=data.get("sender_agent_id", "unknown"),
            message=data.get("message", ""),
            system_type=data.get("system_type", "info"),
            priority=MessagePriority(data.get("priority", "normal")),
            trace_context=data.get("trace_context", {}),
            metadata=data.get("metadata", {}),
        )

class MessageFactory:
    """Factory for creating messages."""
    
    @staticmethod
    def create_task(
        sender_agent_id: str,
        target_agent_id: str,
        task_type: str,
        payload: Dict[str, Any],
        priority: MessagePriority = MessagePriority.NORMAL,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> TaskMessage:
        """Create a task message."""
        return TaskMessage(
            sender_agent_id=sender_agent_id,
            target_agent_id=target_agent_id,
            task_type=task_type,
            payload=payload,
            priority=priority,
            trace_context=trace_context,
            metadata=metadata,
        )
    
    @staticmethod
    def create_event(
        sender_agent_id: str,
        event_type: str,
        payload: Dict[str, Any],
        priority: MessagePriority = MessagePriority.NORMAL,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> EventMessage:
        """Create an event message."""
        return EventMessage(
            sender_agent_id=sender_agent_id,
            event_type=event_type,
            payload=payload,
            priority=priority,
            trace_context=trace_context,
            metadata=metadata,
        )
    
    @staticmethod
    def create_response(
        sender_agent_id: str,
        target_agent_id: str,
        response_to: str,
        task_id: str,
        result: Any,
        status: MessageStatus = MessageStatus.SUCCESS,
        priority: MessagePriority = MessagePriority.NORMAL,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ResponseMessage:
        """Create a response message."""
        return ResponseMessage(
            sender_agent_id=sender_agent_id,
            target_agent_id=target_agent_id,
            response_to=response_to,
            task_id=task_id,
            result=result,
            status=status,
            priority=priority,
            trace_context=trace_context,
            metadata=metadata,
        )
    
    @staticmethod
    def create_error(
        sender_agent_id: str,
        target_agent_id: str,
        response_to: str,
        task_id: str,
        error: str,
        error_code: Optional[str] = None,
        error_details: Optional[Dict[str, Any]] = None,
        priority: MessagePriority = MessagePriority.NORMAL,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ErrorMessage:
        """Create an error message."""
        return ErrorMessage(
            sender_agent_id=sender_agent_id,
            target_agent_id=target_agent_id,
            response_to=response_to,
            task_id=task_id,
            error=error,
            error_code=error_code,
            error_details=error_details,
            priority=priority,
            trace_context=trace_context,
            metadata=metadata,
        )
    
    @staticmethod
    def create_heartbeat(
        sender_agent_id: str,
        status: str = "alive",
        metrics: Optional[Dict[str, Any]] = None,
        priority: MessagePriority = MessagePriority.LOW,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> HeartbeatMessage:
        """Create a heartbeat message."""
        return HeartbeatMessage(
            sender_agent_id=sender_agent_id,
            status=status,
            metrics=metrics,
            priority=priority,
            trace_context=trace_context,
            metadata=metadata,
        )
    
    @staticmethod
    def create_system(
        sender_agent_id: str,
        message: str,
        system_type: str = "info",
        priority: MessagePriority = MessagePriority.NORMAL,
        trace_context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> SystemMessage:
        """Create a system message."""
        return SystemMessage(
            sender_agent_id=sender_agent_id,
            message=message,
            system_type=system_type,
            priority=priority,
            trace_context=trace_context,
            metadata=metadata,
        )