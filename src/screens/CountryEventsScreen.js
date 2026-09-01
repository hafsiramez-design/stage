import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import {
  getEventsByCountryId,
  deleteEvent,
  updateEvent,
  subscribeToEvent,
  unsubscribeFromEvent,
  isUserSubscribed,
  getAllClientEmails
} from '../database/db';
import { sendEventChangeNotification } from '../services/emailService';

const { width } = Dimensions.get('window');

const CATEGORY_ICONS = {
  Music: '🎵',
  Festival: '🎉',
  Sports: '⚽',
  Culture: '🎭',
  Fashion: '👗',
  Art: '🎨',
  Nature: '🌸',
  National: '🏛️',
  Technology: '💻',
  Arts: '🎭',
  default: '📅',
};

const EventCard = ({
  event,
  index,
  accentColor,
  currentUser,
  isSubscribed,
  onToggleSubscribe,
  onEdit,
  onDelete
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 7,
      tension: 55,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const icon = CATEGORY_ICONS[event.category] || CATEGORY_ICONS.default;

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
      }}
    >
      <View style={styles.eventCard}>
        <View style={[styles.eventLeftBar, { backgroundColor: accentColor }]} />
        <View style={styles.eventContent}>
          {/* Event photo banner if available */}
          {event.photo && (
            <Image
              source={{ uri: event.photo }}
              style={styles.eventPhotoBanner}
              resizeMode="cover"
            />
          )}
          <View style={styles.eventHeader}>
            <Text style={styles.eventIcon}>{icon}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: `${accentColor}33` }]}>
              <Text style={[styles.categoryText, { color: accentColor }]}>{event.category}</Text>
            </View>
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDescription}>{event.description}</Text>
          <View style={styles.eventMeta}>
            <Text style={styles.metaText}>📍 {event.location}</Text>
            <Text style={styles.metaText}>📅 {event.date}</Text>
          </View>

          {/* Action Row depending on Role */}
          {currentUser && (
            <View style={styles.actionRow}>
              {currentUser.role === 'admin' ? (
                <View style={styles.adminActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => onEdit(event)}
                  >
                    <Text style={styles.adminActionText}>✏️ Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => onDelete(event.id)}
                  >
                    <Text style={styles.adminActionText}>🗑️ Supprimer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.subscribeBtn,
                    isSubscribed ? styles.subscribedBtnActive : styles.subscribeBtnInactive
                  ]}
                  onPress={() => onToggleSubscribe(event.id)}
                >
                  <Text
                    style={[
                      styles.subscribeBtnText,
                      isSubscribed ? styles.subscribedTextActive : styles.subscribeTextInactive
                    ]}
                  >
                    {isSubscribed ? '🔔 Inscrit ✓' : '➕ S\'abonner'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const FlagBackground = ({ countryId }) => {
  switch (countryId) {
    case 'fr': // France
      return (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: '#002395' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, backgroundColor: '#ED2939' }} />
          </View>
        </View>
      );
    case 'it': // Italy
      return (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: '#009246' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, backgroundColor: '#CE2B37' }} />
          </View>
        </View>
      );
    case 'mx': // Mexico
      return (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: '#006847' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 40 }}>🦅</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#CE1126' }} />
          </View>
        </View>
      );
    case 'de': // Germany
      return (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <View style={{ flex: 1, backgroundColor: '#000000' }} />
            <View style={{ flex: 1, backgroundColor: '#DD0000' }} />
            <View style={{ flex: 1, backgroundColor: '#FFCE00' }} />
          </View>
        </View>
      );
    case 'ca': // Canada
      return (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: '#FF0000' }} />
            <View style={{ flex: 2, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 70, color: '#FF0000' }}>🍁</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FF0000' }} />
          </View>
        </View>
      );
    case 'jp': // Japan
      return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: '#BC002D' }} />
        </View>
      );
    case 'br': // Brazil
      return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#009C3B', justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{
            width: 220,
            height: 220,
            backgroundColor: '#FEDF00',
            transform: [{ rotate: '45deg' }],
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              width: 110,
              height: 110,
              backgroundColor: '#002776',
              borderRadius: 55,
              transform: [{ rotate: '-45deg' }],
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}>
              <View style={{ width: '100%', height: 6, backgroundColor: '#FFFFFF', transform: [{ rotate: '-15deg' }] }} />
            </View>
          </View>
        </View>
      );
    case 'us': // USA
      return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]}>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            {[...Array(7)].map((_, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: i % 2 === 0 ? '#B22234' : '#FFFFFF' }} />
            ))}
          </View>
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '45%',
            height: '50%',
            backgroundColor: '#3C3B6E',
            padding: 8,
            flexWrap: 'wrap',
            flexDirection: 'row',
            alignContent: 'flex-start',
            gap: 4,
          }}>
            {[...Array(12)].map((_, i) => (
              <Text key={i} style={{ color: '#FFFFFF', fontSize: 10 }}>★</Text>
            ))}
          </View>
        </View>
      );
    case 'gb': // UK
      return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#012169', justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ position: 'absolute', width: '130%', height: 24, backgroundColor: '#FFFFFF', transform: [{ rotate: '30deg' }] }} />
          <View style={{ position: 'absolute', width: '130%', height: 24, backgroundColor: '#FFFFFF', transform: [{ rotate: '-30deg' }] }} />
          <View style={{ position: 'absolute', width: '130%', height: 10, backgroundColor: '#C8102E', transform: [{ rotate: '30deg' }] }} />
          <View style={{ position: 'absolute', width: '130%', height: 10, backgroundColor: '#C8102E', transform: [{ rotate: '-30deg' }] }} />
          <View style={{ position: 'absolute', width: '100%', height: 48, backgroundColor: '#FFFFFF' }} />
          <View style={{ position: 'absolute', width: 48, height: '100%', backgroundColor: '#FFFFFF' }} />
          <View style={{ position: 'absolute', width: '100%', height: 28, backgroundColor: '#C8102E' }} />
          <View style={{ position: 'absolute', width: 28, height: '100%', backgroundColor: '#C8102E' }} />
        </View>
      );
    case 'au': // Australia
      return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#00008B' }]}>
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '45%',
            height: '45%',
            backgroundColor: '#012169',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}>
            <View style={{ position: 'absolute', width: '130%', height: 12, backgroundColor: '#FFFFFF', transform: [{ rotate: '30deg' }] }} />
            <View style={{ position: 'absolute', width: '130%', height: 12, backgroundColor: '#FFFFFF', transform: [{ rotate: '-30deg' }] }} />
            <View style={{ position: 'absolute', width: '130%', height: 6, backgroundColor: '#C8102E', transform: [{ rotate: '30deg' }] }} />
            <View style={{ position: 'absolute', width: '130%', height: 6, backgroundColor: '#C8102E', transform: [{ rotate: '-30deg' }] }} />
            <View style={{ position: 'absolute', width: '100%', height: 24, backgroundColor: '#FFFFFF' }} />
            <View style={{ position: 'absolute', width: 24, height: '100%', backgroundColor: '#FFFFFF' }} />
            <View style={{ position: 'absolute', width: '100%', height: 14, backgroundColor: '#C8102E' }} />
            <View style={{ position: 'absolute', width: 14, height: '100%', backgroundColor: '#C8102E' }} />
          </View>
          <Text style={{ position: 'absolute', left: '15%', top: '60%', color: '#FFFFFF', fontSize: 32 }}>★</Text>
          <Text style={{ position: 'absolute', right: '20%', top: '20%', color: '#FFFFFF', fontSize: 16 }}>★</Text>
          <Text style={{ position: 'absolute', right: '10%', top: '35%', color: '#FFFFFF', fontSize: 16 }}>★</Text>
          <Text style={{ position: 'absolute', right: '25%', top: '45%', color: '#FFFFFF', fontSize: 16 }}>★</Text>
          <Text style={{ position: 'absolute', right: '15%', top: '65%', color: '#FFFFFF', fontSize: 16 }}>★</Text>
          <Text style={{ position: 'absolute', right: '20%', top: '48%', color: '#FFFFFF', fontSize: 10 }}>★</Text>
        </View>
      );
    case 'kr': // South Korea
      return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ position: 'absolute', left: '15%', top: '15%', color: '#000000', fontSize: 24, transform: [{ rotate: '45deg' }] }}>☰</Text>
          <Text style={{ position: 'absolute', right: '15%', top: '15%', color: '#000000', fontSize: 24, transform: [{ rotate: '-45deg' }] }}>☵</Text>
          <Text style={{ position: 'absolute', left: '15%', bottom: '15%', color: '#000000', fontSize: 24, transform: [{ rotate: '-45deg' }] }}>☲</Text>
          <Text style={{ position: 'absolute', right: '15%', bottom: '15%', color: '#000000', fontSize: 24, transform: [{ rotate: '45deg' }] }}>☷</Text>
          <View style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            overflow: 'hidden',
            flexDirection: 'column',
            transform: [{ rotate: '-30deg' }],
          }}>
            <View style={{ flex: 1, backgroundColor: '#CD2E3A' }} />
            <View style={{ flex: 1, backgroundColor: '#003478' }} />
          </View>
        </View>
      );
    case 'sa': // Saudi Arabia
      return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#006C35', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', marginBottom: 10 }}>🇸🇦</Text>
          <View style={{ width: 140, height: 4, backgroundColor: '#FFFFFF' }} />
        </View>
      );
    default:
      return null;
  }
};

