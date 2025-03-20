import logging
import sys
from pathlib import Path
from loguru import logger
from src.ultimate_marketing_team.core.settings import settings

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
        
        logger.add(
            log_path / "app.log",
            rotation="100 MB",
            retention="10 days",
            level=log_level,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
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
