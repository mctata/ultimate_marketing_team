from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text, JSON
from sqlalchemy.sql import func

from src.ultimate_marketing_team.core.database import Base

class SystemLog(Base):
    """System log model for tracking system events and errors."""
    
    __tablename__ = "system_logs"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    log_level = Column(String(20), nullable=False)
    component = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
