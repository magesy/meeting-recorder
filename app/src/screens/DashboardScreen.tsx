import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { StorageService, Recording } from '../services/StorageService';

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m} min`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return `Yesterday, ${time}`;
  return d.toLocaleDateString();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen({ navigation }: any) {
  const [recordings, setRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', async () => {
      const all = await StorageService.getAll();
      setRecordings(all.slice(0, 3));
    });
    return unsub;
  }, [navigation]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.date}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={s.greeting}>{getGreeting()}</Text>

        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Recent Recordings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Library')}>
            <Text style={s.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recordings.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No recordings yet. Tap Record to start.</Text>
          </View>
        ) : (
          recordings.map(r => (
            <TouchableOpacity
              key={r.id}
              style={s.card}
              onPress={() => navigation.navigate('Transcript', { recording: r })}
            >
              <View style={s.cardTop}>
                <View style={s.iconBox}><Text style={s.iconText}>🎙</Text></View>
                <View style={s.badge}><Text style={s.badgeText}>{formatDuration(r.duration)}</Text></View>
              </View>
              <Text style={s.cardTitle}>{r.title}</Text>
              {r.transcript && (
                <Text style={s.cardSummary} numberOfLines={2}>{r.transcript.slice(0, 100)}...</Text>
              )}
              <View style={s.divider} />
              <Text style={s.cardDate}>{formatDate(r.date)}</Text>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={s.cta} onPress={() => navigation.navigate('Record')}>
          <Text style={s.ctaText}>🎙  Start New Recording</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  date: { ...Typography.labelMd, color: Colors.onSurfaceVariant, marginBottom: 4 },
  greeting: { fontSize: 36, fontWeight: '700', color: Colors.onSurface, lineHeight: 44, marginBottom: Spacing.lg },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.titleLg, color: Colors.onSurface },
  viewAll: { ...Typography.labelMd, color: Colors.secondary },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.outlineVariant },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  iconBox: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 18 },
  badge: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { ...Typography.caption, color: Colors.onSurfaceVariant },
  cardTitle: { ...Typography.titleLg, color: Colors.onSurface, marginBottom: 6 },
  cardSummary: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginBottom: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.outlineVariant, marginBottom: Spacing.sm },
  cardDate: { ...Typography.caption, color: Colors.onSurfaceVariant },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: Spacing.md },
  emptyText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  cta: { backgroundColor: Colors.secondary, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  ctaText: { ...Typography.titleLg, color: '#fff' },
});
