import time
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import User, Log, Analysis
from app.auth.utils import decode_token
from app.analysis.parser import parse_log_file, chunk_events, format_events_for_prompt
from app.analysis.llm import run_analysis, safe_get_list
from app.analysis.schemas import AnalysisResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import json

router = APIRouter(prefix="/analysis", tags=["analysis"])
bearer = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_token(credentials.credentials)
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/upload", response_model=AnalysisResponse)
async def upload_and_analyze(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate file type
    if not file.filename.endswith((".log", ".txt")):
        raise HTTPException(status_code=400, detail="Only .log and .txt files are supported")

    # Read file content — keep in memory, don't persist
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = content.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Could not decode file — ensure it is a text-based log file")

    if not text.strip():
        raise HTTPException(status_code=400, detail="File is empty")

    start_time = time.time()

    # Parse log file into structured events
    events, log_type = parse_log_file(text)

    if not events:
        raise HTTPException(status_code=400, detail="No parseable events found in file")

    # Chunk events for LLM processing
    chunks = chunk_events(events, chunk_size=300)
    formatted_chunks = [format_events_for_prompt(chunk) for chunk in chunks]

    # Run LLM analysis
    try:
        result = run_analysis(formatted_chunks, log_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    analysis_time = round(time.time() - start_time, 2)

    # Extract and validate results
    findings = safe_get_list(result, "findings")
    iocs = safe_get_list(result, "iocs")
    timeline = safe_get_list(result, "timeline")

    critical_count = sum(1 for f in findings if f.get("severity") == "critical")
    warning_count  = sum(1 for f in findings if f.get("severity") == "warning")
    info_count     = sum(1 for f in findings if f.get("severity") == "info")

    # Save log record to DB
    log_record = Log(
        user_id=current_user.id,
        filename=file.filename,
    )
    db.add(log_record)
    db.commit()
    db.refresh(log_record)

    # Save analysis result to DB
    analysis_record = Analysis(
        log_id=log_record.id,
        result_json={
            "summary": result.get("summary", ""),
            "log_type": result.get("log_type", log_type),
            "findings": findings,
            "iocs": iocs,
            "timeline": timeline,
        }
    )
    db.add(analysis_record)
    db.commit()

    # Build and return response
    return AnalysisResponse(
        filename=file.filename,
        events_parsed=len(events),
        analysis_time=analysis_time,
        log_type=result.get("log_type", log_type),
        summary=result.get("summary", "No summary available."),
        critical_count=critical_count,
        warning_count=warning_count,
        info_count=info_count,
        ioc_count=len(iocs),
        findings=findings,
        iocs=iocs,
        timeline=timeline,
    )
