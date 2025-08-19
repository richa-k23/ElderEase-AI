# backend/app.py
import os
import sqlite3
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from gtts import gTTS

# CONFIG
TTS_DIR = "tts"
DB_FILE = "reminders.db"
os.makedirs(TTS_DIR, exist_ok=True)

app = FastAPI()

# Allow frontend dev server (adjust if your frontend runs elsewhere)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder to serve TTS files
app.mount("/tts", StaticFiles(directory=TTS_DIR), name="tts")


# --- Database helpers ---
def get_conn():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

conn = get_conn()
cur = conn.cursor()
cur.execute(
    """
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    remind_time TEXT
)
"""
)
conn.commit()


# --- Request / response models ---
class SetReminderReq(BaseModel):
    text: str
    remind_time: str | None = None   # optional
    lang: str = "hi"                 # 'hi' or 'mr'


class TTSReq(BaseModel):
    text: str
    lang: str = "hi"


# --- Helper: polite replies ---
def make_polite_reply(action: str, reminder_text: str = None):
    if action == "set_reminder":
        return f"Namaste. Main aapka reminder set kar diya hoon: {reminder_text}."
    if action == "emergency":
        return "Namaste. Emergency alert simulated — family notified (simulation)."
    return "Namaste. Main aapki madad ke liye yahan hoon."


# --- Helper: create TTS file ---
def create_tts_file(text: str, lang: str = "hi"):
    fname = f"{uuid.uuid4().hex}.mp3"
    path = os.path.join(TTS_DIR, fname)
    try:
        tts = gTTS(text=text, lang=lang)
        tts.save(path)
    except Exception as e:
        raise
    return f"/tts/{fname}"


# --- Endpoints ---
@app.post("/set_reminder")
async def set_reminder(req: SetReminderReq):
    try:
        created_at = datetime.utcnow().isoformat()
        # if remind_time not provided → default None
        remind_time = req.remind_time if req.remind_time else None

        cur = conn.cursor()
        cur.execute(
            "INSERT INTO reminders (text, created_at, remind_time) VALUES (?, ?, ?)",
            (req.text, created_at, remind_time),
        )
        conn.commit()
        reminder_id = cur.lastrowid

        reply = make_polite_reply("set_reminder", req.text)
        tts_url = create_tts_file(reply, lang=req.lang or "hi")

        return {
            "status": "ok",
            "reminder": {
                "id": reminder_id,
                "text": req.text,
                "created_at": created_at,
                "remind_time": remind_time,
            },
            "reply": reply,
            "tts_url": tts_url,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reminders")
async def get_reminders():
    cur = conn.cursor()
    cur.execute("SELECT id, text, created_at, remind_time FROM reminders ORDER BY id DESC")
    rows = cur.fetchall()
    items = [dict(r) for r in rows]
    return {"status": "ok", "reminders": items}


@app.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: int):
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
        conn.commit()
        return {"status": "ok", "deleted": reminder_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tts")
async def tts(req: TTSReq):
    try:
        tts_url = create_tts_file(req.text, lang=req.lang or "hi")
        return {"status": "ok", "tts_url": tts_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/emergency")
async def emergency():
    try:
        reply = make_polite_reply("emergency")
        tts_url = create_tts_file(reply, lang="hi")
        return {
            "status": "ok",
            "simulated": True,
            "message": "Emergency simulated. Family notified (simulation).",
            "reply": reply,
            "tts_url": tts_url,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
