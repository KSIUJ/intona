from pydantic import BaseModel


class EmailData(BaseModel):
    email: str

class EmailDataWithCode(EmailData):
    payload: str

class EmailResetData(EmailData):
    payload: str
    new_password: str

class EmailTokenResponse(EmailData):
    email: str
    payload: str


