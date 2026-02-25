from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


# --- Chart ---

class ChartOption(BaseModel):
    id: str
    label: str
    description: Optional[str] = None
    multiplier: Optional[Dict[str, float]] = None


class ChartQuestion(BaseModel):
    id: str
    type: str
    question: Optional[str] = None
    questions: Optional[List[Any]] = None
    options: Optional[List[ChartOption]] = None


class RecommendRequest(BaseModel):
    selections: Dict[str, Any]


# --- Model ---

class ModelPerformance(BaseModel):
    speed: float
    reasoning: float
    coding: float
    context_length: float
    cost_efficiency: float
    instruction_following: float
    creativity: float
    long_output: float


class CopilotModel(BaseModel):
    id: str
    name: str
    provider: str
    description: str
    context_window: int
    cost_tier: str
    performance: ModelPerformance
    strengths: List[str]
    cautions: List[str]
    best_for: List[str]


class RecommendResult(BaseModel):
    rank: int
    model: CopilotModel
    score: float
    reason: str
    caution: Optional[str] = None


class RecommendResponse(BaseModel):
    recommendations: List[RecommendResult]
    selections: Dict[str, Any]
    diagnosis_id: str


# --- Data Refresh ---

class RefreshRequest(BaseModel):
    model_id: Optional[str] = None
    api_key: Optional[str] = None


class RefreshStatusResponse(BaseModel):
    status: str
    progress: int
    message: str
    started_at: Optional[datetime] = None


class RefreshResponse(BaseModel):
    id: str
    status: str
    summary: Dict[str, Any]
    gemini_model: str
    created_at: datetime


# --- History ---

class DiagnosisHistoryItem(BaseModel):
    id: str
    created_at: datetime
    selections: Dict[str, Any]
    result: Dict[str, Any]
    feedback: Optional[int] = None

    class Config:
        from_attributes = True


class FeedbackRequest(BaseModel):
    feedback: Optional[int] = None
    rating: Optional[int] = None

    def get_value(self) -> int:
        v = self.feedback if self.feedback is not None else self.rating
        if v is None:
            raise ValueError("feedback or rating is required")
        return v


# --- Gemini ---

class GeminiModelInfo(BaseModel):
    id: str
    name: str
    display_name: str
    description: str
    available: bool
    default: bool
    performance: Dict[str, Any]
    recommended_for: List[str]


class RateLimitInfo(BaseModel):
    limit: int
    used: int
    remaining: int
    reset_at: Optional[str] = None
    percentage: int
    status: str


class ModelRateLimits(BaseModel):
    rpm: Optional[RateLimitInfo] = None
    tpm: Optional[RateLimitInfo] = None
    tpd: Optional[RateLimitInfo] = None


class RateLimitsResponse(BaseModel):
    last_checked: str
    rate_limits: Dict[str, Optional[ModelRateLimits]]


class VerifyKeyRequest(BaseModel):
    api_key: str


class VerifyKeyResponse(BaseModel):
    valid: bool
    message: str
