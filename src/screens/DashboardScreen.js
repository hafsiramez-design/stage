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
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import MiniFlagView from '../components/MiniFlagView';
import AdminListModal from '../components/AdminListModal';
import ChatModal from '../components/ChatModal';
import {
  getAllCountriesWithEvents,
  addEvent,
  getAllClientEmails,
  getAdminUser,
  getUnreadMessageCounts,
} from '../database/db';
import { sendNewEventNotification } from '../services/emailService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const FLAG_HEIGHT = 100;

const CATEGORIES = ['Festival', 'Music', 'Sports', 'Culture', 'Fashion', 'Art', 'Technology'];

const CATEGORY_EMOJI = {
  Festival: '🎪',
  Music: '🎵',
  Sports: '⚽',
  Culture: '🎨',
  Fashion: '👗',
  Art: '🖼️',
  Technology: '💻',
};

// ─── CountryCard ────────────────────────────────────────────────────────────
const CountryCard = ({ country, index, onPress, isDark }) => {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 7,
      tension: 60,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn  = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  const cardBg     = isDark ? '#0F1E35' : '#FFFFFF';
  const nameColor  = isDark ? '#F0F6FF' : '#0D1B2A';
  const accentFlag = country.flagColors[0] || '#5B5EFF';
  const borderCol  = `${accentFlag}40`;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [{ translateY }, { scale }],
          backgroundColor: cardBg,
          borderColor: borderCol,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <MiniFlagView
          flagEmoji={country.flag}
          colors={country.flagColors}
          height={FLAG_HEIGHT}
        />
        <View style={[styles.flagAccentBar, { backgroundColor: accentFlag }]} />
        <View style={styles.cardInfo}>
          <Text style={[styles.countryName, { color: nameColor }]} numberOfLines={1}>
            {country.name}
          </Text>
          <View style={[styles.eventsBadge, { backgroundColor: `${accentFlag}22` }]}>
            <Text style={[styles.eventsBadgeText, { color: accentFlag }]}>
              {country.events ? country.events.length : 0} events
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── CategoryCard ────────────────────────────────────────────────────────────
const CategoryCard = ({ item, onPress, isDark }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const anim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  const cardBg    = isDark ? '#150D32' : '#FFFFFF';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <Animated.View
      style={{
        width: CARD_WIDTH,
        opacity: anim,
        transform: [{ translateY }, { scale }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
        }
        onPress={onPress}
        style={[
          styles.categoryCard,
          {
            backgroundColor: cardBg,
            borderColor: isDark ? 'rgba(139,92,246,0.3)' : '#E0E7FF',
          },
        ]}
      >
        <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI[item] || '🌐'}</Text>
        <Text style={[styles.categoryLabel, { color: textColor }]}>{item}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── DashboardScreen ─────────────────────────────────────────────────────────
export default function DashboardScreen({
  onSelectCountry,
  onSelectCategory,
  currentUser,
  onLogout,
  isDark = true,
}) {
  // ── theme tokens ──────────────────────────────────────────────────────────
  const bg          = isDark ? '#0B071E'                  : '#F5F3FF';
  const card        = isDark ? '#150D32'                  : '#FFFFFF';
  const cardBorder  = isDark ? 'rgba(139,92,246,0.2)'     : '#E0E7FF';
  const textPrimary = isDark ? '#F8FAFC'                  : '#0F172A';
  const textSecondary = isDark ? '#A78BFA'                : '#475569';
  const modalBg     = isDark ? '#150D32'                  : '#FFFFFF';
  const modalOverlay = isDark ? 'rgba(0,0,0,0.85)'        : 'rgba(0,0,0,0.5)';
  const inputBg     = isDark ? 'rgba(255,255,255,0.05)'   : '#F5F3FF';
  const inputBorder = isDark ? 'rgba(139,92,246,0.25)'    : '#E0E7FF';

  // ── state ─────────────────────────────────────────────────────────────────
  const [countries,          setCountries]          = useState([]);
  const [modalVisible,       setModalVisible]       = useState(false);
  const [selectedCountryId,  setSelectedCountryId]  = useState('');
  const [title,              setTitle]              = useState('');
  const [date,               setDate]               = useState('');
  const [location,           setLocation]           = useState('');
  const [category,           setCategory]           = useState(CATEGORIES[0]);
  const [latitude,           setLatitude]           = useState('');
  const [longitude,          setLongitude]          = useState('');
  const [description,        setDescription]        = useState('');
  const [eventPhoto,         setEventPhoto]         = useState(null);
  const [eventPhotoBase64,   setEventPhotoBase64]   = useState(null);
  const [isSendingNotif,     setIsSendingNotif]     = useState(false);

  const [isChatVisible,      setIsChatVisible]      = useState(false);
  const [isAdminListVisible, setIsAdminListVisible] = useState(false);
  const [selectedAdmin,      setSelectedAdmin]      = useState(null);
  const [adminUser,          setAdminUser]          = useState(null);
  const [unreadTotal,        setUnreadTotal]        = useState(0);

  const fetchUnread = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await getUnreadMessageCounts(currentUser.id);
      setUnreadTotal(res.total || 0);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 2500);
    return () => clearInterval(interval);
  }, [currentUser]);

  const headerAnim    = useRef(new Animated.Value(-30)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // ── data loading ──────────────────────────────────────────────────────────
  const loadData = async () => {
    const data = await getAllCountriesWithEvents();
    setCountries(data);
    if (data.length > 0 && !selectedCountryId) {
      setSelectedCountryId(data[0].id);
    }
  };

  const loadAdmin = async () => {
    const admin = await getAdminUser();
    setAdminUser(admin);
  };

  // ── image picker ──────────────────────────────────────────────────────────
  const pickEventPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Veuillez autoriser l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      setEventPhoto(result.assets[0].uri);
      // No base64 needed — use file URI directly (safe, no memory overhead)
    }
  };

  // ── lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
    loadAdmin();
    Animated.parallel([
      Animated.spring(headerAnim, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── handleAddEvent ────────────────────────────────────────────────────────
  const handleAddEvent = async () => {
    if (!title.trim() || !location.trim() || !date.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le titre, la date et le lieu.');
      return;
    }

    const savedTitle       = title.trim();
    const savedDate        = date.trim();
    const savedLocation    = location.trim();
    const savedCategory    = category;
    const savedDescription = description.trim() || 'No description provided.';
    // Use local file URI instead of base64 — base64 causes Android OOM crashes
    const savedPhotoUri    = eventPhoto;
    const latVal           = latitude  ? parseFloat(latitude)  : null;
    const lngVal           = longitude ? parseFloat(longitude) : null;

    try {
      await addEvent({
        countryId:   selectedCountryId,
        title:       savedTitle,
        date:        savedDate,
        location:    savedLocation,
        latitude:    latVal,
        longitude:   lngVal,
        category:    savedCategory,
        description: savedDescription,
        photo:       savedPhotoUri,
      });

      // Instant UI Feedback
      setTitle('');
      setDate('');
      setLocation('');
      setDescription('');
      setEventPhoto(null);
      setEventPhotoBase64(null);
      setModalVisible(false);
      loadData();

      Alert.alert('✅ Succès', 'Événement ajouté avec succès !');

      // Send email notifications — await to ensure completion
      try {
        const emails = await getAllClientEmails();
        console.log('[Dashboard] Client emails for notification:', emails);
        if (emails && emails.length > 0) {
          const result = await sendNewEventNotification({
            eventTitle: savedTitle,
            eventCategory: savedCategory,
            eventDate: savedDate,
            eventLocation: savedLocation,
            eventDescription: savedDescription,
            clientEmails: emails,
          });
          console.log('[Dashboard] Email notification result:', result);
        }
      } catch (emailErr) {
        console.warn('[Dashboard] Email notification failed:', emailErr);
      }

    } catch (e) {
      if (e.message === 'DATE_EXISTS') {
        Alert.alert('Date occupée', 'Un événement existe déjà à cette date. Choisissez une autre date.');
      } else {
        Alert.alert('Erreur', 'Impossible d\'ajouter cet événement.');
      }
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />

      {/* ── Header ── */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ translateY: headerAnim }],
            opacity: headerOpacity,
            borderBottomColor: cardBorder,
          },
        ]}
      >
        {/* Globe + titles */}
        <View style={styles.headerLeft}>
          <View style={styles.globeCircle}>
            <Text style={styles.headerEmoji}>🌍</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>World Events</Text>
            {currentUser && (
              <Text style={[styles.headerSubtitle, { color: '#5B5EFF' }]}>
                Bonjour, {currentUser.username} 👋
              </Text>
            )}
          </View>
        </View>

        {/* Right-side buttons */}
        <View style={styles.headerRight}>
          {currentUser && currentUser.role === 'admin' && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.adminButtonText}>＋ Add Event</Text>
            </TouchableOpacity>
          )}

          {/* Clients can contact admins, but admins cannot contact other admins */}
          {currentUser && currentUser.role !== 'admin' && (
            <TouchableOpacity
              style={[
                styles.adminsTabBtn,
                { borderColor: unreadTotal > 0 ? '#FF3D71' : '#5B5EFF', position: 'relative' },
              ]}
              onPress={() => setIsAdminListVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.adminsTabText, { color: unreadTotal > 0 ? '#FF3D71' : '#5B5EFF', fontWeight: '800' }]}>
                💬 Admins
              </Text>

              {unreadTotal > 0 && (
                <View style={styles.unreadBadgeHeader}>
                  <Text style={styles.unreadBadgeHeaderText}>{unreadTotal > 99 ? '99+' : unreadTotal}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {currentUser && onLogout && (
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
              <Text style={styles.logoutText}>🚪</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* ── Grid ── */}
      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CategoryCard
            item={item}
            isDark={isDark}
            onPress={() => onSelectCategory(item)}
          />
        )}
      />

      {/* ── Add-Event Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalContainer, { backgroundColor: modalOverlay }]}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: modalBg,
                borderColor: 'rgba(91,94,255,0.33)',
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {/* Modal heading */}
              <View style={styles.modalHeader}>
                <View style={styles.modalAccentBar} />
                <Text style={[styles.modalTitle, { color: textPrimary }]}>
                  ⚡ Add Event to SQLite
                </Text>
              </View>

              {/* Select Country */}
              <Text style={[styles.label, { color: textSecondary }]}>Select Country:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                {countries.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selectedCountryId === c.id ? '#5B5EFF' : inputBg,
                        borderColor:
                          selectedCountryId === c.id ? '#5B5EFF' : inputBorder,
                      },
                    ]}
                    onPress={() => setSelectedCountryId(c.id)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selectedCountryId === c.id ? '#FFFFFF' : textPrimary },
                      ]}
                    >
                      {c.flag} {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Title */}
              <Text style={[styles.label, { color: textSecondary }]}>Event Title:</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: inputBg, borderColor: 'rgba(91,94,255,0.30)', color: textPrimary },
                ]}
                placeholder="e.g. Tomorrowland 2026"
                placeholderTextColor={textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              {/* Date */}
              <Text style={[styles.label, { color: textSecondary }]}>Date / Time:</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: inputBg, borderColor: 'rgba(91,94,255,0.30)', color: textPrimary },
                ]}
                placeholder="e.g. July 18-20, 2026"
                placeholderTextColor={textSecondary}
                value={date}
                onChangeText={setDate}
              />

              {/* Location */}
              <Text style={[styles.label, { color: textSecondary }]}>Location / Venue:</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: inputBg, borderColor: 'rgba(91,94,255,0.30)', color: textPrimary },
                ]}
                placeholder="e.g. Boom, Belgium"
                placeholderTextColor={textSecondary}
                value={location}
                onChangeText={setLocation}
              />

              {/* Latitude */}
              <Text style={[styles.label, { color: textSecondary }]}>Latitude (optional):</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: inputBg, borderColor: 'rgba(91,94,255,0.30)', color: textPrimary },
                ]}
                placeholder="e.g. 51.0914"
                placeholderTextColor={textSecondary}
                keyboardType="numeric"
                value={latitude}
                onChangeText={setLatitude}
              />

              {/* Longitude */}
              <Text style={[styles.label, { color: textSecondary }]}>Longitude (optional):</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: inputBg, borderColor: 'rgba(91,94,255,0.30)', color: textPrimary },
                ]}
                placeholder="e.g. 4.3820"
                placeholderTextColor={textSecondary}
                keyboardType="numeric"
                value={longitude}
                onChangeText={setLongitude}
              />

              {/* Category chips */}
              <Text style={[styles.label, { color: textSecondary }]}>Category:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: category === cat ? '#5B5EFF' : inputBg,
                        borderColor:     category === cat ? '#5B5EFF' : inputBorder,
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: category === cat ? '#FFFFFF' : textPrimary },
                      ]}
                    >
                      {CATEGORY_EMOJI[cat]} {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Description */}
              <Text style={[styles.label, { color: textSecondary }]}>Description:</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    height: 88,
                    backgroundColor: inputBg,
                    borderColor: 'rgba(91,94,255,0.30)',
                    color: textPrimary,
                    textAlignVertical: 'top',
                  },
                ]}
                placeholder="Short event description..."
                placeholderTextColor={textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              {/* Photo picker */}
              <Text style={[styles.label, { color: isDark ? '#94A3B8' : '#64748B' }]}>Photo (Optionnelle)</Text>
              <TouchableOpacity
                style={[
                  styles.photoPickerBtn,
                  { backgroundColor: inputBg, borderColor: 'rgba(91,94,255,0.50)' },
                ]}
                onPress={pickEventPhoto}
                activeOpacity={0.8}
              >
                {eventPhoto ? (
                  <Image source={{ uri: eventPhoto }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoIcon}>📸</Text>
                    <Text style={[styles.photoPickerText, { color: '#5B5EFF' }]}>
                      Choose Photo from Gallery
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor: 'transparent',
                      borderWidth: 1.5,
                      borderColor: isDark ? '#1E293B' : '#DDE8F0',
                    },
                  ]}
                  onPress={() => setModalVisible(false)}
                  disabled={isSendingNotif}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.btnText, { color: textSecondary }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor: '#5B5EFF',
                      opacity: isSendingNotif ? 0.6 : 1,
                      shadowColor: '#5B5EFF',
                      shadowOpacity: 0.45,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 6,
                    },
                  ]}
                  onPress={handleAddEvent}
                  disabled={isSendingNotif}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.btnText, { color: '#FFFFFF' }]}>
                    {isSendingNotif ? 'Envoi…' : 'Save to SQLite'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Admin List Modal ── */}
      <AdminListModal
        visible={isAdminListVisible}
        onClose={() => setIsAdminListVisible(false)}
        onSelectAdmin={(admin) => {
          setSelectedAdmin(admin);
          setIsAdminListVisible(false);
          setIsChatVisible(true);
        }}
      />

      {/* ── Chat Modal ── */}
      <ChatModal
        visible={isChatVisible}
        onClose={() => {
          setIsChatVisible(false);
          setSelectedAdmin(null);
        }}
        currentUser={currentUser}
        chatPartner={selectedAdmin}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  globeCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(91,94,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 26,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminButton: {
    backgroundColor: '#5B5EFF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    shadowColor: '#5B5EFF',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  adminsTabBtn: {
    backgroundColor: 'rgba(91,94,255,0.12)',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  unreadBadgeHeader: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3D71',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#040D21',
    zIndex: 10,
  },
  unreadBadgeHeaderText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  adminsTabText: {
    fontWeight: '700',
    fontSize: 13,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,61,113,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,61,113,0.35)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 17,
  },

  // ── Grid ──
  grid: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  // ── Country Card ──
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  flagAccentBar: {
    height: 3,
    width: '100%',
  },
  cardInfo: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  countryName: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  eventsBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eventsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Category Card ──
  categoryCard: {
    height: 120,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  categoryEmoji: {
    fontSize: 38,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Modal ──
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    maxHeight: '90%',
    borderWidth: 1.5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  modalAccentBar: {
    width: 4,
    height: 26,
    borderRadius: 4,
    backgroundColor: '#5B5EFF',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  modalInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    borderWidth: 1.5,
    marginBottom: 4,
  },

  // ── Chips ──
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Photo picker ──
  photoPickerBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 10,
    overflow: 'hidden',
    minHeight: 90,
    justifyContent: 'center',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  photoIcon: {
    fontSize: 28,
  },
  photoPickerText: {
    fontWeight: '700',
    fontSize: 13,
  },
  photoPreview: {
    width: '100%',
    height: 130,
  },

  // ── Modal actions ──
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 22,
  },
  modalBtn: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
  },
  btnText: {
    fontWeight: '800',
    fontSize: 14,
  },
});
