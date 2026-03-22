from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import User
from app.auth.schemas import UserRegister, UserLogin, TokenResponse
from app.auth.utils import hash_password, verify_password, create_access_token
 
router = APIRouter(prefix="/auth", tags=["auth"])
 
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
 
@router.post("/register", response_model=TokenResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
 
    new_user = User(username=user.username, password_hash=hash_password(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
 
    token = create_access_token({"sub": str(new_user.id), "username": new_user.username})
    return {"access_token": token}
 
@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
 
    token = create_access_token({"sub": str(db_user.id), "username": db_user.username})
    return {"access_token": token}