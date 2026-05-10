import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import RecordingService from './src/services/RecordingService';
import ApiService from './src/services/ApiService';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUri, setLastUri] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordPress = async () => {
    if (isProcessing || isUploading) return;

    setIsProcessing(true);
    setUploadResult(null); // Clear previous results when starting new recording
    try {
      if (isRecording) {
        const uri = await RecordingService.stopRecording();
        setIsRecording(false);
        setLastUri(uri);
        console.log('Recording stopped, URI:', uri);
      } else {
        await RecordingService.startRecording();
        setIsRecording(true);
        setLastUri(null); // Clear previous URI
        console.log('Recording started');
      }
    } catch (error: any) {
      Alert.alert('Recording Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadPress = async () => {
    if (!lastUri || isUploading) return;

    setIsUploading(true);
    try {
      const result = await ApiService.uploadAudio(lastUri);
      console.log('Upload success:', result);
      setUploadResult(result.path || result.filename || 'Upload successful!');
      Alert.alert('Success', 'Audio uploaded successfully');
    } catch (error: any) {
      Alert.alert('Upload Error', error.message || 'Failed to upload audio');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meeting Recorder</Text>

      <View style={styles.recorderContainer}>
        <Text style={[styles.status, isRecording && styles.statusActive]}>
          {isRecording ? 'Recording' : 'Ready to Record'}
        </Text>

        {isRecording && <Text style={styles.timer}>{formatDuration(duration)}</Text>}

        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.stopButton : styles.startButton,
            (isProcessing || isUploading) && styles.disabledButton,
          ]}
          onPress={handleRecordPress}
          disabled={isProcessing || isUploading}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{isRecording ? 'Stop' : 'Start'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {lastUri && !isRecording && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Last recording saved locally:</Text>
          <Text style={styles.uri} numberOfLines={1} ellipsizeMode="middle">
            {lastUri}
          </Text>

          <TouchableOpacity
            style={[styles.uploadButton, isUploading && styles.disabledButton]}
            onPress={handleUploadPress}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>Upload to Server</Text>
            )}
          </TouchableOpacity>

          {uploadResult && (
            <View style={styles.uploadResultBox}>
              <Text style={styles.uploadResultLabel}>Server path:</Text>
              <Text style={styles.uploadResultText}>{uploadResult}</Text>
            </View>
          )}
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 40,
  },
  recorderContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
    fontSize: 48,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 20,
    fontVariant: ['tabular-nums'],
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButton: {
    backgroundColor: '#3182CE',
  },
  stopButton: {
    backgroundColor: '#E53E3E',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 20,
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  resultLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 5,
    fontWeight: '600',
  },
  uri: {
    fontSize: 12,
    color: '#A0AEC0',
    fontFamily: 'System',
    marginBottom: 15,
  },
  uploadButton: {
    backgroundColor: '#38A169',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadResultBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F0FFF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  uploadResultLabel: {
    fontSize: 12,
    color: '#2F855A',
    fontWeight: 'bold',
  },
  uploadResultText: {
    fontSize: 12,
    color: '#276749',
    marginTop: 2,
  },
});
