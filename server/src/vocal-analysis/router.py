from fastapi import APIRouter
from starlette.websockets import WebSocket

router = APIRouter()

@router.websocket("/audio-data")
async def sentData(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_bytes()
        await websocket.send_text("data received")


