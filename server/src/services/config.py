from src.config import settings
CONDITIONS=[
    ["starts-with", "$Content-Type", "audio/"],
    # 480_000 should represent about 30 seconds of audio, one of the models need slightly smaller minimal size of a file
    ["content-length-range", 480_000, 50 * 1024 * 1024],
]