import io
import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from PIL import Image

app = FastAPI(title="Karigar AI Service")

@app.get("/health")
def health():
    return {"status":"ok","model":"not_configured","reference_comparison":False}

@app.post("/analyze-image")
async def analyze_image(image: UploadFile = File(...)):
    if image.content_type not in {"image/jpeg","image/png","image/webp"}:
        raise HTTPException(status_code=415, detail="Unsupported image type")
    content = await image.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image is larger than 10 MB")
    try:
        with Image.open(io.BytesIO(content)) as opened:
            opened.verify()
        with Image.open(io.BytesIO(content)) as opened:
            width, height = opened.size
    except Exception:
        raise HTTPException(status_code=422, detail="Corrupted or invalid image")
    if width < 128 or height < 128:
        raise HTTPException(status_code=422, detail="Image resolution is too small")
    raise HTTPException(
        status_code=501,
        detail="No image model or reference embedding database is configured. Configure CLIP and verified references to enable analysis."
    )

@app.post("/generate-embedding")
async def generate_embedding(image: UploadFile = File(...)):
    raise HTTPException(status_code=501, detail="Embedding model is not configured")
