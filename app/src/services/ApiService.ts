import axios from 'axios';
import { Platform } from 'react-native';

const BACKEND_URL = 'http://localhost:3000'; // Adjust as needed for your environment

class ApiService {
  /**
   * Uploads an audio file to the backend.
   * @param uri The local URI of the audio file.
   * @returns The response data from the server.
   */
  static async uploadAudio(uri: string) {
    let fileUri = uri;
    
    // Prepend file:// if missing (needed for Android uploads in some React Native versions)
    if (Platform.OS === 'android' && !fileUri.startsWith('file://')) {
      fileUri = `file://${fileUri}`;
    }

    const formData = new FormData();
    
    // Extract filename from URI
    const filename = fileUri.split('/').pop() || 'recording.m4a';
    
    // In React Native, FormData.append for files requires an object with uri, name, and type
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: 'audio/m4a', // Defaulting to m4a as it's common for HIGH_QUALITY preset
    } as any);

    try {
      const response = await axios.post(`${BACKEND_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Important for progress tracking if needed later
        timeout: 60000, 
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error('Upload error details:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Failed to upload audio to server');
      }
      throw error;
    }
  }
}

export default ApiService;
