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


def getHtmlCodeTemplate(code):
    return f"""<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body
    style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5;">
        <tr>
            <td align="center">
                <table width="100%" max-width="600px" cellpadding="0" cellspacing="0"
                    style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin: 20px auto;">

                    <!-- Header -->
                    <tr>
                        <td style="background-color: #111827; padding: 30px; text-align: center;">
                            <h1
                                style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                                Intona Vibe</h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px; color: #374151; line-height: 1.6;">
                            <h2 style="margin-top: 0; font-size: 20px; color: #111827;">Password reset code request</h2>
                            <p style="font-size: 16px;">Your password reset code is: {code}</p>

                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>

</html>"""