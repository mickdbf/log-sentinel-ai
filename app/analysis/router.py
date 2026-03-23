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
    if not file.filename.endswith((".log", ".txt")):
        raise HTTPException(status_code=400, detail="Only .log and .txt files are supported")

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

    events, log_type = parse_log_file(text)
    if not events:
        raise HTTPException(status_code=400, detail="No parseable events found in file")

    chunks = chunk_events(events, chunk_size=300)
    formatted_chunks = [format_events_for_prompt(chunk) for chunk in chunks]

    try:
        result = run_analysis(formatted_chunks, log_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    analysis_time = round(time.time() - start_time, 2)

    findings = safe_get_list(result, "findings")
    iocs     = safe_get_list(result, "iocs")
    timeline = safe_get_list(result, "timeline")

    critical_count = sum(1 for f in findings if f.get("severity") == "critical")
    warning_count  = sum(1 for f in findings if f.get("severity") == "warning")
    info_count     = sum(1 for f in findings if f.get("severity") == "info")

    # Save log record
    log_record = Log(user_id=current_user.id, filename=file.filename)
    db.add(log_record)
    db.commit()
    db.refresh(log_record)

    # Save full result to DB for history retrieval
    analysis_record = Analysis(
        log_id=log_record.id,
        result_json={
            "filename": file.filename,
            "events_parsed": len(events),
            "analysis_time": analysis_time,
            "log_type": result.get("log_type", log_type),
            "summary": result.get("summary", ""),
            "critical_count": critical_count,
            "warning_count": warning_count,
            "info_count": info_count,
            "ioc_count": len(iocs),
            "findings": findings,
            "iocs": iocs,
            "timeline": timeline,
        }
    )
    db.add(analysis_record)
    db.commit()

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

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the 20 most recent analyses for the current user."""
    logs = (
        db.query(Log)
        .filter(Log.user_id == current_user.id)
        .order_by(Log.uploaded_at.desc())
        .limit(20)
        .all()
    )

    results = []
    for log in logs:
        if log.analysis:
            rj = log.analysis.result_json or {}
            results.append({
                "id": log.analysis.id,
                "filename": log.filename,
                "uploaded_at": log.uploaded_at.isoformat(),
                "log_type": rj.get("log_type", "unknown"),
                "critical_count": rj.get("critical_count", 0),
                "warning_count": rj.get("warning_count", 0),
                "result": rj,
            })

    return results
