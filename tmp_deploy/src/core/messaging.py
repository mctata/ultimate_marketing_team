import json
import uuid
import pika
import asyncio
from typing import Dict, Any, Callable, Awaitable, Optional, List
from loguru import logger
from datetime import datetime

from src.core.settings import settings

class RabbitMQClient:
    """Client for interacting with RabbitMQ."""
    
    def __init__(self):
        self.connection = None
        self.channel = None
        self.queue_prefix = settings.RABBITMQ_QUEUE_PREFIX
        self.callbacks = {}
        
    def connect(self):
        """Connect to RabbitMQ server."""
        if not self.connection or self.connection.is_closed:
            params = pika.URLParameters(str(settings.RABBITMQ_URL))
            self.connection = pika.BlockingConnection(params)
            self.channel = self.connection.channel()
            logger.info("Connected to RabbitMQ")
    
    def close(self):
        """Close the connection to RabbitMQ."""
        if self.connection and self.connection.is_open:
            self.connection.close()
            logger.info("Closed RabbitMQ connection")
    
    def declare_queue(self, queue_name: str) -> str:
        """Declare a queue with the given name."""
        prefixed_name = f"{self.queue_prefix}{queue_name}"
        self.connect()
        self.channel.queue_declare(queue=prefixed_name, durable=True)
        return prefixed_name
    
    def declare_exchange(self, exchange_name: str) -> str:
        """Declare a topic exchange with the given name."""
        prefixed_name = f"{self.queue_prefix}{exchange_name}"
        self.connect()
        self.channel.exchange_declare(exchange=prefixed_name, exchange_type='topic', durable=True)
        return prefixed_name
    
    def bind_queue_to_exchange(self, queue_name: str, exchange_name: str, routing_key: str):
        """Bind a queue to an exchange with a routing key."""
        prefixed_queue = f"{self.queue_prefix}{queue_name}"
        prefixed_exchange = f"{self.queue_prefix}{exchange_name}"
        self.connect()
        self.channel.queue_bind(
            queue=prefixed_queue,
            exchange=prefixed_exchange,
            routing_key=routing_key
        )
    
    def publish(self, exchange: str, routing_key: str, message: Dict[str, Any]) -> None:
        """Publish a message to an exchange with a routing key."""
        prefixed_exchange = f"{self.queue_prefix}{exchange}"
        self.connect()
        
        # Add message ID and timestamp if not present
        if 'message_id' not in message:
            message['message_id'] = str(uuid.uuid4())
        if 'timestamp' not in message:
            message['timestamp'] = datetime.now().isoformat()
        
        self.channel.basic_publish(
            exchange=prefixed_exchange,
            routing_key=routing_key,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
                content_type='application/json',
                message_id=message['message_id']
            )
        )
        logger.debug(f"Published message to {prefixed_exchange}/{routing_key}: {message['message_id']}")
    
    def publish_direct(self, queue: str, message: Dict[str, Any]) -> None:
        """Publish a message directly to a queue."""
        prefixed_queue = f"{self.queue_prefix}{queue}"
        self.connect()
        
        # Add message ID and timestamp if not present
        if 'message_id' not in message:
            message['message_id'] = str(uuid.uuid4())
        if 'timestamp' not in message:
            message['timestamp'] = datetime.now().isoformat()
        
        self.channel.basic_publish(
            exchange='',
            routing_key=prefixed_queue,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
                content_type='application/json',
                message_id=message['message_id']
            )
        )
        logger.debug(f"Published message directly to {prefixed_queue}: {message['message_id']}")
    
    def consume(self, queue: str, callback: Callable[[Dict[str, Any]], None]):
        """Start consuming messages from a queue."""
        prefixed_queue = f"{self.queue_prefix}{queue}"
        self.connect()
        
        def _callback(ch, method, properties, body):
            try:
                message = json.loads(body)
                callback(message)
                ch.basic_ack(delivery_tag=method.delivery_tag)
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                # Negative acknowledgment, requeue the message
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        
        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(queue=prefixed_queue, on_message_callback=_callback)
        
        try:
            logger.info(f"Start consuming from {prefixed_queue}")
            self.channel.start_consuming()
        except KeyboardInterrupt:
            self.channel.stop_consuming()
            self.close()
        except Exception as e:
            logger.error(f"Error in consume: {e}")
            self.channel.stop_consuming()
            self.close()


