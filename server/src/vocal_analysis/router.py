import numpy as np
from numpy.ma.core import argmax
from scipy.io.wavfile import read
from fastapi import APIRouter
from starlette.websockets import WebSocket, WebSocketDisconnect

from src.logs.models import ExerciseLogs
from src.vocal_analysis.utils import add_exercise_result, crepe_model

import logging

logging.basicConfig(level=logging.INFO)
router = APIRouter()

@router.websocket("/audio-data")
async def sentData(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            array = np.frombuffer(data, dtype=np.float32)
            array = array.reshape(1, 1024)
            max_val = np.max(np.abs(array))

            noise_threshold = 0.01  # <- Tę wartość dopasuj (np. między 0.01 a 0.10)

            if max_val < noise_threshold:
                # Jest za cicho, nie marnujemy mocy procesora na model
                continue

            if max_val > 0:
                array = array / max_val
            outputs = crepe_model.run(None, {crepe_model.get_inputs()[0].name: array})
            if (outputs[0][0][argmax(outputs)]) >= 0.6:
                await websocket.send_text(f"{argmax(outputs)} confidence: {outputs[0][0][argmax(outputs)]}")
    except WebSocketDisconnect as e:
        logging.info(f"WebSocket closed {e.code}")

# this is for testing purposes only
@router.post("/add/{user_id}/testLog")
async def addTestLog(user_id,log: ExerciseLogs):
    await add_exercise_result(user_id,log)

@router.get("/test")
def test_model():
    sample_rate, data = read("src/models/TestingFile.wav")
    data = data.astype(np.float32)
    data = data.mean(axis=1)
    range_of_data = 0

    batch = data[range_of_data:range_of_data + 1024]
    batch = batch.reshape(1, 1024)
    outputs = crepe_model.run(None, {crepe_model.get_inputs()[0].name: batch})
    #logging.info(argmax(outputs))
