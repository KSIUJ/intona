from fastapi import APIRouter
from starlette.websockets import WebSocket

from src.logs.models import ExerciseLogs
from src.vocal_analysis.utils import add_exercise_result

router = APIRouter()

@router.websocket("/audio-data")
async def sentData(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_bytes()
        await websocket.send_text("data received")

# this is for testing purposes only
@router.post("/add/{user_id}/testLog")
async def addTestLog(user_id,log: ExerciseLogs):
    await add_exercise_result(user_id,log)

