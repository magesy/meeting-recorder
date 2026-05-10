import { Audio } from 'expo-av';

/**
 * Service to manage audio recording state and operations.
 * Implemented as a Singleton to ensure global control over the microphone.
 */
class RecordingService {
  private static instance: RecordingService;
  private recording: Audio.Recording | null = null;

  private constructor() {}

  /**
   * Returns the singleton instance of the RecordingService.
   */
  public static getInstance(): RecordingService {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService();
    }
    return RecordingService.instance;
  }

  /**
   * Checks if a recording is currently active.
   */
  isRecordingInProgress(): boolean {
    return this.recording !== null;
  }

  /**
   * Starts a new audio recording.
   * Handles permissions, audio mode configuration, and recording initialization.
   * @throws Error if recording is already in progress or permissions are denied.
   */
  async startRecording(): Promise<void> {
    try {
      if (this.recording) {
        throw new Error('Recording is already in progress');
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access microphone was denied');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      this.recording = recording;
    } catch (error) {
      console.error('Failed to start recording', error);
      // Ensure we clean up if something fails after setting audio mode
      await this.resetAudioMode();
      throw error;
    }
  }

  /**
   * Stops the current recording and returns the URI of the recorded file.
   * Ensures the recording object is unloaded and state is reset.
   * @returns The URI of the recording, or null if no recording was active.
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) {
        return null;
      }

      const recording = this.recording;
      this.recording = null; // Clear state early to prevent race conditions

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      await this.resetAudioMode();

      return uri;
    } catch (error) {
      console.error('Failed to stop recording', error);
      this.recording = null; // Ensure state is cleared even on error
      await this.resetAudioMode();
      throw error;
    }
  }

  /**
   * Resets the audio mode to default state.
   */
  private async resetAudioMode(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });
    } catch (error) {
      console.error('Failed to reset audio mode', error);
    }
  }
}

export default RecordingService.getInstance();
