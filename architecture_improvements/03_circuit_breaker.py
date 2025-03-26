"""
Circuit Breaker Implementation
This module provides a circuit breaker implementation to protect services from cascading failures.
"""

import time
import logging
import functools
from enum import Enum, auto
from typing import Any, Callable, Dict, List, Optional, Set, Type, TypeVar, Union, cast
from dataclasses import dataclass, field
import threading

# Configure logging
logger = logging.getLogger(__name__)

# Circuit breaker states
class CircuitState(Enum):
    """Enum for circuit breaker states."""
    CLOSED = auto()  # Normal operation, requests pass through
    OPEN = auto()    # Circuit is open, requests fail fast
    HALF_OPEN = auto()  # Testing if service is healthy again

# Exception types to handle
class CircuitBreakerError(Exception):
    """Base exception for circuit breaker errors."""
    pass

class CircuitOpenError(CircuitBreakerError):
    """Exception raised when the circuit is open."""
    def __init__(self, message: str = "Circuit is open"):
        self.message = message
        super().__init__(self.message)

class CircuitBreakError(CircuitBreakerError):
    """Exception raised when a request breaks the circuit."""
    def __init__(self, original_exception: Exception):
        self.original_exception = original_exception
        message = f"Request failed, circuit broken: {str(original_exception)}"
        super().__init__(message)

@dataclass
class CircuitStats:
    """Statistics for a circuit breaker."""
    success_count: int = 0
    failure_count: int = 0
    rejected_count: int = 0
    last_failure_time: Optional[float] = None
    last_success_time: Optional[float] = None
    last_state_change_time: float = field(default_factory=time.time)
    
    def reset(self) -> None:
        """Reset all statistics."""
        self.success_count = 0
        self.failure_count = 0
        self.rejected_count = 0
        self.last_failure_time = None
        self.last_success_time = None
        self.last_state_change_time = time.time()
    
    def record_success(self) -> None:
        """Record a successful execution."""
        self.success_count += 1
        self.last_success_time = time.time()
    
    def record_failure(self) -> None:
        """Record a failed execution."""
        self.failure_count += 1
        self.last_failure_time = time.time()
    
    def record_rejection(self) -> None:
        """Record a rejected execution."""
        self.rejected_count += 1

