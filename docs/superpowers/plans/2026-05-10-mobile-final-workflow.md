# Mobile App - Final Workflow & Reliability Plan

**Goal:** Complete the user journey by adding transcription/MoM viewing and ensuring background recording stability.

### Task 1: Complete Backend Integration
- **Files:** `app/src/services/ApiService.ts`
- **Steps:**
  1. Add `transcribe(filename: string)` to `ApiService`.
  2. Add `generateMom(transcript: string)` to `ApiService`.
  3. Update `BACKEND_URL` to be configurable (e.g., use an environment variable or a default to a local IP).

### Task 2: Result Viewing UI
- **Files:** `app/App.tsx`
- **Steps:**
  1. Create a "Result" state/view to display the Transcript and MoM.
  2. Add buttons to trigger Transcription and MoM generation sequentially after upload.
  3. Add a "Copy to Clipboard" feature for the final MoM.

### Task 3: Background Recording Stability
- **Files:** `app/app.json`, `app/src/services/RecordingService.ts`
- **Steps:**
  1. Update `app.json` to include Android `FOREGROUND_SERVICE` and `RECORD_AUDIO` permissions.
  2. Ensure `RecordingService` uses a foreground service notification (if available via Expo plugins) to prevent the OS from killing it.
  3. Add `stayAwake` support using `expo-keep-awake` to prevent screen lock during active recording if desired by the user.
