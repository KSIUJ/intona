import random
import string
import uuid
from datetime import datetime, UTC, timedelta

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from src.auth.utils import hash_password
from src.auth.models import User
from src.services.email_reset.utils import verify_email_payload, delete_payload
from src.services.email_reset.schemas import EmailTokenResponse, EmailResetData
from src.services.email_reset.models import EmailVerifyCode, EmailVerifyToken
from src.services.email_reset.schemas import EmailData, EmailDataWithCode
from src.database import SessionDep

router = APIRouter()


@router.post("/request_reset")
async def request_reset(db: SessionDep, email_data: EmailData):
    code_row = EmailVerifyCode(email=email_data.email, payload="".join(random.choices(string.digits, k=6)),
                               expire_at=datetime.now(UTC) + timedelta(minutes=5))
    db.add(code_row)
    await db.commit()
    return {"message": "password reset request sent"}

@router.post("/verify_code", response_model=EmailTokenResponse)
async def verify_email(db: SessionDep, email_data: EmailDataWithCode):
    verified_payload = await verify_email_payload(db, EmailVerifyCode, email_data)
    await delete_payload(db, verified_payload)

    email_reset_token = EmailVerifyToken(email=email_data.email, payload=str(uuid.uuid4()), expire_at=datetime.now(UTC) + timedelta(minutes=5))

    db.add(email_reset_token)
    await db.commit()
    await db.refresh(email_reset_token)

    return email_reset_token

@router.post("/reset_password")
async def reset_password(db: SessionDep, email_data: EmailResetData):
    verified_payload = await verify_email_payload(db, EmailVerifyToken, email_data)
    await delete_payload(db, verified_payload)

    user = await db.exec(select(User).where(User.email == email_data.email))
    user = user.first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(email_data.new_password)

    db.add(user)
    await db.commit()

    return {"message": "Password successfully changed"}



