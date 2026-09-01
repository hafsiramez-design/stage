import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { getEventsByCategory } from '../database/db';

const { width, height } = Dimensions.get('window');

export default function CategoryEventsScreen({ category, currentUser, onSelectEvent, onBack, isDark = true }) {
  const bg = isDark ? '#040D21' : '#F0F4FF';
  const textPrimary = isDark ? '#F0F6FF' : '#0D1B2A';
  const textSecondary = isDark ? '#7B8FA6' : '#5A7494';
  const cardBg = isDark ? '#0F1E35' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(91,94,255,0.15)' : '#DDE8F0';
  const backBtnBg = isDark ? 'rgba(91,94,255,0.18)' : 'rgba(0,0,0,0.06)';
  const accent = '#5B5EFF';

  const [events, setEvents] = useState([]);
  const flatListRef = useRef(null);

  useEffect(() => {
    async function loadEvents() {
      const data = await getEventsByCategory(category);
      setEvents(data);
    }
    loadEvents();
  }, [category]);

  const renderEvent = ({ item }) => {
    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => onSelectEvent(item)}
        style={[styles.eventCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
      >
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.eventImage} />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: 'rgba(91,94,255,0.18)' }]}>
            <Text style={styles.placeholderEmoji}>🎟️</Text>
          </View>
        )}
        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { color: textPrimary }]} numberOfLines={2}>{item.title}</Text>
          <Text style={[styles.eventDate, { color: accent }]}>📅 {item.date}</Text>
          <Text style={[styles.eventLocation, { color: textSecondary }]} numberOfLines={1}>📍 {item.location}</Text>
          {item.description ? (
            <Text style={[styles.eventDescription, { color: textSecondary }]} numberOfLines={2}>{item.description}</Text>
          ) : null}
          <TouchableOpacity style={[styles.detailsBtn, { backgroundColor: accent }]} onPress={() => onSelectEvent(item)}>
            <Text style={styles.detailsBtnText}>🔍 Détails</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: backBtnBg, borderColor: 'rgba(91,94,255,0.3)', borderWidth: 1 }]} onPress={onBack}>
          <Text style={[styles.backBtnText, { color: textPrimary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>{category}</Text>
          <Text style={[styles.headerSubtitle, { color: accent }]}>{events.length} événement(s) disponible(s)</Text>
        </View>
      </View>

      {/* Events List */}
      <View style={[styles.listContainer, { backgroundColor: bg }]}>
        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎪</Text>
            <Text style={[styles.emptyText, { color: textSecondary }]}>Aucun événement dans cette catégorie.</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={renderEvent}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 15,
    zIndex: 10,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 14,
    minHeight: 120,
  },
  eventImage: {
    width: 110,
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: 110,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  eventInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  detailsBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  detailsBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  }
});
