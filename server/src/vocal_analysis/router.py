import logging

from fastapi import APIRouter
from starlette.websockets import WebSocket

logging.basicConfig(level=logging.INFO)
router = APIRouter()

@router.websocket("/audio-data")
async def sentData(websocket: WebSocket):
    await websocket.accept()

