import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { StorageService, Recording } from '../services/StorageService';
import ApiService from '../services/ApiService';

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:00`;
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LibraryScreen({ navigation }: any) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    const all = await StorageService.getAll();
    setRecordings(all);
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  // #5 - rename on long press
  const handleLongPress = (r: Recording) => {
    Alert.alert(r.title, 'What would you like to do?', [
      {
        text: 'Rename',
        onPress: () => {
          Alert.prompt('Rename Recording', 'Enter new name:', async (newName) => {
            if (newName?.trim()) {
              await StorageService.save({ ...r, title: newName.trim() });
              load();
            }
          }, 'plain-text', r.title);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await StorageService.delete(r.id);
          load();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // retry processing for recordings without transcript
  const handleRetry = async (r: Recording) => {
    if (!r.uri) {
      Alert.alert('Cannot Retry', 'Audio file is no longer available.');
      return;
    }
    Alert.alert('Retry Transcription', 'Re-upload and transcribe this recording?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retry', onPress: async () => {
        try {
          const upload = await ApiService.uploadAudio(r.uri!);
          const result = await ApiService.transcribe(upload.filename);
          await ApiService.deleteFile(upload.filename).catch(() => {});
          const updated = { ...r, transcript: result.transcript };
          await StorageService.save(updated);
          load();
          navigation.navigate('Transcript', { recording: updated });
        } catch (e: any) {
          Alert.alert('Error', e.message);
        }
      }},
    ]);
  };

  const filtered = recordings.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Library</Text>
        <Text style={s.hint}>Long press a recording to rename or delete</Text>
      </View>

      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={18} color={Colors.onSurfaceVariant} style={s.searchIcon} />
        <TextInput
          style={s.search}
          placeholder="Search recordings..."
          placeholderTextColor={Colors.onSurfaceVariant}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No recordings found.</Text>
          </View>
        ) : (
          filtered.map(r => (
            <TouchableOpacity
              key={r.id}
              style={s.card}
              onPress={() => r.transcript
                ? navigation.navigate('Transcript', { recording: r })
                : handleRetry(r)
              }
              onLongPress={() => handleLongPress(r)}
            >
              <View style={s.thumbnail}>
                <Ionicons name="mic" size={32} color="rgba(255,255,255,0.6)" />
                <View style={s.durationBadge}>
                  <Text style={s.durationText}>{formatDuration(r.duration)}</Text>
                </View>
              </View>
              <View style={s.cardInfo}>
                <View style={s.cardRow}>
                  <Text style={s.cardTitle} numberOfLines={1}>{r.title}</Text>
                  <Text style={s.cardDate}>{formatDate(r.date)}</Text>
                </View>
                {r.transcript ? (
                  <Text style={s.cardDesc} numberOfLines={2}>{r.transcript.slice(0, 120)}...</Text>
                ) : (
                  <View style={s.retryRow}>
                    <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                    <Text style={s.retryText}>Tap to retry transcription</Text>
                  </View>
                )}
                <View style={s.tags}>
                  {r.mom && <View style={s.tag}><Text style={s.tagText}>✦ AI Insights</Text></View>}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  title: { fontSize: 32, fontWeight: '700', color: Colors.onSurface },
  hint: { ...Typography.caption, color: Colors.onSurfaceVariant, marginTop: 2, marginBottom: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, marginVertical: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.outlineVariant, paddingHorizontal: Spacing.md },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, paddingVertical: 10, ...Typography.bodyMd, color: Colors.onSurface },
  content: { padding: Spacing.lg, paddingTop: Spacing.sm },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, marginBottom: Spacing.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.outlineVariant },
  thumbnail: { height: 100, backgroundColor: Colors.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  durationBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  durationText: { ...Typography.caption, color: '#fff' },
  cardInfo: { padding: Spacing.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { ...Typography.titleLg, color: Colors.onSurface, flex: 1, marginRight: 8 },
  cardDate: { ...Typography.caption, color: Colors.onSurfaceVariant },
  cardDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginBottom: Spacing.sm },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  retryText: { ...Typography.caption, color: Colors.error },
  tags: { flexDirection: 'row', gap: 8 },
  tag: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { ...Typography.caption, color: Colors.secondary },
});
