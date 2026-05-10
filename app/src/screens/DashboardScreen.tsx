import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
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
        {/* Header */}
        <Text style={s.date}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={s.greeting}>{getGreeting()}</Text>

        {/* Recent Recordings */}
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
                <View style={s.iconBox}>
                  <Ionicons name="people-outline" size={20} color={Colors.secondary} />
                </View>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{formatDuration(r.duration)}</Text>
                </View>
              </View>
              <Text style={s.cardTitle}>{r.title}</Text>
              {r.transcript && (
                <Text style={s.cardSummary} numberOfLines={2}>{r.transcript.slice(0, 100)}</Text>
              )}
              <View style={s.divider} />
              <Text style={s.cardDate}>{formatDate(r.date)}</Text>
            </TouchableOpacity>
          ))
        )}

        {/* FAB-style record button */}
        <TouchableOpacity style={s.cta} onPress={() => navigation.navigate('Record')}>
          <Ionicons name="mic" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={s.ctaText}>Start New Recording</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  date: { fontSize: 14, fontWeight: '400', color: Colors.onSurfaceVariant, marginBottom: 4 },
  greeting: { fontSize: 40, fontWeight: '800', color: Colors.onSurface, lineHeight: 48, marginBottom: Spacing.lg },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.onSurface },
  viewAll: { fontSize: 14, fontWeight: '500', color: Colors.secondary },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.outlineVariant },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  iconBox: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  badge: { backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, justifyContent: 'center' },
  badgeText: { fontSize: 12, color: Colors.onSurfaceVariant, fontWeight: '500' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.onSurface, marginBottom: 6 },
  cardSummary: { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20, marginBottom: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.outlineVariant, marginBottom: Spacing.sm },
  cardDate: { fontSize: 12, color: Colors.onSurfaceVariant },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: Spacing.md },
  emptyText: { fontSize: 15, color: Colors.onSurfaceVariant },
  cta: { backgroundColor: Colors.secondary, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  ctaText: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
