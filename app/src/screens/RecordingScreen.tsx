import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { Colors, Typography, Spacing, Radius } from '../theme';
import RecordingService from '../services/RecordingService';
import ApiService from '../services/ApiService';
import { StorageService } from '../services/StorageService';

const BAR_COUNT = 13;

function WaveformBars({ active }: { active: boolean }) {
  const anims = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (!active) {
      anims.forEach(a => Animated.spring(a, { toValue: 0.3, useNativeDriver: true }).start());
      return;
    }
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 60),
          Animated.timing(a, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.2, duration: 350, useNativeDriver: true }),
        ])
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [active]);

  return (
    <View style={s.waveform}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={[s.bar, {
          transform: [{ scaleY: a }],
          opacity: active ? 1 : 0.3,
          backgroundColor: i === Math.floor(BAR_COUNT / 2) ? Colors.secondary : Colors.secondaryContainer,
        }]} />
      ))}
    </View>
  );
}

export default function RecordingScreen({ navigation }: any) {
  useKeepAwake();
  const [stage, setStage] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [duration, setDuration] = useState(0);
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [nameModal, setNameModal] = useState(false);
  const [meetingName, setMeetingName] = useState('');
  const [processingMsg, setProcessingMsg] = useState('Uploading audio...');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stage === 'recording') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const ss = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${ss}`;
  };

  const handleStart = async () => {
    try {
      setDuration(0);
      await RecordingService.startRecording();
      setStage('recording');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleStop = async () => {
    try {
      const uri = await RecordingService.stopRecording();
      setPendingUri(uri);
      setStage('idle');
      setMeetingName(`Meeting ${new Date().toLocaleDateString()}`);
      setNameModal(true);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  // #1 - warn before discarding
  const handleCancelModal = () => {
    Alert.alert(
      'Discard Recording?',
      'The recording will be lost if you cancel.',
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => {
          setPendingUri(null);
          setNameModal(false);
        }},
      ]
    );
  };

  const handleProcess = async () => {
    if (!pendingUri) return;
    setNameModal(false);
    setStage('processing');

    // #2 - save locally first so URI is not lost on failure
    const rec = {
      id: Date.now().toString(),
      title: meetingName || 'Untitled Meeting',
      date: new Date().toISOString(),
      duration,
      transcript: null,
      mom: null,
      uri: pendingUri,
    };
    await StorageService.save(rec);

    try {
      // #4 - cold start message
      setProcessingMsg('Connecting to server...\n(First request may take ~30 seconds)');
      const upload = await ApiService.uploadAudio(pendingUri);

      setProcessingMsg('Transcribing with AI...');
      const result = await ApiService.transcribe(upload.filename);

      // #8 - delete file from server after transcription
      await ApiService.deleteFile(upload.filename).catch(() => {});

      const updated = { ...rec, transcript: result.transcript };
      await StorageService.save(updated);
      setStage('idle');
      navigation.navigate('Transcript', { recording: updated });
    } catch (e: any) {
      setStage('idle');
      // #2 - allow retry - recording is already saved locally
      Alert.alert(
        'Processing Failed',
        `${e.message}\n\nYour recording was saved. You can retry from the Library.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.header}>
          {stage === 'recording' && (
            <View style={s.timerBadge}>
              <View style={s.redDot} />
              <Text style={s.timerText}>{formatTime(duration)}</Text>
            </View>
          )}
        </View>

        <View style={s.waveContainer}>
          <WaveformBars active={stage === 'recording'} />
          <Text style={s.captureText}>
            {stage === 'recording' ? 'Capturing high-fidelity audio...' :
             stage === 'processing' ? processingMsg : 'Ready to record'}
          </Text>
        </View>

        <View style={s.controls}>
          {stage === 'idle' && (
            <TouchableOpacity style={s.startBtn} onPress={handleStart}>
              <Text style={s.startBtnText}>Start Recording</Text>
            </TouchableOpacity>
          )}
          {stage === 'recording' && (
            <TouchableOpacity style={s.stopBtn} onPress={handleStop}>
              <View style={s.stopIcon} />
            </TouchableOpacity>
          )}
          {stage === 'processing' && (
            <Text style={s.processingText}>Please wait...</Text>
          )}
        </View>
      </View>

      <Modal visible={nameModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Name this recording</Text>
            <TextInput
              style={s.input}
              value={meetingName}
              onChangeText={setMeetingName}
              placeholder="Meeting name"
              autoFocus
            />
            <TouchableOpacity style={s.processBtn} onPress={handleProcess}>
              <Text style={s.processBtnText}>Transcribe & Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancelModal}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.lg, minHeight: 44 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: Colors.outlineVariant },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.recording, marginRight: 8 },
  timerText: { fontSize: 18, fontWeight: '600', color: Colors.onSurface },
  waveContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waveform: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.xl, padding: 40, gap: 6 },
  bar: { width: 6, height: 60, borderRadius: 3 },
  captureText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginTop: Spacing.lg, textAlign: 'center' },
  controls: { alignItems: 'center', paddingBottom: Spacing.lg },
  startBtn: { backgroundColor: Colors.secondary, borderRadius: Radius.full, paddingHorizontal: 48, paddingVertical: 18 },
  startBtnText: { ...Typography.titleLg, color: '#fff' },
  stopBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.recording, justifyContent: 'center', alignItems: 'center' },
  stopIcon: { width: 24, height: 24, borderRadius: 4, backgroundColor: '#fff' },
  processingText: { ...Typography.bodyLg, color: Colors.onSurfaceVariant },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, paddingBottom: 40 },
  modalTitle: { ...Typography.titleLg, color: Colors.onSurface, marginBottom: Spacing.md },
  input: { borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: Radius.md, padding: Spacing.md, ...Typography.bodyMd, color: Colors.onSurface, marginBottom: Spacing.md },
  processBtn: { backgroundColor: Colors.secondary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm },
  processBtnText: { ...Typography.titleLg, color: '#fff' },
  cancelText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', padding: Spacing.sm },
});
