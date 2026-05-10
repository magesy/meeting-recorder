import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  Dimensions
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import RecordingService from './src/services/RecordingService';
import ApiService from './src/services/ApiService';

const { width } = Dimensions.get('window');

type AppStage = 'idle' | 'recording' | 'uploading' | 'transcribing' | 'viewing';
type ViewTab = 'transcript' | 'mom';

export default function App() {
  useKeepAwake();
  
  const [stage, setStage] = useState<AppStage>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUri, setLastUri] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [mom, setMom] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('transcript');
  const [isGeneratingMom, setIsGeneratingMom] = useState(false);
  
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (stage === 'recording') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (stage === 'idle') {
        setDuration(0);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stage]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordPress = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (stage === 'recording') {
        const uri = await RecordingService.stopRecording();
        setStage('idle');
        setLastUri(uri);
        console.log('Recording stopped, URI:', uri);
      } else {
        // Reset state for new recording
        setLastUri(null);
        setUploadedFilename(null);
        setTranscript(null);
        setMom(null);
        setActiveTab('transcript');
        
        await RecordingService.startRecording();
        setStage('recording');
        console.log('Recording started');
      }
    } catch (error: any) {
      Alert.alert('Recording Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadAndTranscribe = async () => {
    if (!lastUri || stage !== 'idle') return;

    setStage('uploading');
    try {
      // 1. Upload
      const uploadResult = await ApiService.uploadAudio(lastUri);
      const filename = uploadResult.filename;
      setUploadedFilename(filename);
      
      // 2. Transcribe
      setStage('transcribing');
      const transcribeResult = await ApiService.transcribe(filename);
      setTranscript(transcribeResult.transcript);
      setStage('viewing');
      setActiveTab('transcript');
      
    } catch (error: any) {
      setStage('idle');
      Alert.alert('Error', error.message || 'Process failed');
    }
  };

  const handleGenerateMom = async () => {
    if (!transcript || isGeneratingMom) return;

    setIsGeneratingMom(true);
    try {
      const result = await ApiService.generateMom(transcript);
      setMom(result.mom);
      setActiveTab('mom');
    } catch (error: any) {
      Alert.alert('MoM Error', error.message || 'Failed to generate Minutes of Meeting');
    } finally {
      setIsGeneratingMom(false);
    }
  };

  const renderStatus = () => {
    switch (stage) {
      case 'recording': return 'Recording...';
      case 'uploading': return 'Uploading Audio...';
      case 'transcribing': return 'Transcribing (AI)...';
      case 'viewing': return 'Results Ready';
      default: return 'Ready';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meeting Recorder</Text>

      {stage !== 'viewing' && (
        <View style={styles.recorderCard}>
          <Text style={[styles.status, stage === 'recording' && styles.statusActive]}>
            {renderStatus()}
          </Text>

          {stage === 'recording' && <Text style={styles.timer}>{formatDuration(duration)}</Text>}

          <TouchableOpacity
            style={[
              styles.recordButton,
              stage === 'recording' ? styles.stopButton : styles.startButton,
              (isProcessing || stage === 'uploading' || stage === 'transcribing') && styles.disabledButton,
            ]}
            onPress={handleRecordPress}
            disabled={isProcessing || stage === 'uploading' || stage === 'transcribing'}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{stage === 'recording' ? 'Stop' : 'Start'}</Text>
            )}
          </TouchableOpacity>

          {lastUri && stage === 'idle' && (
            <TouchableOpacity
              style={styles.processButton}
              onPress={handleUploadAndTranscribe}
            >
              <Text style={styles.processButtonText}>Process Meeting</Text>
            </TouchableOpacity>
          )}

          {(stage === 'uploading' || stage === 'transcribing') && (
            <ActivityIndicator size="large" color="#3182CE" style={{ marginTop: 20 }} />
          )}
        </View>
      )}

      {stage === 'viewing' && (
        <View style={styles.resultsCard}>
          <View style={styles.tabBar}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'transcript' && styles.activeTab]}
              onPress={() => setActiveTab('transcript')}
            >
              <Text style={[styles.tabText, activeTab === 'transcript' && styles.activeTabText]}>Transcript</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'mom' && styles.activeTab]}
              onPress={() => setActiveTab('mom')}
            >
              <Text style={[styles.tabText, activeTab === 'mom' && styles.activeTabText]}>Minutes (MoM)</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {activeTab === 'transcript' ? (
              <Text style={styles.transcriptText}>{transcript || 'No transcript available.'}</Text>
            ) : (
              <View>
                {mom ? (
                  <Text style={styles.momText}>{mom}</Text>
                ) : (
                  <View style={styles.emptyMom}>
                    <Text style={styles.emptyText}>Minutes of Meeting haven't been generated yet.</Text>
                    <TouchableOpacity 
                      style={styles.generateButton}
                      onPress={handleGenerateMom}
                      disabled={isGeneratingMom}
                    >
                      {isGeneratingMom ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.generateButtonText}>Generate Minutes with AI</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => setStage('idle')}
          >
            <Text style={styles.resetButtonText}>New Recording</Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 30,
  },
  recorderCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  status: {
    fontSize: 18,
    color: '#718096',
    marginBottom: 10,
    fontWeight: '600',
  },
  statusActive: {
    color: '#E53E3E',
  },
  timer: {
    fontSize: 54,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 30,
    fontVariant: ['tabular-nums'],
  },
  recordButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButton: {
    backgroundColor: '#3182CE',
  },
  stopButton: {
    backgroundColor: '#E53E3E',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  processButton: {
    marginTop: 30,
    backgroundColor: '#38A169',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  processButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  resultsCard: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#3182CE',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
  },
  activeTabText: {
    color: '#3182CE',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2D3748',
  },
  momText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2D3748',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyMom: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#805AD5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  resetButtonText: {
    color: '#3182CE',
    fontSize: 16,
    fontWeight: '600',
  },
});