class CircuitBreaker:
    """
    Circuit breaker implementation to protect services from cascading failures.
    
    The circuit breaker has three states:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Circuit is open, requests fail fast
    - HALF_OPEN: Testing if service is healthy again
    
    Usage example:
    ```
    # Create a circuit breaker with default settings
    breaker = CircuitBreaker(name="my-service")
    
    # Use the circuit breaker
    try:
        result = breaker.execute(my_function, arg1, arg2, kwarg1=value1)
    except CircuitOpenError:
        # Handle the case when the circuit is open
        result = fallback_value
    except CircuitBreakError as e:
        # Handle the case when the request failed and broke the circuit
        result = fallback_value
    ```
    
    Alternatively, use the decorator:
    ```
    @circuit_breaker(name="my-service")
    def my_function(arg1, arg2, kwarg1=None):
        # Function implementation
        return result
    ```
    """
    
    # Class-level registry of circuit breakers for monitoring
    _registry: Dict[str, 'CircuitBreaker'] = {}
    _registry_lock = threading.RLock()
    
    @classmethod
    def get_circuit_breaker(cls, name: str) -> Optional['CircuitBreaker']:
        """Get a circuit breaker by name."""
        with cls._registry_lock:
            return cls._registry.get(name)
    
    @classmethod
    def get_all_circuit_breakers(cls) -> Dict[str, 'CircuitBreaker']:
        """Get all registered circuit breakers."""
        with cls._registry_lock:
            return cls._registry.copy()
    
    def __init__(self, 
                 name: str,
                 failure_threshold: int = 5,
                 reset_timeout_seconds: float = 60.0,
                 half_open_max_calls: int = 1,
                 monitored_exceptions: Optional[Set[Type[Exception]]] = None,
                 excluded_exceptions: Optional[Set[Type[Exception]]] = None):
        """
        Initialize a new circuit breaker.
        
        Args:
            name: Unique name for this circuit breaker
            failure_threshold: Number of failures before opening the circuit
            reset_timeout_seconds: Time in seconds before trying to close the circuit
            half_open_max_calls: Max number of calls to allow in half-open state
            monitored_exceptions: Set of exception types that are counted as failures (default: all)
            excluded_exceptions: Set of exception types that are never counted as failures
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.reset_timeout_seconds = reset_timeout_seconds
        self.half_open_max_calls = half_open_max_calls
        self.monitored_exceptions = monitored_exceptions or {Exception}
        self.excluded_exceptions = excluded_exceptions or set()
        
        self._state = CircuitState.CLOSED
        self._stats = CircuitStats()
        self._half_open_call_count = 0
        self._lock = threading.RLock()
        
        # Register this circuit breaker
        with self._registry_lock:
            self._registry[name] = self
    
    @property
    def state(self) -> CircuitState:
        """Get the current state of the circuit breaker."""
        return self._state
    
    @property
    def state_name(self) -> str:
        """Get the current state name."""
        return self._state.name
    
    @property
    def stats(self) -> CircuitStats:
        """Get the current statistics."""
        return self._stats
    
    def reset(self) -> None:
        """Reset the circuit breaker to the closed state."""
        with self._lock:
            self._state = CircuitState.CLOSED
            self._stats.reset()
            self._half_open_call_count = 0
    
    def _should_allow_execution(self) -> bool:
        """Check if execution should be allowed based on current state."""
        with self._lock:
            now = time.time()
            
            if self._state == CircuitState.CLOSED:
                return True
            
            if self._state == CircuitState.OPEN:
                if now - self._stats.last_state_change_time >= self.reset_timeout_seconds:
                    # Transition to half-open state
                    self._state = CircuitState.HALF_OPEN
                    self._stats.last_state_change_time = now
                    self._half_open_call_count = 0
                    logger.info(f"Circuit {self.name} transitioned from OPEN to HALF_OPEN")
                    return True
                return False
            
            if self._state == CircuitState.HALF_OPEN:
                return self._half_open_call_count < self.half_open_max_calls
            
            return False  # Should never reach here
    
    def _on_success(self) -> None:
        """Handle successful execution."""
        with self._lock:
            self._stats.record_success()
            
            if self._state == CircuitState.HALF_OPEN:
                # If we've had enough successful calls in half-open state, close the circuit
                # For simplicity, we just need one successful call to close it
                self._state = CircuitState.CLOSED
                self._stats.last_state_change_time = time.time()
                logger.info(f"Circuit {self.name} transitioned from HALF_OPEN to CLOSED")
    
    def _on_failure(self, exception: Exception) -> None:
        """Handle failed execution."""
        with self._lock:
            # Check if this exception type should be monitored
            should_monitor = False
            for exc_type in self.monitored_exceptions:
                if isinstance(exception, exc_type):
                    should_monitor = True
                    break
            
            # Check if this exception type should be excluded
            for exc_type in self.excluded_exceptions:
                if isinstance(exception, exc_type):
                    should_monitor = False
                    break
            
            if not should_monitor:
                # Don't count this as a failure
                return
            
            self._stats.record_failure()
            
            if self._state == CircuitState.CLOSED:
                if self._stats.failure_count >= self.failure_threshold:
                    # Open the circuit
                    self._state = CircuitState.OPEN
                    self._stats.last_state_change_time = time.time()
                    logger.warning(f"Circuit {self.name} transitioned from CLOSED to OPEN due to failure threshold")
            
            elif self._state == CircuitState.HALF_OPEN:
                # Go back to open state on any failure
                self._state = CircuitState.OPEN
                self._stats.last_state_change_time = time.time()
                logger.warning(f"Circuit {self.name} transitioned from HALF_OPEN to OPEN due to failure")
    
    def _on_rejected(self) -> None:
        """Handle rejected execution."""
        with self._lock:
            self._stats.record_rejection()
    
    def execute(self, func: Callable, *args: Any, **kwargs: Any) -> Any:
        """
        Execute a function with circuit breaker protection.
        
        Args:
            func: The function to execute
            *args: Positional arguments to pass to the function
            **kwargs: Keyword arguments to pass to the function
            
        Returns:
            The return value of the function
            
        Raises:
            CircuitOpenError: If the circuit is open
            CircuitBreakError: If the function raised an exception that broke the circuit
        """
        if not self._should_allow_execution():
            self._on_rejected()
            raise CircuitOpenError(f"Circuit {self.name} is OPEN")
        
        if self._state == CircuitState.HALF_OPEN:
            with self._lock:
                self._half_open_call_count += 1
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure(e)
            raise CircuitBreakError(e)
    
    async def execute_async(self, func: Callable, *args: Any, **kwargs: Any) -> Any:
        """
        Execute an async function with circuit breaker protection.
        
        Args:
            func: The async function to execute
            *args: Positional arguments to pass to the function
            **kwargs: Keyword arguments to pass to the function
            
        Returns:
            The return value of the function
            
        Raises:
            CircuitOpenError: If the circuit is open
            CircuitBreakError: If the function raised an exception that broke the circuit
        """
        if not self._should_allow_execution():
            self._on_rejected()
            raise CircuitOpenError(f"Circuit {self.name} is OPEN")
        
        if self._state == CircuitState.HALF_OPEN:
            with self._lock:
                self._half_open_call_count += 1
        
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure(e)
            raise CircuitBreakError(e)

# Decorator for circuit breaker
F = TypeVar('F', bound=Callable[..., Any])

def circuit_breaker(name: Optional[str] = None, 
                    failure_threshold: int = 5,
                    reset_timeout_seconds: float = 60.0,
                    half_open_max_calls: int = 1,
                    monitored_exceptions: Optional[Set[Type[Exception]]] = None,
                    excluded_exceptions: Optional[Set[Type[Exception]]] = None) -> Callable[[F], F]:
    """
    Decorator for applying circuit breaker to a function.
    
    Args:
        name: Unique name for this circuit breaker (defaults to function name)
        failure_threshold: Number of failures before opening the circuit
        reset_timeout_seconds: Time in seconds before trying to close the circuit
        half_open_max_calls: Max number of calls to allow in half-open state
        monitored_exceptions: Set of exception types that are counted as failures (default: all)
        excluded_exceptions: Set of exception types that are never counted as failures
        
    Returns:
        Decorated function
    """
    def decorator(func: F) -> F:
        breaker_name = name or f"{func.__module__}.{func.__name__}"
        breaker = CircuitBreaker(
            name=breaker_name,
            failure_threshold=failure_threshold,
            reset_timeout_seconds=reset_timeout_seconds,
            half_open_max_calls=half_open_max_calls,
            monitored_exceptions=monitored_exceptions,
            excluded_exceptions=excluded_exceptions
        )
        
        if asyncio_is_installed() and is_async_function(func):
            @functools.wraps(func)
            async def wrapper(*args: Any, **kwargs: Any) -> Any:
                return await breaker.execute_async(func, *args, **kwargs)
        else:
            @functools.wraps(func)
            def wrapper(*args: Any, **kwargs: Any) -> Any:
                return breaker.execute(func, *args, **kwargs)
        
        return cast(F, wrapper)
    
    return decorator

# Utility functions
def asyncio_is_installed() -> bool:
    """Check if asyncio is installed."""
    try:
        import asyncio
        return True
    except ImportError:
        return False

def is_async_function(func: Callable) -> bool:
    """Check if a function is an async function."""
    import inspect
    return inspect.iscoroutinefunction(func)

# Retries with circuit breaker
def retry_with_circuit_breaker(max_retries: int = 3,
                              backoff_factor: float = 1.0,
                              circuit_name: Optional[str] = None,
                              failure_threshold: int = 5,
                              reset_timeout_seconds: float = 60.0) -> Callable[[F], F]:
    """
    Decorator for applying retry with circuit breaker to a function.
    
    Args:
        max_retries: Maximum number of retries
        backoff_factor: Backoff factor for retries (exponential backoff)
        circuit_name: Unique name for this circuit breaker (defaults to function name)
        failure_threshold: Number of failures before opening the circuit
        reset_timeout_seconds: Time in seconds before trying to close the circuit
        
    Returns:
        Decorated function
    """
    def decorator(func: F) -> F:
        breaker_name = circuit_name or f"{func.__module__}.{func.__name__}"
        breaker = CircuitBreaker(
            name=breaker_name,
            failure_threshold=failure_threshold,
            reset_timeout_seconds=reset_timeout_seconds
        )
        
        if asyncio_is_installed() and is_async_function(func):
            @functools.wraps(func)
            async def wrapper(*args: Any, **kwargs: Any) -> Any:
                latest_exception = None
                for attempt in range(max_retries + 1):
                    try:
                        return await breaker.execute_async(func, *args, **kwargs)
                    except CircuitOpenError:
                        # Don't retry if the circuit is open
                        raise
                    except CircuitBreakError as e:
                        latest_exception = e.original_exception
                        if attempt < max_retries:
                            # Calculate backoff time
                            backoff_time = backoff_factor * (2 ** attempt)
                            logger.debug(f"Retrying {func.__name__} in {backoff_time:.2f}s (attempt {attempt + 1}/{max_retries})")
                            import asyncio
                            await asyncio.sleep(backoff_time)
                        else:
                            # Max retries reached
                            raise latest_exception
                
                # This should never be reached
                assert latest_exception is not None
                raise latest_exception
        else:
            @functools.wraps(func)
            def wrapper(*args: Any, **kwargs: Any) -> Any:
                latest_exception = None
                for attempt in range(max_retries + 1):
                    try:
                        return breaker.execute(func, *args, **kwargs)
                    except CircuitOpenError:
                        # Don't retry if the circuit is open
                        raise
                    except CircuitBreakError as e:
                        latest_exception = e.original_exception
                        if attempt < max_retries:
                            # Calculate backoff time
                            backoff_time = backoff_factor * (2 ** attempt)
                            logger.debug(f"Retrying {func.__name__} in {backoff_time:.2f}s (attempt {attempt + 1}/{max_retries})")
                            time.sleep(backoff_time)
                        else:
                            # Max retries reached
                            raise latest_exception
                
                # This should never be reached
                assert latest_exception is not None
                raise latest_exception
        
        return cast(F, wrapper)
    
    return decorator

# Circuit breaker registry monitoring
class CircuitBreakerMonitor:
    """Monitor for circuit breakers."""
    
    @staticmethod
    def get_all_circuit_breakers() -> Dict[str, CircuitBreaker]:
        """Get all registered circuit breakers."""
        return CircuitBreaker.get_all_circuit_breakers()
    
    @staticmethod
    def get_circuit_breaker(name: str) -> Optional[CircuitBreaker]:
        """Get a circuit breaker by name."""
        return CircuitBreaker.get_circuit_breaker(name)
    
    @staticmethod
    def get_status_report() -> Dict[str, Dict[str, Any]]:
        """Get a status report for all circuit breakers."""
        report = {}
        for name, breaker in CircuitBreaker.get_all_circuit_breakers().items():
            report[name] = {
                "state": breaker.state_name,
                "failure_count": breaker.stats.failure_count,
                "success_count": breaker.stats.success_count,
                "rejected_count": breaker.stats.rejected_count,
                "last_failure_time": breaker.stats.last_failure_time,
                "last_success_time": breaker.stats.last_success_time,
                "last_state_change_time": breaker.stats.last_state_change_time
            }
        return report