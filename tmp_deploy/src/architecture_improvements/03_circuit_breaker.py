"""
Circuit breaker implementation with exponential backoff and monitoring.

This module implements the circuit breaker pattern to prevent cascading failures
by automatically detecting failures and encapsulating the logic of preventing a
failure from constantly recurring.
"""

import time
import logging
import random
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, TypeVar, Union, cast
from functools import wraps
import threading
from datetime import datetime, timedelta

T = TypeVar('T')  # Return type of the function being protected
logger = logging.getLogger(__name__)

class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"      # Normal operation, calls pass through
    OPEN = "open"          # Failure threshold exceeded, calls fail fast
    HALF_OPEN = "half_open"  # Testing if service is available again


class CircuitBreakerError(Exception):
    """Exception raised when a circuit breaker is open."""
    
    def __init__(self, message: str, breaker_name: str) -> None:
        self.breaker_name = breaker_name
        super().__init__(f"Circuit breaker '{breaker_name}' is open: {message}")


class CircuitBreaker:
    """
    Implementation of the circuit breaker pattern.
    
    This class monitors the success/failure of function calls and
    opens the circuit (fails fast) when the failure threshold is exceeded.
    After a timeout, it enters a half-open state to test if the service
    has recovered.
    """
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 30,
        half_open_max_calls: int = 3,
        exception_types: Optional[List[type]] = None,
    ) -> None:
        """
        Initialize a new circuit breaker.
        
        Args:
            name: Name of the circuit breaker, used for identification
            failure_threshold: Number of failures before opening the circuit
            recovery_timeout: Seconds to wait before trying half-open state
            half_open_max_calls: Max calls to allow in half-open state
            exception_types: Types of exceptions that count as failures
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        self.exception_types = exception_types or [Exception]
        
        self._state = CircuitState.CLOSED
        self._failures = 0
        self._last_failure_time: Optional[datetime] = None
        self._state_change_time = datetime.utcnow()
        self._half_open_calls = 0
        self._lock = threading.RLock()
        self._call_count = 0
        self._success_count = 0
        self._error_count = 0
        
        # Register with the circuit breaker monitor
        CircuitBreakerMonitor.register(self)
    
    @property
    def state(self) -> CircuitState:
        """Get the current state of the circuit breaker."""
        return self._state
    
    @property
    def metrics(self) -> Dict[str, Any]:
        """Get metrics about the circuit breaker."""
        with self._lock:
            return {
                "name": self.name,
                "state": self._state.value,
                "failures": self._failures,
                "last_failure_time": self._last_failure_time.isoformat() if self._last_failure_time else None,
                "state_change_time": self._state_change_time.isoformat(),
                "call_count": self._call_count,
                "success_count": self._success_count,
                "error_count": self._error_count,
                "error_rate": self._error_count / self._call_count if self._call_count > 0 else 0,
            }
    
    def success(self) -> None:
        """Record a successful execution."""
        with self._lock:
            self._success_count += 1
            if self._state == CircuitState.HALF_OPEN:
                self._half_open_calls += 1
                if self._half_open_calls >= self.half_open_max_calls:
                    self._change_state(CircuitState.CLOSED)
    
    def failure(self) -> None:
        """Record a failed execution."""
        with self._lock:
            self._error_count += 1
            self._last_failure_time = datetime.utcnow()
            
            if self._state == CircuitState.CLOSED:
                self._failures += 1
                if self._failures >= self.failure_threshold:
                    self._change_state(CircuitState.OPEN)
            elif self._state == CircuitState.HALF_OPEN:
                self._change_state(CircuitState.OPEN)
    
    def execute(self, func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
        """
        Execute a function with circuit breaker protection.
        
        Args:
            func: The function to execute
            *args: Positional arguments to pass to the function
            **kwargs: Keyword arguments to pass to the function
            
        Returns:
            The result of the function call
            
        Raises:
            CircuitBreakerError: If the circuit is open
            Exception: Any exception raised by the function
        """
        self._check_state()
        self._call_count += 1
        
        try:
            result = func(*args, **kwargs)
            self.success()
            return result
        except Exception as e:
            is_tracked_exception = any(isinstance(e, exc_type) for exc_type in self.exception_types)
            if is_tracked_exception:
                self.failure()
            raise
    
    def _check_state(self) -> None:
        """
        Check the current state of the circuit breaker and transition if needed.
        
        Raises:
            CircuitBreakerError: If the circuit is open
        """
        with self._lock:
            if self._state == CircuitState.OPEN:
                if self._should_attempt_recovery():
                    self._change_state(CircuitState.HALF_OPEN)
                else:
                    raise CircuitBreakerError(
                        f"Service is unavailable (failing since {self._last_failure_time})",
                        self.name
                    )
    
    def _should_attempt_recovery(self) -> bool:
        """Check if enough time has passed to attempt recovery."""
        if not self._last_failure_time:
            return True
        
        recovery_time = self._last_failure_time + timedelta(seconds=self.recovery_timeout)
        return datetime.utcnow() >= recovery_time
    
    def _change_state(self, new_state: CircuitState) -> None:
        """
        Change the state of the circuit breaker.
        
        Args:
            new_state: The new state to transition to
        """
        if self._state != new_state:
            logger.info(
                f"Circuit breaker '{self.name}' state change: {self._state.value} -> {new_state.value}"
            )
            self._state = new_state
            self._state_change_time = datetime.utcnow()
            
            if new_state == CircuitState.CLOSED:
                self._failures = 0
            elif new_state == CircuitState.HALF_OPEN:
                self._half_open_calls = 0
            
            # Notify the monitor
            CircuitBreakerMonitor.on_state_change(self, new_state)
    
    def reset(self) -> None:
        """Reset the circuit breaker to its initial state."""
        with self._lock:
            self._change_state(CircuitState.CLOSED)
            self._failures = 0
            self._last_failure_time = None
            self._half_open_calls = 0


class CircuitBreakerMonitor:
    """
    Singleton monitor for all circuit breakers in the system.
    
    This class provides a centralized way to monitor and manage all
    circuit breakers in the system.
    """
    
    _breakers: Dict[str, CircuitBreaker] = {}
    _state_change_listeners: List[Callable[[CircuitBreaker, CircuitState], None]] = []
    
    @classmethod
    def register(cls, breaker: CircuitBreaker) -> None:
        """
        Register a circuit breaker with the monitor.
        
        Args:
            breaker: The circuit breaker to register
        """
        cls._breakers[breaker.name] = breaker
    
    @classmethod
    def unregister(cls, breaker_name: str) -> None:
        """
        Unregister a circuit breaker from the monitor.
        
        Args:
            breaker_name: The name of the circuit breaker to unregister
        """
        if breaker_name in cls._breakers:
            del cls._breakers[breaker_name]
    
    @classmethod
    def get_breaker(cls, name: str) -> Optional[CircuitBreaker]:
        """
        Get a circuit breaker by name.
        
        Args:
            name: The name of the circuit breaker to get
            
        Returns:
            The circuit breaker if found, None otherwise
        """
        return cls._breakers.get(name)
    
    @classmethod
    def get_all_breakers(cls) -> Dict[str, CircuitBreaker]:
        """
        Get all registered circuit breakers.
        
        Returns:
            A dictionary of circuit breakers keyed by name
        """
        return cls._breakers.copy()
    
    @classmethod
    def add_state_change_listener(
        cls, listener: Callable[[CircuitBreaker, CircuitState], None]
    ) -> None:
        """
        Add a listener for circuit breaker state changes.
        
        Args:
            listener: A function that takes a circuit breaker and its new state
        """
        cls._state_change_listeners.append(listener)
    
    @classmethod
    def on_state_change(cls, breaker: CircuitBreaker, new_state: CircuitState) -> None:
        """
        Notify listeners of a circuit breaker state change.
        
        Args:
            breaker: The circuit breaker that changed state
            new_state: The new state of the circuit breaker
        """
        for listener in cls._state_change_listeners:
            try:
                listener(breaker, new_state)
            except Exception as e:
                logger.error(f"Error in circuit breaker state change listener: {e}")
    
    @classmethod
    def get_metrics(cls) -> List[Dict[str, Any]]:
        """
        Get metrics for all registered circuit breakers.
        
        Returns:
            A list of metric dictionaries, one for each circuit breaker
        """
        return [breaker.metrics for breaker in cls._breakers.values()]
    
    @classmethod
    def reset_all(cls) -> None:
        """Reset all registered circuit breakers."""
        for breaker in cls._breakers.values():
            breaker.reset()


def circuit_breaker(
    name: Optional[str] = None,
    failure_threshold: int = 5,
    recovery_timeout: int = 30,
    half_open_max_calls: int = 3,
    exception_types: Optional[List[type]] = None,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    Decorator for applying a circuit breaker to a function.
    
    Args:
        name: Name of the circuit breaker, defaults to function name
        failure_threshold: Number of failures before opening the circuit
        recovery_timeout: Seconds to wait before trying half-open state
        half_open_max_calls: Max calls to allow in half-open state
        exception_types: Types of exceptions that count as failures
        
    Returns:
        A decorator function
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        breaker_name = name or func.__qualname__
        breaker = CircuitBreaker(
            name=breaker_name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
            half_open_max_calls=half_open_max_calls,
            exception_types=exception_types,
        )
        
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            return breaker.execute(func, *args, **kwargs)
        
        return wrapper
    
    return decorator


def retry_with_backoff(
    retries: int = 3,
    backoff_factor: float = 0.5,
    max_backoff: float = 10.0,
    jitter: bool = True,
    exception_types: Optional[List[type]] = None,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    Decorator for retrying a function with exponential backoff.
    
    Args:
        retries: Maximum number of retries
        backoff_factor: Base backoff time in seconds
        max_backoff: Maximum backoff time in seconds
        jitter: Whether to add random jitter to backoff times
        exception_types: Types of exceptions to retry on
        
    Returns:
        A decorator function
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        exc_types = exception_types or [Exception]
        
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            attempt = 0
            while True:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempt += 1
                    if attempt > retries or not any(isinstance(e, t) for t in exc_types):
                        raise
                    
                    backoff = min(backoff_factor * (2 ** (attempt - 1)), max_backoff)
                    if jitter:
                        backoff = backoff * (0.5 + random.random())
                    
                    logger.warning(
                        f"Retry {attempt}/{retries} for {func.__qualname__}, "
                        f"backing off for {backoff:.2f}s: {str(e)}"
                    )
                    time.sleep(backoff)
        
        return wrapper
    
    return decorator


class CircuitBreakerContextManager:
    """Context manager for using a circuit breaker."""
    
    def __init__(self, breaker: CircuitBreaker) -> None:
        """
        Initialize a new circuit breaker context manager.
        
        Args:
            breaker: The circuit breaker to use
        """
        self.breaker = breaker
        self.success = False
    
    def __enter__(self) -> 'CircuitBreakerContextManager':
        """Enter the context, checking if the circuit is open."""
        self.breaker._check_state()
        return self
    
    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> bool:
        """
        Exit the context, recording success or failure.
        
        Args:
            exc_type: Exception type if an exception was raised, None otherwise
            exc_val: Exception value if an exception was raised, None otherwise
            exc_tb: Exception traceback if an exception was raised, None otherwise
            
        Returns:
            True if the exception should be suppressed, False otherwise
        """
        if exc_type is None:
            self.breaker.success()
            self.success = True
        else:
            is_tracked_exception = any(
                issubclass(exc_type, exc_type_) for exc_type_ in self.breaker.exception_types
            )
            if is_tracked_exception:
                self.breaker.failure()
        
        return False  # Don't suppress exceptions