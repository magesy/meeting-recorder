import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import RecordingService from './src/services/RecordingService';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [lastUri, setLastUri] = useState<string | null>(null);

  const handleRecordPress = async () => {
    try {
      if (isRecording) {
        const uri = await RecordingService.stopRecording();
        setIsRecording(false);
        setLastUri(uri);
        console.log('Recording stopped, URI:', uri);
      } else {
        await RecordingService.startRecording();
        setIsRecording(true);
        console.log('Recording started');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meeting Recorder</Text>
      <Text style={styles.status}>
        {isRecording ? 'Recording...' : 'Idle'}
      </Text>
      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={handleRecordPress}
      />
      {lastUri && (
        <Text style={styles.uri} numberOfLines={1} ellipsizeMode="middle">
          Last recorded: {lastUri}
        </Text>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    color: 'red',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  uri: {
    fontSize: 12,
    marginTop: 20,
    color: '#666',
  },
});
