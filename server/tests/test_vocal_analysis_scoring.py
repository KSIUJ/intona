import pytest
from src.vocal_analysis.scoring import calculate_frame_score, score_note, calculate_cents_deviation

def test_frame_score_exact_pitch():
    assert calculate_frame_score(440.0, 440.0) == 100.0

def test_frame_score_off_pitch():
    assert calculate_frame_score(500.0, 440.0) == 0.0

def test_cents_deviation():
    assert calculate_cents_deviation(440.0, 440.0) == 0.0

def test_score_note_duration_penalty():
    pitches = [440.0] * 25 
    score = score_note(pitches, target_freq_hz=440.0, expected_duration_sec=1.0, frame_rate_fps=50.0)
    assert score == 50.0