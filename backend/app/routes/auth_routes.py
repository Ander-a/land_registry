from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import timedelta

from ..db import get_session, create_db_and_tables
from ..models.user import User
from ..schemas.user import UserCreate, UserLogin, UserRead
from ..auth.auth import get_password_hash, verify_password, create_access_token, JWTBearer

router = APIRouter(prefix="/auth", tags=["auth"])

@router.on_event("startup")
def on_startup():
    # ensure tables exist
    create_db_and_tables()

@router.post("/register", response_model=UserRead)
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(name=user_in.name, email=user_in.email, hashed_password=get_password_hash(user_in.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.post("/login")
def login(payload: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": UserRead.from_orm(user)}

@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(JWTBearer())):
    return current_user
