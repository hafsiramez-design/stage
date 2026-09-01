import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

/**
 * MapSection for Android native APK build.
 * Uses a simple "Open in Google Maps" button instead of react-native-maps
 * to avoid CMake/native library build issues with react-native-maps.
 * Full MapView works in Expo Go / dev build.
 */
export default function MapSection({ events, onMarkerPress, focusedEventIndex }) {
  const validEvents = (events || []).filter(e =>
    e.latitude != null && e.longitude != null &&
    Number.isFinite(parseFloat(e.latitude)) &&
    Number.isFinite(parseFloat(e.longitude))
  );

  if (validEvents.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.text}>Aucune coordonnée disponible</Text>
      </View>
    );
  }

  const focusedEvent = focusedEventIndex != null ? validEvents[focusedEventIndex] : validEvents[0];
  const event = focusedEvent || validEvents[0];
  const lat = parseFloat(event.latitude);
  const lng = parseFloat(event.longitude);

  const openMaps = () => {
    const url = `https://maps.google.com/maps?q=${lat},${lng}&z=14`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      {/* Visual map card */}
      <View style={styles.mapCard}>
        <View style={styles.mapIconRow}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <View style={styles.mapInfo}>
            <Text style={styles.mapTitle} numberOfLines={1}>{event.title}</Text>
            <Text style={styles.mapCoords}>📍 {lat.toFixed(4)}, {lng.toFixed(4)}</Text>
          </View>
        </View>

        {/* Event list if multiple */}
        {validEvents.length > 1 && (
          <View style={styles.eventList}>
            {validEvents.slice(0, 4).map((e, i) => (
              <TouchableOpacity
                key={e.id || i}
                style={[
                  styles.eventChip,
                  (focusedEventIndex === i) && styles.eventChipActive,
                ]}
                onPress={() => onMarkerPress && onMarkerPress(i)}
              >
                <Text style={[styles.eventChipText, (focusedEventIndex === i) && { color: '#fff' }]}
                  numberOfLines={1}>
                  📍 {e.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.openBtn} onPress={openMaps} activeOpacity={0.85}>
          <Text style={styles.openBtnText}>🗺️ Ouvrir dans Google Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    borderStyle: 'dashed',
  },
  icon: { fontSize: 32, marginBottom: 8 },
  text: { color: '#A78BFA', fontSize: 14 },

  mapCard: {
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.25)',
    padding: 20,
    gap: 14,
  },
  mapIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  mapIcon: {
    fontSize: 40,
  },
  mapInfo: {
    flex: 1,
  },
  mapTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  mapCoords: {
    color: '#A78BFA',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  eventList: {
    gap: 8,
  },
  eventChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
  },
  eventChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  eventChipText: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '600',
  },
  openBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  openBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