class AsyncRabbitMQClient:
    """Asynchronous client for interacting with RabbitMQ."""
    
    def __init__(self):
        self.connection = None
        self.channel = None
        self.queue_prefix = settings.RABBITMQ_QUEUE_PREFIX
        self.callbacks = {}
    
    async def connect(self):
        """Connect to RabbitMQ server asynchronously."""
        if not self.connection or self.connection.is_closed:
            from aio_pika import connect_robust
            self.connection = await connect_robust(str(settings.RABBITMQ_URL))
            self.channel = await self.connection.channel()
            logger.info("Connected to RabbitMQ (async)")
    
    async def close(self):
        """Close the connection to RabbitMQ."""
        if self.connection and not self.connection.is_closed:
            await self.connection.close()
            logger.info("Closed RabbitMQ connection (async)")
    
    async def declare_queue(self, queue_name: str) -> str:
        """Declare a queue with the given name."""
        prefixed_name = f"{self.queue_prefix}{queue_name}"
        await self.connect()
        queue = await self.channel.declare_queue(prefixed_name, durable=True)
        return prefixed_name
    
    async def declare_exchange(self, exchange_name: str) -> str:
        """Declare a topic exchange with the given name."""
        from aio_pika import ExchangeType
        prefixed_name = f"{self.queue_prefix}{exchange_name}"
        await self.connect()
        exchange = await self.channel.declare_exchange(
            name=prefixed_name,
            type=ExchangeType.TOPIC,
            durable=True
        )
        return prefixed_name
    
    async def bind_queue_to_exchange(self, queue_name: str, exchange_name: str, routing_key: str):
        """Bind a queue to an exchange with a routing key."""
        prefixed_queue = f"{self.queue_prefix}{queue_name}"
        prefixed_exchange = f"{self.queue_prefix}{exchange_name}"
        await self.connect()
        
        queue = await self.channel.declare_queue(prefixed_queue, durable=True)
        exchange = await self.channel.get_exchange(prefixed_exchange)
        await queue.bind(exchange, routing_key=routing_key)
    
    async def publish(self, exchange: str, routing_key: str, message: Dict[str, Any]) -> None:
        """Publish a message to an exchange with a routing key."""
        from aio_pika import Message
        prefixed_exchange = f"{self.queue_prefix}{exchange}"
        await self.connect()
        
        # Add message ID and timestamp if not present
        if 'message_id' not in message:
            message['message_id'] = str(uuid.uuid4())
        if 'timestamp' not in message:
            from datetime import datetime
            message['timestamp'] = datetime.now().isoformat()
        
        exchange_obj = await self.channel.get_exchange(prefixed_exchange)
        
        await exchange_obj.publish(
            Message(
                body=json.dumps(message).encode(),
                content_type='application/json',
                message_id=message['message_id'],
                delivery_mode=2  # make message persistent
            ),
            routing_key=routing_key
        )
        logger.debug(f"Published message to {prefixed_exchange}/{routing_key}: {message['message_id']}")
    
    async def publish_direct(self, queue: str, message: Dict[str, Any]) -> None:
        """Publish a message directly to a queue."""
        from aio_pika import Message
        prefixed_queue = f"{self.queue_prefix}{queue}"
        await self.connect()
        
        # Add message ID and timestamp if not present
        if 'message_id' not in message:
            message['message_id'] = str(uuid.uuid4())
        if 'timestamp' not in message:
            from datetime import datetime
            message['timestamp'] = datetime.now().isoformat()
        
        queue = await self.channel.declare_queue(prefixed_queue, durable=True)
        
        await self.channel.default_exchange.publish(
            Message(
                body=json.dumps(message).encode(),
                content_type='application/json',
                message_id=message['message_id'],
                delivery_mode=2  # make message persistent
            ),
            routing_key=prefixed_queue
        )
        logger.debug(f"Published message directly to {prefixed_queue}: {message['message_id']}")
    
    async def consume(self, queue: str, callback: Callable[[Dict[str, Any]], Awaitable[None]]):
        """Start consuming messages from a queue."""
        prefixed_queue = f"{self.queue_prefix}{queue}"
        await self.connect()
        
        queue_obj = await self.channel.declare_queue(prefixed_queue, durable=True)
        
        async def _callback(message):
            async with message.process():
                try:
                    message_body = json.loads(message.body.decode())
                    await callback(message_body)
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    # Requeue the message
                    await message.nack(requeue=True)
        
        # Set prefetch count
        await self.channel.set_qos(prefetch_count=1)
        
        # Start consuming
        await queue_obj.consume(_callback)
        logger.info(f"Start consuming from {prefixed_queue} (async)")
        
        # Keep the coroutine alive
        while True:
            await asyncio.sleep(1)
