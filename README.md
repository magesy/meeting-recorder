# Meeting Recorder

AI-powered meeting recorder that transcribes audio and generates Minutes of Meeting (MoM) in both Thai and English.

---

## How It Works

1. **Record** — Tap Start to record your meeting audio on Android
2. **Process** — Tap "Process Meeting" to upload and transcribe
3. **Transcribe** — Groq Whisper AI converts audio to text
4. **Generate MoM** — Gemini AI generates structured Minutes of Meeting in Thai & English

---

## Stack

| Layer | Technology |
|---|---|
| Android App | React Native (Expo) |
| Build | EAS Build (APK) |
| Backend | FastAPI (Python) |
| Hosting | Render (free tier, Oregon US) |
| Transcription | Groq Whisper `whisper-large-v3` |
| MoM Generation | Google Gemini `gemini-2.5-flash` |

---

## Limitations

| Item | Limit |
|---|---|
| Max recording duration | 1 hour |
| Max file size | 50 MB (~50 min of audio) |
| Groq transcription | 28,800 sec audio/day (~8 hrs), resets daily |
| Gemini MoM | 500 requests/day (free tier) |
| Render free tier | Sleeps after 15 min inactivity → ~30s cold start |

---

## User Guide

### First Use
- The backend server sleeps when not in use (Render free tier)
- If the app is slow on first request, wait ~30 seconds and try again
- You can wake the server manually by visiting: `https://meeting-recorder-bpp6.onrender.com/health`

### Recording
- Tap **Start** to begin recording
- Tap **Stop** when the meeting ends
- Tap **Process Meeting** to upload and transcribe

### Results
- **Transcript tab** — full text of the meeting
- **Minutes (MoM) tab** — tap "Generate Minutes with AI" for structured MoM in Thai & English

### MoM Structure
Each generated MoM includes:
1. Meeting Overview
2. Key Discussion Points
3. Decisions Made
4. Action Items (with owners if mentioned)

---

## Project Structure

```
meeting-recorder/
├── app/                  # React Native (Expo) Android app
│   ├── src/
│   │   ├── config.ts     # Backend URL config
│   │   └── services/
│   │       ├── ApiService.ts       # API calls to backend
│   │       └── RecordingService.ts # Audio recording
│   └── App.tsx           # Main UI
└── backend/              # FastAPI Python backend
    ├── main.py           # API routes
    ├── core/
    │   └── config.py     # Environment config
    └── services/
        ├── transcription.py  # Groq Whisper
        └── intelligence.py   # Gemini MoM
```

---

## Environment Variables (Backend)

| Key | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key for Whisper transcription |
| `GOOGLE_API_KEY` | Google AI Studio key for Gemini MoM |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check / wake server |
| POST | `/upload` | Upload audio file |
| POST | `/transcribe/{filename}` | Transcribe uploaded file |
| POST | `/generate-mom` | Generate MoM from transcript |
