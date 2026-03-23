from pydantic import BaseModel
from typing import List, Optional

class Finding(BaseModel):
    severity: str  # critical, warning, info
    title: str
    detail: Optional[str] = None
    timestamp: Optional[str] = None
    confidence: Optional[float] = None

class IOC(BaseModel):
    type: str      # ip, user, endpoint, domain
    value: str
    context: str

class TimelineEvent(BaseModel):
    timestamp: str
    description: str
    severity: str  # critical, warning, info

class AnalysisResponse(BaseModel):
    filename: str
    events_parsed: int
    analysis_time: float
    log_type: str
    summary: str
    critical_count: int
    warning_count: int
    info_count: int
    ioc_count: int
    findings: List[Finding]
    iocs: List[IOC]
    timeline: List[TimelineEvent]
