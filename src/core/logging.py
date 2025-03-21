import logging
import sys
import json
import time
from pathlib import Path
from loguru import logger
from src.core.settings import settings

# Configure loguru
class InterceptHandler(logging.Handler):
    def emit(self, record):
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where originated the logged message
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def setup_logging():
    """Configure logging with loguru."""
    # Remove default loguru handler
    logger.remove()

    # Add new handlers based on environment
    log_level = settings.LOG_LEVEL.upper()
    
    # Configure development logger
    if settings.ENV == "development":
        logger.add(
            sys.stderr,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
            level=log_level,
            backtrace=True,
            diagnose=True,
        )
    else:
        # Configure production logger
        log_path = Path("logs")
        log_path.mkdir(exist_ok=True)
        
        # Main application log
        logger.add(
            log_path / "app.log",
            rotation="100 MB",
            retention="10 days",
            level=log_level,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        )
        
        # Slow query log
        logger.add(
            log_path / "slow_query.log",
            rotation="50 MB",
            retention="7 days",
            level="WARNING",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {message}",
            filter=lambda record: "slow_query" in record["extra"],
        )
        
        # AI API usage log
        logger.add(
            log_path / "ai_api_usage.log",
            rotation="50 MB",
            retention="30 days",
            level="INFO",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {message}",
            filter=lambda record: "api_usage" in record["extra"],
        )
        
        # Also log to console in production, but with a simpler format
        logger.add(
            sys.stderr,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {message}",
            level=log_level,
        )
    
    # Intercept everything at the root logger
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Remove other handlers and set level for specific loggers
    for name in logging.root.manager.loggerDict.keys():
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True
    
    # Configure uvicorn logging
    for uvicorn_logger in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logging.getLogger(uvicorn_logger).handlers = []
        logging.getLogger(uvicorn_logger).propagate = True


def log_slow_query(statement, parameters, execution_time):
    """Log slow database queries for performance monitoring.
    
    Args:
        statement: SQL statement that was executed
        parameters: Query parameters
        execution_time: Execution time in seconds
    """
    log_data = {
        "query": statement,
        "parameters": str(parameters),
        "execution_time_ms": round(execution_time * 1000, 2),
        "timestamp": time.time()
    }
    
    # Log with special logger context
    logger.bind(slow_query=True).warning(f"SLOW QUERY ({log_data['execution_time_ms']}ms): {json.dumps(log_data)}")


def log_api_usage(provider, model, tokens_in, tokens_out, duration_ms, cost, endpoint, cached=False):
    """Log AI API usage for cost monitoring and optimization.
    
    Args:
        provider: API provider (openai, anthropic, etc.)
        model: Model name (gpt-4, claude-3-opus, etc.)
        tokens_in: Input token count
        tokens_out: Output token count
        duration_ms: Request duration in milliseconds
        cost: Estimated cost in USD
        endpoint: API endpoint used (completion, chat, embeddings, etc.)
        cached: Whether the response was served from cache
    """
    log_data = {
        "provider": provider,
        "model": model,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "total_tokens": tokens_in + tokens_out,
        "duration_ms": duration_ms,
        "cost_usd": cost,
        "endpoint": endpoint,
        "cached": cached,
        "timestamp": time.time()
    }
    
    # Log with special logger context
    logger.bind(api_usage=True).info(f"AI API: {json.dumps(log_data)}")
