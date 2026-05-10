# szen-meet

AI-powered meeting recorder that transcribes audio and generates Minutes of Meeting (MoM) in both Thai and English.

**Current version: 1.1.0**

---

## How It Works

1. **Record** — Tap Record tab to start capturing meeting audio
2. **Name** — Give the meeting a name when you stop
3. **Transcribe** — Groq Whisper AI converts audio to text automatically
4. **View** — Read the full transcript in the Transcript tab
5. **Generate MoM** — Tap "Generate with AI" for structured Minutes in Thai & English
6. **Library** — All recordings saved locally on your device

---

## Stack

| Layer | Technology |
|---|---|
| Android App | React Native (Expo) |
| Build | EAS Build (APK) |
| Backend | FastAPI (Python) on Render (Oregon, US) |
| Transcription | Groq Whisper `whisper-large-v3` |
| MoM Generation | Google Gemini `gemini-2.5-flash` |

---

## Screens

| Screen | Description |
|---|---|
| Dashboard | Greeting, recent recordings, quick record button |
| Record | Animated waveform, timer, meeting naming |
| Transcript | Full transcript + AI Insights tabs |
| Library | All saved recordings, search, long-press to delete |

---

## Limitations

| Item | Limit |
|---|---|
| Max recording duration | 1 hour |
| Max file size | 50 MB (~50 min of audio) |
| Groq transcription | 28,800 sec audio/day (~8 hrs), resets daily |
| Gemini MoM | 500 requests/day (free tier) |
| Render free tier | Sleeps after 15 min inactivity → ~30s cold start |
| Storage | Local device only |

---

## User Guide

### First Use
- Backend sleeps when idle (Render free tier) — first request may take ~30 seconds
- Wake the server by visiting: `https://meeting-recorder-bpp6.onrender.com/health`

### Recording
1. Tap **Record** tab
2. Tap **Start Recording**
3. Tap the red stop button when done
4. Enter a meeting name → tap **Transcribe & Save**

### Results
- **Transcript tab** — full text of the meeting
- **AI Insights tab** — tap "Generate with AI" for MoM in Thai & English

### Library
- View all past recordings
- Tap a recording to view transcript/insights
- **Long press** to delete a recording

### MoM Structure
1. Meeting Overview
2. Key Discussion Points
3. Decisions Made
4. Action Items (with owners if mentioned)

---

## Project Structure

```
meeting-recorder/
├── app/                        # React Native (Expo) Android app
│   ├── src/
│   │   ├── theme.ts            # Design system (colors, typography, spacing)
│   │   ├── Navigation.tsx      # Bottom tab + stack navigation
│   │   ├── screens/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── RecordingScreen.tsx
│   │   │   ├── TranscriptScreen.tsx
│   │   │   └── LibraryScreen.tsx
│   │   └── services/
│   │       ├── ApiService.ts       # Backend API calls
│   │       ├── RecordingService.ts # Audio recording
│   │       └── StorageService.ts   # Local AsyncStorage
│   └── App.tsx
└── backend/                    # FastAPI Python backend
    ├── main.py
    ├── core/config.py
    └── services/
        ├── transcription.py    # Groq Whisper
        └── intelligence.py     # Gemini MoM
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

---

## Changelog

### v1.1.0
- Renamed app to **szen-meet**
- New app icon
- Removed unused Insights & Account tabs
- Fixed bottom tab bar overlapping Android 3-button navigation bar
- Switched transcription from Gemini to **Groq Whisper** (no region restrictions)
- Upgraded to **Gemini 2.5 Flash** for MoM generation
- Backend moved to **Oregon (US)** region to fix Gemini API region error

### v1.0.0
- Initial release
- Record, transcribe, generate MoM
- Local recording history
- Dashboard, Library, Recording, Transcript screens
