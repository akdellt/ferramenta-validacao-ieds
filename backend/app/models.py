from datetime import datetime

from sqlalchemy import String, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

class User(Base):
    __tablename__ = "users"

    registration: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    role: Mapped[str] = mapped_column(String, default="Tecnico")

    logs: Mapped[list["ValidationLog"]] = relationship(back_populates="owner")

class NetworkIED(Base):
    __tablename__ = "network_ieds"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    relay_model: Mapped[str] = mapped_column(String) 
    ip_address: Mapped[str] = mapped_column(String)
    port: Mapped[int] = mapped_column(default=20000)

class ValidationLog(Base):
    __tablename__ = "validation_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    relay_model: Mapped[str] = mapped_column(String)
    substation: Mapped[str] = mapped_column(String)
    
    filename_oa: Mapped[str] = mapped_column(String)
    filename_ied: Mapped[str] = mapped_column(String)

    result_json: Mapped[list[dict[str, object]]] = mapped_column(JSON)
    
    status: Mapped[str] = mapped_column(String, default="Divergente")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    validation_source: Mapped[str] = mapped_column(String, default="FILE")
    
    user_registration: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.registration"), nullable=True
    )
    
    owner: Mapped["User | None"] = relationship(back_populates="logs")