# Design Spec: Meeting Recorder & Transcriber (Bilingual Thai/English)

**Date:** 2026-05-10
**Status:** Approved
**Target Hardware:** Samsung Galaxy S24 (Android)

## 1. Vision & Purpose
A mobile application designed for MarTech professionals (like Mage) to record hybrid meetings, generate high-accuracy bilingual transcripts (Thai/English), and produce structured Minutes of Meeting (MoM) on-demand.

## 2. Technical Architecture

### 2.1 Mobile Application (Frontend)
- **Framework:** React Native + Expo (TypeScript).
- **Audio Recording:** `expo-av` for robust, long-duration recording.
- **Local Storage:** Files saved locally to `FileSystem` before upload to ensure zero data loss if connection drops.
- **State Management:** Simple React Context or Zustand for recording state.

### 2.2 Backend (Processing Pipeline)
- **Language:** Python (FastAPI).
- **Storage:** Temporary storage for audio files (S3-compatible or local volume).
- **Transcription Service:** OpenAI Whisper (Large-v3 API) - Selected for its superior performance with Thai/English code-switching.
- **Analysis Service:** Google Gemini 1.5 Pro - Selected for its large context window and high-quality Thai summarization capabilities.

## 3. Core Features & Workflow

### 3.1 Recording Phase
- **High-Visibility UI:** Large timer and recording indicator.
- **Background Support:** Must remain active when the screen is locked or app is in background.
- **Local Persistence:** Audio is saved to the phone's storage immediately.

### 3.2 Processing Phase
- **Bilingual Transcription:** Whisper processes the audio and returns a time-stamped transcript.
- **Transcript Viewer:** A dedicated screen where the user can read and potentially edit the raw text.

### 3.3 MoM Generation
- **On-Demand Generation:** User triggers MoM creation from the transcript view.
- **Prompt Strategy:** Gemini is prompted to extract:
  - Executive Summary.
  - Key Decisions.
  - Action Items (specifically highlighting owners).
  - Next Steps.
- **Formatting:** Markdown and PDF export options.

## 4. Design & UX
- **Theme:** Clean, professional "Standard Business" aesthetic.
- **Color Palette:** Professional blues and high-contrast reds for recording states.
- **Navigation:** Simple two-tab or stack-based navigation (History, Active Meeting).

## 5. Security & Safety
- **Encryption:** Use HTTPS for all data transfers.
- **Data Retention:** Audio files should be deleted from the backend after processing is complete.
- **Privacy:** Adheres to standard cloud API data usage policies (Opt-out of training where possible).

## 6. Implementation Phases (High Level)
1. **MVP - Recorder:** Build the mobile recording app with local file persistence.
2. **Phase 2 - Backend:** Set up FastAPI and integrate OpenAI Whisper.
3. **Phase 3 - Intelligence:** Integrate Gemini for MoM generation.
4. **Phase 4 - Polish:** Add export features and UI refinements.
