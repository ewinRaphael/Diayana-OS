# vps/hermes_nexus_bridge.py
# Run on Hostinger VPS: pip install fastapi uvicorn google-genai supabase python-dotenv
import os
import json
import base64
from datetime import date
from typing import Optional
from fastapi import FastAPI, Header, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from google import genai
from google.genai import types
from supabase import create_client, Client

app = FastAPI(title="NexusOS - Hermes Agent to Supabase Bridge")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
HERMES_WEBHOOK_TOKEN = os.environ.get("HERMES_WEBHOOK_TOKEN", "nexus-secret-token")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

SYSTEM_PROMPT = """
You are the NexusOS ingestion engine for a founder managing two businesses ('hashadz' and 'slash') and a 'personal' life workspace.
Transcribe the input (which may contain Malayalam, English, or Manglish) accurately and extract structured JSON matching this exact schema:
{
  "workspace": "hashadz | slash | personal",
  "category": "meeting | project | active_log | journal",
  "title": "Concise summary title",
  "raw_transcript": "Exact transcript of the audio or text",
  "structured_summary": "Bullet-point structured notes",
  "extracted_tasks": [
    { "title": "Task name", "due_date": "YYYY-MM-DD", "priority": "high|medium|low", "reminder_at": "ISO_TIMESTAMP or null" }
  ],
  "extracted_metrics": {
    "achievements": ["list of wins if personal"],
    "time_wasters": ["list of distractions if personal"]
  }
}
"""

class TextIngestPayload(BaseModel):
    text: str
    source: str = "telegram"
    default_workspace: Optional[str] = None

def persist_to_supabase(parsed: dict, source: str, audio_url: Optional[str] = None):
    workspace = parsed.get("workspace", "personal").lower()
    if workspace not in ("hashadz", "slash", "personal"):
        workspace = "personal"

    category = parsed.get("category", "active_log").lower()
    if category not in ("meeting", "project", "active_log", "journal"):
        category = "journal" if workspace == "personal" else "active_log"

    # 1. Insert into entries
    entry_res = supabase.table("entries").insert({
        "workspace": workspace,
        "category": category,
        "title": parsed.get("title", "Untitled Capture"),
        "raw_transcript": parsed.get("raw_transcript", ""),
        "structured_content": parsed.get("structured_summary", ""),
        "audio_url": audio_url,
        "source": source,
        "entry_date": str(date.today())
    }).execute()

    # 2. Insert extracted_tasks into tasks
    tasks_inserted = 0
    for t in parsed.get("extracted_tasks", []):
        if t.get("title"):
            supabase.table("tasks").insert({
                "workspace": workspace,
                "title": t["title"],
                "priority": t.get("priority", "medium") if t.get("priority") in ("low", "medium", "high", "urgent") else "medium",
                "due_date": t.get("due_date") or str(date.today()),
                "reminder_at": t.get("reminder_at")
            }).execute()
            tasks_inserted += 1

    # 3. Update personal_daily_metrics if achievements or time_wasters exist
    metrics = parsed.get("extracted_metrics", {})
    achievements = metrics.get("achievements", [])
    time_wasters = metrics.get("time_wasters", [])
    if workspace == "personal" and (achievements or time_wasters):
        today_str = str(date.today())
        existing = supabase.table("personal_daily_metrics").select("*").eq("entry_date", today_str).execute()
        if existing.data:
            row = existing.data[0]
            updated_ach = (row.get("achievements_list") or []) + achievements
            updated_tw = (row.get("time_wasters_list") or []) + time_wasters
            score = max(0, min(100, 50 + len(updated_ach) * 15 - len(updated_tw) * 10))
            supabase.table("personal_daily_metrics").update({
                "achievements_list": updated_ach,
                "time_wasters_list": updated_tw,
                "productivity_score": score
            }).eq("id", row["id"]).execute()
        else:
            score = max(0, min(100, 50 + len(achievements) * 15 - len(time_wasters) * 10))
            supabase.table("personal_daily_metrics").insert({
                "entry_date": today_str,
                "achievements_list": achievements,
                "time_wasters_list": time_wasters,
                "productivity_score": score
            }).execute()

    return {"entry": entry_res.data, "tasks_created": tasks_inserted, "parsed": parsed}

@app.post("/webhooks/nexus-text")
async def ingest_text(payload: TextIngestPayload, x_hermes_token: str = Header(None)):
    if x_hermes_token != HERMES_WEBHOOK_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid Hermes webhook token")

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[SYSTEM_PROMPT, f"Input text: {payload.text}"],
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    parsed = json.loads(response.text)
    if payload.default_workspace in ("hashadz", "slash", "personal"):
        parsed["workspace"] = payload.default_workspace

    return persist_to_supabase(parsed, source=payload.source)

@app.post("/webhooks/nexus-audio")
async def ingest_audio(
    file: UploadFile = File(...),
    source: str = Form("telegram"),
    x_hermes_token: str = Header(None)
):
    if x_hermes_token != HERMES_WEBHOOK_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid Hermes webhook token")

    audio_bytes = await file.read()
    mime_type = file.content_type or "audio/ogg"

    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            SYSTEM_PROMPT,
            types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
        ],
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    parsed = json.loads(response.text)
    return persist_to_supabase(parsed, source=source)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "NexusOS Hermes Bridge", "timestamp": str(date.today())}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 3300)))
