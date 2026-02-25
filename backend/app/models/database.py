import json
import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    JSON,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class DiagnosisHistory(Base):
    __tablename__ = "diagnosis_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    selections = Column(JSON, nullable=False)
    result = Column(JSON, nullable=False)
    feedback = Column(Integer, nullable=True)


class UpdateHistory(Base):
    __tablename__ = "update_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, nullable=False)
    summary = Column(JSON, nullable=False)
    old_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)
    gemini_model = Column(String, nullable=True)


class ModelData(Base):
    __tablename__ = "model_data"

    id = Column(String, primary_key=True, default="current")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    data = Column(JSON, nullable=False)


class RecommendationRules(Base):
    __tablename__ = "recommendation_rules"

    id = Column(String, primary_key=True, default="current")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    data = Column(JSON, nullable=False)


class GeminiModels(Base):
    __tablename__ = "gemini_models"

    id = Column(String, primary_key=True, default="current")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    data = Column(JSON, nullable=False)


class RateLimits(Base):
    __tablename__ = "rate_limits"

    id = Column(String, primary_key=True, default="current")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    data = Column(JSON, nullable=False)
    expires_at = Column(DateTime, nullable=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
