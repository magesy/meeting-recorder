# Meeting Recorder Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native + Expo mobile application that records audio, stores it locally, and communicates with the backend for transcription and MoM.

**Architecture:** A clean React Native application using Expo's managed workflow. It uses `expo-av` for audio management and `expo-file-system` for local data persistence.

**Tech Stack:** React Native, Expo, TypeScript, `expo-av`, `expo-file-system`, Axios for API communication.

---

### Task 1: Expo Project Initialization

**Files:**
- Create: `app/package.json`
- Create: `app/App.tsx`
- Create: `app/app.json`

- [ ] **Step 1: Initialize Expo project**
```bash
npx create-expo-app app --template expo-template-blank-typescript
```

- [ ] **Step 2: Add necessary dependencies**
```bash
cd app && npx expo install expo-av expo-file-system axios
```

- [ ] **Step 3: Create base App.tsx with simple UI**
```tsx
import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Meeting Recorder</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' }
});
```

- [ ] **Step 4: Commit**
`git add app && git commit -m "chore: initialize expo mobile project"`

---

### Task 2: Audio Recording Service

**Files:**
- Create: `app/src/services/RecordingService.ts`
- Modify: `app/App.tsx`

- [ ] **Step 1: Implement Recording Service**
```typescript
import { Audio } from 'expo-av';

export class RecordingService {
  private static recording: Audio.Recording | null = null;

  static async startRecording() {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    this.recording = recording;
  }

  static async stopRecording() {
    if (!this.recording) return null;
    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI();
    this.recording = null;
    return uri;
  }
}
```

- [ ] **Step 2: Connect Service to UI**
```tsx
import { RecordingService } from './src/services/RecordingService';
import { Button } from 'react-native';

// In App component:
const [recording, setRecording] = React.useState(false);

const handlePress = async () => {
  if (recording) {
    const uri = await RecordingService.stopRecording();
    console.log('Saved to:', uri);
    setRecording(false);
  } else {
    await RecordingService.startRecording();
    setRecording(true);
  }
};

// In render:
<Button title={recording ? "Stop" : "Record"} onPress={handlePress} />
```

- [ ] **Step 3: Commit**
`git commit -m "feat: add basic audio recording service"`

---

### Task 3: Backend Integration (Upload)

**Files:**
- Create: `app/src/services/ApiService.ts`

- [ ] **Step 1: Implement Upload Service**
```typescript
import axios from 'axios';

const BACKEND_URL = 'http://YOUR_BACKEND_IP:3000';

export class ApiService {
  static async uploadAudio(uri: string) {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: 'recording.m4a',
      type: 'audio/m4a',
    } as any);

    const response = await axios.post(`${BACKEND_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}
```

- [ ] **Step 2: Commit**
`git commit -m "feat: add backend upload service"`
