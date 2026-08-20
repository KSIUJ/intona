from datetime import datetime, UTC

from fastapi import HTTPException
from sqlmodel import select

async def verify_email_payload(db, Model, data):
    code = await db.exec(select(Model).where(Model.email == data.email).where(
        Model.payload == data.payload))
    code = code.first()

    if not code:
        raise HTTPException(status_code=404, detail="Code/Token is wrong / deleted")

    if code.expire_at < datetime.now(UTC):
        await db.delete(code)
        await db.commit()
        raise HTTPException(status_code=410, detail="Code/Token is expired")

    return code

async def delete_payload(db, payload):
    await db.delete(payload)

