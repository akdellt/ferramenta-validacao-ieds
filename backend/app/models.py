from datetime import datetime

from sqlalchemy import String, ForeignKey, func
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

class NetworkIED(Base):
    __tablename__ = "network_ieds"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    substation: Mapped[str] = mapped_column(String, index=True)
    component_name: Mapped[str] = mapped_column(String)
    relay_model: Mapped[str] = mapped_column(String) 
    ip_address: Mapped[str] = mapped_column(String)
    connection_type: Mapped[str] = mapped_column(String, default="TELNET")

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