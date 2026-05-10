import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors, Typography, Spacing, Radius } from '../theme';
import ApiService from '../services/ApiService';
import { StorageService, Recording } from '../services/StorageService';

type Tab = 'transcript' | 'insights';

// #6 - break transcript into readable paragraphs
function formatTranscript(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 4) {
    paragraphs.push(sentences.slice(i, i + 4).join(' ').trim());
  }
  return paragraphs;
}

export default function TranscriptScreen({ route, navigation }: any) {
  const [recording, setRecording] = useState<Recording>(route.params.recording);
  const [tab, setTab] = useState<Tab>('transcript');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const handlePlayPause = async () => {
    if (!recording.uri) return;
    if (playing) {
      await soundRef.current?.pauseAsync();
      setPlaying(false);
      return;
    }
    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          setPlaying(false);
          soundRef.current = null;
        }
      });
    } else {
      await soundRef.current.playAsync();
    }
    setPlaying(true);
  };

  const handleGenerateMom = async () => {
    if (!recording.transcript) return;
    setLoading(true);
    try {
      const result = await ApiService.generateMom(recording.transcript);
      const updated = { ...recording, mom: result.mom };
      await StorageService.save(updated);
      setRecording(updated);
      setTab('insights');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // #7 - regenerate MoM
  const handleRegenerateMom = () => {
    Alert.alert('Regenerate Minutes?', 'This will replace the existing MoM.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Regenerate', onPress: handleGenerateMom },
    ]);
  };

  const handleShare = async () => {
    const content = tab === 'transcript' ? recording.transcript : recording.mom;
    if (!content) return;
    await Share.share({ message: content });
  };

  const paragraphs = recording.transcript ? formatTranscript(recording.transcript) : [];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{recording.title}</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={Colors.secondary} style={{ padding: Spacing.sm }} />
        </TouchableOpacity>
      </View>

      <View style={s.tabBar}>
        {(['transcript', 'insights'] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.activeTab]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.activeTabText]}>
              {t === 'transcript' ? 'Transcript' : 'AI Insights'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {recording.uri && (
        <TouchableOpacity style={s.playBar} onPress={handlePlayPause}>
          <Ionicons name={playing ? 'pause-circle' : 'play-circle'} size={32} color={Colors.secondary} />
          <Text style={s.playText}>{playing ? 'Pause Recording' : 'Play Recording'}</Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={s.content}>
        {tab === 'transcript' ? (
          paragraphs.length > 0 ? paragraphs.map((p, i) => (
            <Text key={i} style={s.paragraph}>{p}</Text>
          )) : (
            <Text style={s.paragraph}>No transcript available.</Text>
          )
        ) : recording.mom ? (
          <View>
            <View style={s.momCard}>
              <View style={s.momHeader}>
                <Text style={s.momIcon}>✦</Text>
                <Text style={s.momTitle}>AI Generated Minutes</Text>
              </View>
              <Text style={s.momText}>{recording.mom}</Text>
            </View>
            {/* #7 - regenerate button */}
            <TouchableOpacity style={s.regenBtn} onPress={handleRegenerateMom} disabled={loading}>
              {loading
                ? <ActivityIndicator color={Colors.secondary} size="small" />
                : <Text style={s.regenBtnText}>↺  Regenerate Minutes</Text>
              }
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>✦ AI Insights</Text>
            <Text style={s.emptyDesc}>
              Generate structured Minutes of Meeting with key decisions and action items in Thai & English.
            </Text>
            <TouchableOpacity style={s.genBtn} onPress={handleGenerateMom} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.genBtnText}>Generate with AI</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.sm },
  headerTitle: { flex: 1, ...Typography.titleLg, color: Colors.onSurface },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.secondary },
  tabText: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  activeTabText: { color: Colors.secondary, fontWeight: '600' },
  content: { padding: Spacing.lg },
  playBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 10, backgroundColor: Colors.surfaceContainerLow, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant, gap: 10 },
  playText: { ...Typography.labelMd, color: Colors.secondary },
  paragraph: { ...Typography.bodyMd, color: Colors.onSurface, lineHeight: 28, marginBottom: Spacing.md },
  momCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: Spacing.md },
  momHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  momIcon: { fontSize: 16, color: Colors.secondary, marginRight: 8 },
  momTitle: { ...Typography.titleLg, color: Colors.onSurface },
  momText: { ...Typography.bodyMd, color: Colors.onSurface, lineHeight: 26 },
  regenBtn: { borderWidth: 1, borderColor: Colors.secondary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  regenBtnText: { ...Typography.labelMd, color: Colors.secondary },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: Colors.onSurface, marginBottom: Spacing.md },
  emptyDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 24 },
  genBtn: { backgroundColor: Colors.secondary, borderRadius: Radius.md, paddingHorizontal: 32, paddingVertical: 14 },
  genBtnText: { ...Typography.titleLg, color: '#fff' },
});
