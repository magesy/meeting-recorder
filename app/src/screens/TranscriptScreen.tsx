import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../theme';
import ApiService from '../services/ApiService';
import { StorageService, Recording } from '../services/StorageService';

type Tab = 'transcript' | 'insights';

export default function TranscriptScreen({ route, navigation }: any) {
  const [recording, setRecording] = useState<Recording>(route.params.recording);
  const [tab, setTab] = useState<Tab>('transcript');
  const [loading, setLoading] = useState(false);

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

  const handleShare = async () => {
    const content = tab === 'transcript' ? recording.transcript : recording.mom;
    if (!content) return;
    await Share.share({ message: content });
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{recording.title}</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={s.shareText}>Share</Text>
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

      <ScrollView contentContainerStyle={s.content}>
        {tab === 'transcript' ? (
          <Text style={s.transcript}>{recording.transcript || 'No transcript available.'}</Text>
        ) : recording.mom ? (
          <View style={s.momCard}>
            <View style={s.momHeader}>
              <Text style={s.momIcon}>✦</Text>
              <Text style={s.momTitle}>AI Generated Minutes</Text>
            </View>
            <Text style={s.momText}>{recording.mom}</Text>
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
  backText: { fontSize: 22, color: Colors.onSurface },
  headerTitle: { flex: 1, ...Typography.titleLg, color: Colors.onSurface },
  shareText: { ...Typography.labelMd, color: Colors.secondary, padding: Spacing.sm },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.secondary },
  tabText: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  activeTabText: { color: Colors.secondary, fontWeight: '600' },
  content: { padding: Spacing.lg },
  transcript: { ...Typography.bodyMd, color: Colors.onSurface, lineHeight: 28 },
  momCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.outlineVariant },
  momHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  momIcon: { fontSize: 16, color: Colors.secondary, marginRight: 8 },
  momTitle: { ...Typography.titleLg, color: Colors.onSurface },
  momText: { ...Typography.bodyMd, color: Colors.onSurface, lineHeight: 26 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: Colors.onSurface, marginBottom: Spacing.md },
  emptyDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 24 },
  genBtn: { backgroundColor: Colors.secondary, borderRadius: Radius.md, paddingHorizontal: 32, paddingVertical: 14 },
  genBtnText: { ...Typography.titleLg, color: '#fff' },
});
