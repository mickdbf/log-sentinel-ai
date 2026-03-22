from sqlalchemy import Column, Integer, Text, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(Text)
    uploaded_at = Column(TIMESTAMP, server_default=func.now())


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True)
    log_id = Column(Integer, ForeignKey("logs.id"))
    result_json = Column(JSONB)
    created_at = Column(TIMESTAMP, server_default=func.now())