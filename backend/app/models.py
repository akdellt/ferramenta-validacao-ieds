from datetime import datetime
from typing import List, Optional, Any

from sqlalchemy import String, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    role: Mapped[str] = mapped_column(String, default="técnico")

    logs: Mapped[List["ValidationLog"]] = relationship(back_populates="owner")

class ValidationLog(Base):
    __tablename__ = "validation_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    relay_model: Mapped[str] = mapped_column(String)
    substation: Mapped[str] = mapped_column(String)
    
    filename_oa: Mapped[str] = mapped_column(String)
    filename_ied: Mapped[str] = mapped_column(String)

    result_json: Mapped[list[dict[str, Any]]] = mapped_column(JSON)
    
    status: Mapped[str] = mapped_column(String, default="Conforme")
    
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    owner: Mapped[Optional["User"]] = relationship(back_populates="logs")