export default function CountryEventsScreen({ country, currentUser, onBack, onSelectEvent, isDark = true }) {
  const accent = '#5B5EFF';
  const danger = '#FF3D71';
  const success = '#00E676';
  const [events, setEvents] = useState(country.events || []);
  const [userSubs, setUserSubs] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Modification / Edit Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCategory, setEditCategory] = useState('Festival');
  const [editDescription, setEditDescription] = useState('');

  const headerAnim = useRef(new Animated.Value(-40)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  const primaryColor = country.flagColors[0];

  const fetchEvents = async () => {
    const dbEvents = await getEventsByCountryId(country.id);
    if (dbEvents) {
      setEvents(dbEvents);
      // Fetch sub status
      if (currentUser && currentUser.role === 'client') {
        const subs = {};
        for (const ev of dbEvents) {
          subs[ev.id] = await isUserSubscribed({ userId: currentUser.id, eventId: ev.id });
        }
        setUserSubs(subs);
      }
    }
  };

  useEffect(() => {
    fetchEvents();

    Animated.parallel([
      Animated.spring(headerAnim, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(bgAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
    ]).start();
  }, [country.id]);

  // Client toggle subscribe
  const handleToggleSubscribe = async (eventId) => {
    if (!currentUser) return;
    try {
      const isSub = !!userSubs[eventId];
      if (isSub) {
        await unsubscribeFromEvent({ userId: currentUser.id, eventId });
        Alert.alert('Succès', 'Vous vous êtes désabonné de cet événement.');
      } else {
        await subscribeToEvent({ userId: currentUser.id, eventId });
        Alert.alert('Succès', 'Vous êtes maintenant inscrit à cet événement ! 🔔');
      }
      // Refresh local sub states
      setUserSubs(prev => ({
        ...prev,
        [eventId]: !isSub
      }));
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible de modifier votre inscription.');
    }
  };

  // Admin Delete Event
  const handleDeleteEvent = (eventId) => {
    const eventToDelete = events.find(e => e.id === eventId);
    Alert.alert(
      '⚠️ Confirmer la suppression',
      'Voulez-vous vraiment supprimer cet événement ? Les clients seront notifiés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(eventId);
              
              // Send notification
              if (eventToDelete) {
                try {
                  const emails = await getAllClientEmails();
                  if (emails.length > 0) {
                    await sendEventChangeNotification({
                      eventTitle: eventToDelete.title,
                      eventDate: eventToDelete.date,
                      eventLocation: eventToDelete.location,
                      changeType: 'deleted',
                      clientEmails: emails,
                    });
                  }
                } catch (e) {
                  console.warn('Could not send deletion email:', e);
                }
              }

              Alert.alert('Succès', 'Événement supprimé et clients notifiés !');
              fetchEvents(); // Reload
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de supprimer cet événement.');
            }
          }
        }
      ]
    );
  };

  // Admin open Edit Modal
  const openEditModal = (event) => {
    setSelectedEventId(event.id);
    setEditTitle(event.title);
    setEditDate(event.date);
    setEditLocation(event.location);
    setEditCategory(event.category);
    setEditDescription(event.description);
    setEditModalVisible(true);
  };

  // Admin save changes
  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editLocation.trim() || !editDate.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le titre, la date et le lieu.');
      return;
    }
    try {
      await updateEvent({
        id: selectedEventId,
        title: editTitle.trim(),
        date: editDate.trim(),
        location: editLocation.trim(),
        category: editCategory,
        description: editDescription.trim() || 'No description provided.'
      });

      // Notify clients
      try {
        const emails = await getAllClientEmails();
        if (emails.length > 0) {
          await sendEventChangeNotification({
            eventTitle: editTitle.trim(),
            eventDate: editDate.trim(),
            eventLocation: editLocation.trim(),
            changeType: 'modified',
            clientEmails: emails,
          });
        }
      } catch (e) {
        console.warn('Could not send modification email:', e);
      }

      Alert.alert('Succès', 'Modifications enregistrées et clients notifiés !');
      setEditModalVisible(false);
      fetchEvents(); // Reload
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer les modifications.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Actual country flag rendered as fullscreen background */}
      <FlagBackground countryId={country.id} />

      {/* Dark overlay for readability */}
      <View style={styles.darkOverlay} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { transform: [{ translateY: headerAnim }], opacity: headerOpacity },
        ]}
      >
        <TouchableOpacity style={[styles.backButton, { borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1 }]} onPress={onBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.countryFlag}>{country.flag}</Text>
          <View>
            <Text style={styles.countryName}>{country.name}</Text>
            <Text style={styles.eventsCount}>{events.length} événements à venir</Text>
          </View>
        </View>
      </Animated.View>

      {/* Color accent stripe */}
      <View style={styles.colorStripe}>
        {country.flagColors.filter(Boolean).map((color, i) => (
          <View key={i} style={[styles.stripeSegment, { backgroundColor: color }]} />
        ))}
      </View>

      {/* Search Bar (clients only) */}
      {currentUser && currentUser.role === 'client' && (
        <View style={styles.searchBarWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un événement..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ paddingHorizontal: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Events list */}
      <FlatList
        data={events.filter(ev =>
          searchQuery.trim() === '' ||
          ev.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🗓️</Text>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Aucun événement</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              Aucun événement disponible pour ce pays.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View>
            <EventCard
              event={item}
              index={index}
              accentColor={primaryColor}
              currentUser={currentUser}
              isSubscribed={!!userSubs[item.id]}
              onToggleSubscribe={handleToggleSubscribe}
              onEdit={openEditModal}
              onDelete={handleDeleteEvent}
            />
            {currentUser && currentUser.role === 'client' && onSelectEvent && (
              <TouchableOpacity
                style={{
                  marginHorizontal: 16,
                  marginTop: -4,
                  marginBottom: 12,
                  backgroundColor: 'rgba(91,94,255,0.18)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(91,94,255,0.5)',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
                onPress={() => onSelectEvent(item)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#8B8FFF', fontWeight: '700', fontSize: 14 }}>🔍 Voir les détails</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListFooterComponent={<View style={{ height: 40 }} />}
      />

      {/* Admin Edit Event Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>⚡ Admin: Modifier l'Événement</Text>

              <Text style={styles.label}>Titre de l'événement :</Text>
              <TextInput
                style={styles.modalInput}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <Text style={styles.label}>Date :</Text>
              <TextInput
                style={styles.modalInput}
                value={editDate}
                onChangeText={setEditDate}
              />

              <Text style={styles.label}>Lieu :</Text>
              <TextInput
                style={styles.modalInput}
                value={editLocation}
                onChangeText={setEditLocation}
              />

              <Text style={styles.label}>Catégorie :</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {['Festival', 'Music', 'Sports', 'Culture', 'Fashion', 'Art', 'Technology'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      editCategory === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setEditCategory(cat)}
                  >
                    <Text style={styles.chipText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Description :</Text>
              <TextInput
                style={[styles.modalInput, { height: 70 }]}
                multiline
                value={editDescription}
                onChangeText={setEditDescription}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#334455' }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.btnText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#6C3FFF' }]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.btnText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050A18',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5,10,24,0.82)',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  countryFlag: {
    fontSize: 52,
  },
  countryName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  eventsCount: {
    fontSize: 14,
    color: '#8AAABB',
    marginTop: 2,
  },
  colorStripe: {
    flexDirection: 'row',
    height: 4,
    marginHorizontal: 0,
    marginBottom: 20,
  },
  stripeSegment: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
  },
  eventCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  eventLeftBar: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  eventPhotoBanner: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 12,
    marginTop: -2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventIcon: {
    fontSize: 22,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 22,
  },
  eventDescription: {
    fontSize: 13,
    color: '#7A9ABF',
    lineHeight: 18,
    marginBottom: 12,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: '#AABBCC',
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
  },
  subscribeBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeBtnInactive: {
    backgroundColor: 'rgba(108,63,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(108,63,255,0.3)',
  },
  subscribedBtnActive: {
    backgroundColor: 'rgba(0,255,136,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.3)',
  },
  subscribeBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  subscribeTextInactive: {
    color: '#9E7BFF',
  },
  subscribedTextActive: {
    color: '#00FF88',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  deleteBtn: {
    backgroundColor: 'rgba(255,68,102,0.1)',
    borderColor: 'rgba(255,68,102,0.25)',
  },
  adminActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Modal layout
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#6C3FFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
});
