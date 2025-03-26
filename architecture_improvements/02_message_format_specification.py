"""
Standardized Message Format Specification
This module defines standardized message formats for all inter-agent communication.
"""

from enum import Enum, auto
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
import uuid
import json

# Message status enum
class MessageStatus(Enum):
    """Enum for message processing status."""
    PENDING = auto()
    PROCESSING = auto()
    COMPLETED = auto()
    FAILED = auto()
    REJECTED = auto()
    TIMEOUT = auto()

# Message priority enum
class MessagePriority(Enum):
    """Enum for message priority."""
    LOW = 0
    NORMAL = 1
    HIGH = 2
    CRITICAL = 3

# Message type enum
class MessageType(Enum):
    """Enum for message type."""
    TASK = "task"
    EVENT = "event"
    RESPONSE = "response"
    HEARTBEAT = "heartbeat"
    SYSTEM = "system"

@dataclass
class MessageHeader:
    """Standard header for all messages."""
    # Required fields
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    message_type: MessageType = MessageType.TASK
    sender_id: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    version: str = "1.0"
    
    # Optional fields
    correlation_id: Optional[str] = None  # For correlating related messages
    reply_to: Optional[str] = None  # Queue to send responses to
    expiration: Optional[str] = None  # Message expiration timestamp
    priority: MessagePriority = MessagePriority.NORMAL
    trace_id: Optional[str] = None  # For distributed tracing
    span_id: Optional[str] = None  # For distributed tracing
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with enum values converted to strings."""
        result = {}
        for key, value in self.__dict__.items():
            if isinstance(value, Enum):
                result[key] = value.value
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            else:
                result[key] = value
        return result

@dataclass
class TaskMessage:
    """Standard format for task messages."""
    # Header
    header: MessageHeader
    
    # Task-specific fields
    task_type: str
    payload: Dict[str, Any] = field(default_factory=dict)
    
    # Optional task fields
    timeout_seconds: Optional[int] = None
    retry_count: int = 0
    max_retries: int = 3
    idempotency_key: Optional[str] = None
    
    def __post_init__(self):
        """Ensure message type is set to TASK."""
        self.header.message_type = MessageType.TASK
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "header": self.header.to_dict(),
            "task_type": self.task_type,
            "payload": self.payload,
            "timeout_seconds": self.timeout_seconds,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "idempotency_key": self.idempotency_key
        }
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TaskMessage':
        """Create from dictionary."""
        header_data = data.get("header", {})
        header = MessageHeader(
            message_id=header_data.get("message_id", str(uuid.uuid4())),
            message_type=MessageType(header_data.get("message_type", MessageType.TASK.value)),
            sender_id=header_data.get("sender_id", ""),
            timestamp=header_data.get("timestamp", datetime.now().isoformat()),
            version=header_data.get("version", "1.0"),
            correlation_id=header_data.get("correlation_id"),
            reply_to=header_data.get("reply_to"),
            expiration=header_data.get("expiration"),
            priority=MessagePriority(header_data.get("priority", MessagePriority.NORMAL.value)),
            trace_id=header_data.get("trace_id"),
            span_id=header_data.get("span_id")
        )
        
        return cls(
            header=header,
            task_type=data.get("task_type", ""),
            payload=data.get("payload", {}),
            timeout_seconds=data.get("timeout_seconds"),
            retry_count=data.get("retry_count", 0),
            max_retries=data.get("max_retries", 3),
            idempotency_key=data.get("idempotency_key")
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> 'TaskMessage':
        """Create from JSON string."""
        return cls.from_dict(json.loads(json_str))
    
    def create_response(self, status: MessageStatus, payload: Dict[str, Any]) -> 'ResponseMessage':
        """Create a response message for this task."""
        response_header = MessageHeader(
            message_type=MessageType.RESPONSE,
            sender_id=self.header.sender_id,  # Will be overridden by the actual sender
            correlation_id=self.header.message_id,
            trace_id=self.header.trace_id,
            span_id=self.header.span_id
        )
        
        return ResponseMessage(
            header=response_header,
            status=status,
            payload=payload,
            task_type=self.task_type
        )

@dataclass
class EventMessage:
    """Standard format for event messages."""
    # Header
    header: MessageHeader
    
    # Event-specific fields
    event_type: str
    payload: Dict[str, Any] = field(default_factory=dict)
    
    # Optional event fields
    source_timestamp: Optional[str] = None  # When the event occurred (vs when message was created)
    event_version: str = "1.0"  # Event schema version
    
    def __post_init__(self):
        """Ensure message type is set to EVENT."""
        self.header.message_type = MessageType.EVENT
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "header": self.header.to_dict(),
            "event_type": self.event_type,
            "payload": self.payload,
            "source_timestamp": self.source_timestamp,
            "event_version": self.event_version
        }
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'EventMessage':
        """Create from dictionary."""
        header_data = data.get("header", {})
        header = MessageHeader(
            message_id=header_data.get("message_id", str(uuid.uuid4())),
            message_type=MessageType(header_data.get("message_type", MessageType.EVENT.value)),
            sender_id=header_data.get("sender_id", ""),
            timestamp=header_data.get("timestamp", datetime.now().isoformat()),
            version=header_data.get("version", "1.0"),
            correlation_id=header_data.get("correlation_id"),
            reply_to=header_data.get("reply_to"),
            expiration=header_data.get("expiration"),
            priority=MessagePriority(header_data.get("priority", MessagePriority.NORMAL.value)),
            trace_id=header_data.get("trace_id"),
            span_id=header_data.get("span_id")
        )
        
        return cls(
            header=header,
            event_type=data.get("event_type", ""),
            payload=data.get("payload", {}),
            source_timestamp=data.get("source_timestamp"),
            event_version=data.get("event_version", "1.0")
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> 'EventMessage':
        """Create from JSON string."""
        return cls.from_dict(json.loads(json_str))

@dataclass
class ResponseMessage:
    """Standard format for response messages."""
    # Header
    header: MessageHeader
    
    # Response-specific fields
    status: MessageStatus
    payload: Dict[str, Any] = field(default_factory=dict)
    
    # References to the original task
    task_type: Optional[str] = None
    
    # Optional response fields
    processing_time_ms: Optional[int] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    
    def __post_init__(self):
        """Ensure message type is set to RESPONSE."""
        self.header.message_type = MessageType.RESPONSE
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "header": self.header.to_dict(),
            "status": self.status.value,
            "payload": self.payload,
            "task_type": self.task_type,
            "processing_time_ms": self.processing_time_ms,
            "error_code": self.error_code,
            "error_message": self.error_message
        }
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ResponseMessage':
        """Create from dictionary."""
        header_data = data.get("header", {})
        header = MessageHeader(
            message_id=header_data.get("message_id", str(uuid.uuid4())),
            message_type=MessageType(header_data.get("message_type", MessageType.RESPONSE.value)),
            sender_id=header_data.get("sender_id", ""),
            timestamp=header_data.get("timestamp", datetime.now().isoformat()),
            version=header_data.get("version", "1.0"),
            correlation_id=header_data.get("correlation_id"),
            reply_to=header_data.get("reply_to"),
            expiration=header_data.get("expiration"),
            priority=MessagePriority(header_data.get("priority", MessagePriority.NORMAL.value)),
            trace_id=header_data.get("trace_id"),
            span_id=header_data.get("span_id")
        )
        
        return cls(
            header=header,
            status=MessageStatus(data.get("status", MessageStatus.COMPLETED.value)),
            payload=data.get("payload", {}),
            task_type=data.get("task_type"),
            processing_time_ms=data.get("processing_time_ms"),
            error_code=data.get("error_code"),
            error_message=data.get("error_message")
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> 'ResponseMessage':
        """Create from JSON string."""
        return cls.from_dict(json.loads(json_str))

@dataclass
class HeartbeatMessage:
    """Standard format for heartbeat messages."""
    # Header
    header: MessageHeader
    
    # Heartbeat-specific fields
    agent_status: str = "ACTIVE"  # ACTIVE, BUSY, DEGRADED, STARTING, STOPPING
    metrics: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Ensure message type is set to HEARTBEAT."""
        self.header.message_type = MessageType.HEARTBEAT
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "header": self.header.to_dict(),
            "agent_status": self.agent_status,
            "metrics": self.metrics
        }
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'HeartbeatMessage':
        """Create from dictionary."""
        header_data = data.get("header", {})
        header = MessageHeader(
            message_id=header_data.get("message_id", str(uuid.uuid4())),
            message_type=MessageType(header_data.get("message_type", MessageType.HEARTBEAT.value)),
            sender_id=header_data.get("sender_id", ""),
            timestamp=header_data.get("timestamp", datetime.now().isoformat()),
            version=header_data.get("version", "1.0"),
            correlation_id=header_data.get("correlation_id"),
            reply_to=header_data.get("reply_to"),
            expiration=header_data.get("expiration"),
            priority=MessagePriority(header_data.get("priority", MessagePriority.NORMAL.value)),
            trace_id=header_data.get("trace_id"),
            span_id=header_data.get("span_id")
        )
        
        return cls(
            header=header,
            agent_status=data.get("agent_status", "ACTIVE"),
            metrics=data.get("metrics", {})
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> 'HeartbeatMessage':
        """Create from JSON string."""
        return cls.from_dict(json.loads(json_str))

@dataclass
class SystemMessage:
    """Standard format for system messages."""
    # Header
    header: MessageHeader
    
    # System-specific fields
    command: str  # e.g., "SHUTDOWN", "RESTART", "CONFIG_UPDATE"
    parameters: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Ensure message type is set to SYSTEM."""
        self.header.message_type = MessageType.SYSTEM
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "header": self.header.to_dict(),
            "command": self.command,
            "parameters": self.parameters
        }
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SystemMessage':
        """Create from dictionary."""
        header_data = data.get("header", {})
        header = MessageHeader(
            message_id=header_data.get("message_id", str(uuid.uuid4())),
            message_type=MessageType(header_data.get("message_type", MessageType.SYSTEM.value)),
            sender_id=header_data.get("sender_id", ""),
            timestamp=header_data.get("timestamp", datetime.now().isoformat()),
            version=header_data.get("version", "1.0"),
            correlation_id=header_data.get("correlation_id"),
            reply_to=header_data.get("reply_to"),
            expiration=header_data.get("expiration"),
            priority=MessagePriority(header_data.get("priority", MessagePriority.NORMAL.value)),
            trace_id=header_data.get("trace_id"),
            span_id=header_data.get("span_id")
        )
        
        return cls(
            header=header,
            command=data.get("command", ""),
            parameters=data.get("parameters", {})
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> 'SystemMessage':
        """Create from JSON string."""
        return cls.from_dict(json.loads(json_str))

# Message factory
class MessageFactory:
    """Factory for creating messages."""
    
    @staticmethod
    def create_task_message(sender_id: str, task_type: str, payload: Dict[str, Any], 
                           reply_to: Optional[str] = None, correlation_id: Optional[str] = None,
                           priority: MessagePriority = MessagePriority.NORMAL,
                           timeout_seconds: Optional[int] = None,
                           trace_id: Optional[str] = None,
                           span_id: Optional[str] = None) -> TaskMessage:
        """Create a new task message."""
        header = MessageHeader(
            message_type=MessageType.TASK,
            sender_id=sender_id,
            correlation_id=correlation_id,
            reply_to=reply_to,
            priority=priority,
            trace_id=trace_id,
            span_id=span_id
        )
        
        return TaskMessage(
            header=header,
            task_type=task_type,
            payload=payload,
            timeout_seconds=timeout_seconds
        )
    
    @staticmethod
    def create_event_message(sender_id: str, event_type: str, payload: Dict[str, Any],
                            correlation_id: Optional[str] = None,
                            priority: MessagePriority = MessagePriority.NORMAL,
                            source_timestamp: Optional[str] = None,
                            trace_id: Optional[str] = None,
                            span_id: Optional[str] = None) -> EventMessage:
        """Create a new event message."""
        header = MessageHeader(
            message_type=MessageType.EVENT,
            sender_id=sender_id,
            correlation_id=correlation_id,
            priority=priority,
            trace_id=trace_id,
            span_id=span_id
        )
        
        return EventMessage(
            header=header,
            event_type=event_type,
            payload=payload,
            source_timestamp=source_timestamp
        )
    
    @staticmethod
    def create_response_message(sender_id: str, status: MessageStatus, payload: Dict[str, Any],
                              correlation_id: str,
                              task_type: Optional[str] = None,
                              processing_time_ms: Optional[int] = None,
                              error_code: Optional[str] = None,
                              error_message: Optional[str] = None,
                              trace_id: Optional[str] = None,
                              span_id: Optional[str] = None) -> ResponseMessage:
        """Create a new response message."""
        header = MessageHeader(
            message_type=MessageType.RESPONSE,
            sender_id=sender_id,
            correlation_id=correlation_id,
            trace_id=trace_id,
            span_id=span_id
        )
        
        return ResponseMessage(
            header=header,
            status=status,
            payload=payload,
            task_type=task_type,
            processing_time_ms=processing_time_ms,
            error_code=error_code,
            error_message=error_message
        )
    
    @staticmethod
    def create_heartbeat_message(sender_id: str, agent_status: str = "ACTIVE",
                               metrics: Dict[str, Any] = None,
                               trace_id: Optional[str] = None,
                               span_id: Optional[str] = None) -> HeartbeatMessage:
        """Create a new heartbeat message."""
        header = MessageHeader(
            message_type=MessageType.HEARTBEAT,
            sender_id=sender_id,
            trace_id=trace_id,
            span_id=span_id
        )
        
        return HeartbeatMessage(
            header=header,
            agent_status=agent_status,
            metrics=metrics or {}
        )
    
    @staticmethod
    def create_system_message(sender_id: str, command: str, parameters: Dict[str, Any] = None,
                            priority: MessagePriority = MessagePriority.HIGH,
                            trace_id: Optional[str] = None,
                            span_id: Optional[str] = None) -> SystemMessage:
        """Create a new system message."""
        header = MessageHeader(
            message_type=MessageType.SYSTEM,
            sender_id=sender_id,
            priority=priority,
            trace_id=trace_id,
            span_id=span_id
        )
        
        return SystemMessage(
            header=header,
            command=command,
            parameters=parameters or {}
        )
    
    @staticmethod
    def from_json(json_str: str) -> Union[TaskMessage, EventMessage, ResponseMessage, HeartbeatMessage, SystemMessage]:
        """Create a message from a JSON string."""
        data = json.loads(json_str)
        header_data = data.get("header", {})
        message_type = header_data.get("message_type")
        
        if message_type == MessageType.TASK.value:
            return TaskMessage.from_json(json_str)
        elif message_type == MessageType.EVENT.value:
            return EventMessage.from_json(json_str)
        elif message_type == MessageType.RESPONSE.value:
            return ResponseMessage.from_json(json_str)
        elif message_type == MessageType.HEARTBEAT.value:
            return HeartbeatMessage.from_json(json_str)
        elif message_type == MessageType.SYSTEM.value:
            return SystemMessage.from_json(json_str)
        else:
            raise ValueError(f"Unknown message type: {message_type}")

# Batch message for processing multiple messages in a single transaction
@dataclass
class BatchMessage:
    """Batch of messages to be processed together."""
    # Header
    header: MessageHeader
    
    # Batch-specific fields
    messages: List[Union[TaskMessage, EventMessage, ResponseMessage, HeartbeatMessage, SystemMessage]]
    batch_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    transaction: bool = False  # Whether the messages should be processed as a transaction
    
    def __post_init__(self):
        """Ensure all messages have the same trace_id and transaction is set correctly."""
        if self.header.trace_id:
            for message in self.messages:
                if not message.header.trace_id:
                    message.header.trace_id = self.header.trace_id
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "header": self.header.to_dict(),
            "batch_id": self.batch_id,
            "transaction": self.transaction,
            "messages": [message.to_dict() for message in self.messages]
        }
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BatchMessage':
        """Create from dictionary."""
        header_data = data.get("header", {})
        header = MessageHeader(
            message_id=header_data.get("message_id", str(uuid.uuid4())),
            message_type=MessageType(header_data.get("message_type", MessageType.TASK.value)),
            sender_id=header_data.get("sender_id", ""),
            timestamp=header_data.get("timestamp", datetime.now().isoformat()),
            version=header_data.get("version", "1.0"),
            correlation_id=header_data.get("correlation_id"),
            reply_to=header_data.get("reply_to"),
            expiration=header_data.get("expiration"),
            priority=MessagePriority(header_data.get("priority", MessagePriority.NORMAL.value)),
            trace_id=header_data.get("trace_id"),
            span_id=header_data.get("span_id")
        )
        
        messages = []
        for message_data in data.get("messages", []):
            message_header = message_data.get("header", {})
            message_type = message_header.get("message_type")
            
            if message_type == MessageType.TASK.value:
                messages.append(TaskMessage.from_dict(message_data))
            elif message_type == MessageType.EVENT.value:
                messages.append(EventMessage.from_dict(message_data))
            elif message_type == MessageType.RESPONSE.value:
                messages.append(ResponseMessage.from_dict(message_data))
            elif message_type == MessageType.HEARTBEAT.value:
                messages.append(HeartbeatMessage.from_dict(message_data))
            elif message_type == MessageType.SYSTEM.value:
                messages.append(SystemMessage.from_dict(message_data))
        
        return cls(
            header=header,
            batch_id=data.get("batch_id", str(uuid.uuid4())),
            transaction=data.get("transaction", False),
            messages=messages
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> 'BatchMessage':
        """Create from JSON string."""
        return cls.from_dict(json.loads(json_str))