import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { subscribeToEvent, getCommentsForEvent, addCommentForEvent, getReactionsForEvent, addReactionForEvent } from '../database/db';
import { SERVER_URL } from '../config/api';
import MapSection from '../components/MapSection';

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪' },
];

const { width } = Dimensions.get('window');

const REACTIONS = [
  { type: 'Like', icon: '👍', color: '#5B5EFF' },
  { type: 'Love', icon: '❤️', color: '#FF3D71' },
  { type: 'Haha', icon: '😂', color: '#FFD600' },
  { type: 'Wow', icon: '😮', color: '#FF9100' },
  { type: 'Sad', icon: '😢', color: '#00D4FF' },
  { type: 'Angry', icon: '😡', color: '#FF3D71' },
];

export default function EventDetailsScreen({ event, currentUser, onBack, isDark = true }) {
  // ── Theme ──────────────────────────────────────────────────────────────
  const bg         = isDark ? '#040D21' : '#F0F4FF';
  const surface    = isDark ? '#0A1628' : '#FFFFFF';
  const card       = isDark ? '#0F1E35' : '#FFFFFF';
  const accent     = '#5B5EFF';
  const cyan       = '#00D4FF';
  const success    = '#00E676';
  const textPrimary   = isDark ? '#F0F6FF' : '#0D1B2A';
  const textSecondary = isDark ? '#7B8FA6' : '#5A7494';
  const borderColor   = isDark ? 'rgba(91,94,255,0.15)' : '#DDE8F0';

  // ── State ──────────────────────────────────────────────────────────────
  const [demandStatus, setDemandStatus]   = useState(null); // null | 'pending' | 'accepted' | 'refused' | 'waitlist'
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [comments, setComments]           = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [reactions, setReactions]         = useState({ Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 });
  const [selectedLang, setSelectedLang]   = useState('fr');
  const [translatedTitle, setTranslatedTitle]           = useState(event?.title || '');
  const [translatedDescription, setTranslatedDescription] = useState(event?.description || '');
  const [isTranslating, setIsTranslating] = useState(false);
  const [userReacted, setUserReacted]     = useState(null);

  useEffect(() => {
    if (!event?.id) return;
    async function load() {
      try {
        const comms  = await getCommentsForEvent(event.id);
        const reacts = await getReactionsForEvent(event.id);
        setComments(comms || []);
        setReactions(reacts || { Like: 0, Love: 0, Haha: 0, Wow: 0, Sad: 0, Angry: 0 });

        if (currentUser?.id) {
          const status = await getUserSubscriptionStatus({ userId: currentUser.id, eventId: event.id });
          setDemandStatus(status);
        }
      } catch (e) {
        console.warn('Failed to load comments/reactions:', e);
      }
    }
    load();
  }, [event?.id, currentUser?.id]);

  // ── Translation ────────────────────────────────────────────────────────
  const translateText = async (text, targetLang) => {
    if (!text) return '';
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data && data[0]) return data[0].map(item => item[0]).join('');
      return text;
    } catch (err) { return text; }
  };

  const handleLanguageChange = async (langCode) => {
    if (langCode === selectedLang) return;
    setSelectedLang(langCode);
    if (langCode === 'fr') {
      setTranslatedTitle(event?.title || '');
      setTranslatedDescription(event?.description || '');
      return;
    }
    setIsTranslating(true);
    try {
      const [tTitle, tDesc] = await Promise.all([
        translateText(event?.title, langCode),
        translateText(event?.description, langCode),
      ]);
      setTranslatedTitle(tTitle);
      setTranslatedDescription(tDesc);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de traduire.');
    } finally {
      setIsTranslating(false);
    }
  };

  // ── Subscribe Demand ───────────────────────────────────────────────────
  const handleSubscribe = async () => {
    if (demandStatus || !currentUser) return;
    setIsSubscribing(true);
    try {
      await subscribeToEvent({
        userId: currentUser.id,
        eventId: event.id,
        username: currentUser.username,
        userEmail: currentUser.email,
        eventTitle: event.title,
      });
      try {
        await fetch(`${SERVER_URL}/api/send-subscription-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email, eventTitle: event.title, username: currentUser.username }),
        });
      } catch (_) {}
      setDemandStatus('pending');
      if (Platform.OS === 'web') {
        alert(`📩 Demande transmise : Votre demande pour "${event.title}" a été envoyée à l'administrateur. Un email de confirmation vous a été envoyé.`);
      } else {
        Alert.alert('📩 Demande transmise', `Votre demande d'inscription pour "${event.title}" a été transmise à l'administrateur. Vous recevrez un email pour chaque décision.`);
      }
    } catch (e) {
      Alert.alert('Erreur', "Impossible de transmettre la demande.");
    } finally {
      setIsSubscribing(false);
    }
  };

  // ── Reaction ───────────────────────────────────────────────────────────
  const handleAddReaction = async (type) => {
    try {
      const updated = await addReactionForEvent({ eventId: event.id, reactionType: type });
      setReactions({ ...updated });
      setUserReacted(type);
    } catch (e) { console.warn(e); }
  };

  // ── Comment ────────────────────────────────────────────────────────────
  const handleAddComment = async () => {
    if (!newCommentText.trim()) return;
    try {
      const comm = await addCommentForEvent({
        eventId: event.id,
        username: currentUser?.username || 'Anonyme',
        userPhoto: currentUser?.photo || null,
        text: newCommentText.trim(),
      });
      setComments(prev => [...prev, comm]);
      setNewCommentText('');
    } catch (e) { console.warn(e); }
  };

  if (!event) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: bg }]}>
        <View style={s.center}>
          <Text style={[s.emptyText, { color: textSecondary }]}>Événement introuvable.</Text>
          <TouchableOpacity style={[s.backPill, { backgroundColor: accent }]} onPress={onBack}>
            <Text style={s.backPillText}>← Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Sticky Header ── */}
      <View style={[s.header, { backgroundColor: isDark ? 'rgba(4,13,33,0.95)' : 'rgba(240,244,255,0.95)', borderBottomColor: borderColor }]}>
        <TouchableOpacity style={[s.backBtn, { backgroundColor: accent + '22', borderColor: accent + '55' }]} onPress={onBack}>
          <Text style={[s.backIcon, { color: accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: textPrimary }]} numberOfLines={1}>{translatedTitle}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* ── Banner ── */}
        {event.photo ? (
          <Image source={{ uri: event.photo }} style={s.banner} />
        ) : (
          <View style={[s.bannerPlaceholder, { backgroundColor: isDark ? '#0A1628' : '#E8EEFF' }]}>
            <Text style={s.bannerEmoji}>🎟️</Text>
            <Text style={[s.bannerPlaceholderText, { color: textSecondary }]}>Aucune photo</Text>
          </View>
        )}

        {/* ── Map ── */}
        <View style={[s.mapContainer, { borderColor }]}>
          <MapSection events={[event]} focusedEventIndex={0} />
        </View>

        <View style={s.body}>

          {/* ── Translation Pills ── */}
          <Text style={[s.sectionLabel, { color: textSecondary }]}>🌐 Traduire</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.langScroll}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  s.langPill,
                  { borderColor: selectedLang === lang.code ? accent : borderColor,
                    backgroundColor: selectedLang === lang.code ? accent : 'transparent' }
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                disabled={isTranslating}
              >
                <Text style={[s.langPillText, { color: selectedLang === lang.code ? '#fff' : textSecondary }]}>
                  {lang.flag} {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isTranslating ? (
            <View style={s.translatingRow}>
              <ActivityIndicator color={accent} size="small" />
              <Text style={[s.translatingText, { color: textSecondary }]}>Traduction en cours...</Text>
            </View>
          ) : (
            <>
              {/* ── Event Info Card ── */}
              <View style={[s.infoCard, { backgroundColor: card, borderColor }]}>
                <Text style={[s.eventTitle, { color: textPrimary }]}>{translatedTitle}</Text>
                
                <View style={s.metaRow}>
                  <View style={[s.metaBadge, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
                    <Text style={[s.metaBadgeText, { color: accent }]}>📅 {event.date}</Text>
                  </View>
                  {event.category && (
                    <View style={[s.metaBadge, { backgroundColor: cyan + '22', borderColor: cyan + '44' }]}>
                      <Text style={[s.metaBadgeText, { color: cyan }]}>🏷️ {event.category}</Text>
                    </View>
                  )}
                </View>

                {event.location && (
                  <View style={s.locationRow}>
                    <Text style={s.locationPin}>📍</Text>
                    <Text style={[s.locationText, { color: textSecondary }]} numberOfLines={2}>{event.location}</Text>
                  </View>
                )}

                {translatedDescription ? (
                  <Text style={[s.description, { color: textSecondary, borderTopColor: borderColor }]}>
                    {translatedDescription}
                  </Text>
                ) : null}
              </View>

              {/* ── Subscribe / Demand Status Button ── */}
              <TouchableOpacity
                style={[
                  s.subscribeBtn,
                  {
                    backgroundColor: 
                      demandStatus === 'accepted' ? success :
                      demandStatus === 'refused'  ? danger :
                      demandStatus === 'waitlist' ? '#F59E0B' :
                      demandStatus === 'pending'  ? '#64748B' : accent
                  },
                  isSubscribing && { opacity: 0.6 }
                ]}
                onPress={handleSubscribe}
                disabled={!!demandStatus || isSubscribing}
                activeOpacity={0.8}
              >
                {isSubscribing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.subscribeBtnText}>
                    {demandStatus === 'accepted' ? '🎉 Inscription Acceptée !' :
                     demandStatus === 'refused'  ? '❌ Demande Refusée' :
                     demandStatus === 'waitlist' ? "⏳ En Liste d'Attente" :
                     demandStatus === 'pending'  ? '⏳ Demande en cours d\'examen' :
                     "📩 Demander à s'inscrire"}
                  </Text>
                )}
              </TouchableOpacity>
              {demandStatus === 'pending' && (
                <Text style={[s.pendingNote, { color: '#F59E0B' }]}>
                  ⏳ Votre demande est en cours d'étude par l'administrateur. Vous recevrez un email dès sa décision.
                </Text>
              )}
              {demandStatus === 'accepted' && (
                <Text style={[s.pendingNote, { color: success }]}>
                  ✅ Votre demande a été ACCEPTÉE par l'admin ! Votre place est réservée.
                </Text>
              )}
              {demandStatus === 'waitlist' && (
                <Text style={[s.pendingNote, { color: '#F59E0B' }]}>
                  📋 Vous êtes actuellement placé sur la LISTE D'ATTENTE.
                </Text>
              )}
              {demandStatus === 'refused' && (
                <Text style={[s.pendingNote, { color: danger }]}>
                  ❌ Votre demande n'a pas été retenue par l'administrateur.
                </Text>
              )}
            </>
          )}

          {/* ── Reactions ── */}
          <View style={s.sectionHeader}>
            <Text style={[s.sectionLabel, { color: textSecondary }]}>💬 Réactions</Text>
            {totalReactions > 0 && (
              <Text style={[s.reactionTotal, { color: textSecondary }]}>{totalReactions} total</Text>
            )}
          </View>
          <View style={[s.reactionsCard, { backgroundColor: card, borderColor }]}>
            <View style={s.reactionsGrid}>
              {REACTIONS.map(r => (
                <TouchableOpacity
                  key={r.type}
                  style={[
                    s.reactionBtn,
                    { backgroundColor: userReacted === r.type ? r.color + '30' : isDark ? '#0F1E35' : '#F0F4FF',
                      borderColor: userReacted === r.type ? r.color + '80' : borderColor }
                  ]}
                  onPress={() => handleAddReaction(r.type)}
                  activeOpacity={0.7}
                >
                  <Text style={s.reactionEmoji}>{r.icon}</Text>
                  <Text style={[s.reactionCount, { color: userReacted === r.type ? r.color : textSecondary }]}>
                    {reactions[r.type] || 0}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Comments ── */}
          <Text style={[s.sectionLabel, { color: textSecondary, marginTop: 24 }]}>
            💬 Commentaires ({comments.length})
          </Text>

          {/* Comment Input */}
          <View style={[s.commentInputCard, { backgroundColor: card, borderColor }]}>
            <TextInput
              style={[s.commentInput, { color: textPrimary }]}
              placeholder="Écrire un commentaire..."
              placeholderTextColor={textSecondary}
              value={newCommentText}
              onChangeText={setNewCommentText}
              multiline
              maxLength={300}
            />
            <TouchableOpacity
              style={[s.sendBtn, { backgroundColor: newCommentText.trim() ? accent : borderColor }]}
              onPress={handleAddComment}
              disabled={!newCommentText.trim()}
              activeOpacity={0.8}
            >
              <Text style={s.sendBtnText}>Envoyer</Text>
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {comments.length === 0 ? (
            <View style={[s.emptyCommentsCard, { backgroundColor: card, borderColor }]}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
              <Text style={[s.emptyText, { color: textSecondary }]}>Aucun commentaire pour le moment.</Text>
              <Text style={[s.emptyText, { color: textSecondary, fontSize: 12 }]}>Soyez le premier à réagir !</Text>
            </View>
          ) : (
            comments.map(c => (
              <View key={c.id} style={[s.commentCard, { backgroundColor: card, borderColor }]}>
                <View style={s.commentAvatarWrap}>
                  {c.userPhoto ? (
                    <Image source={{ uri: c.userPhoto }} style={s.commentAvatar} />
                  ) : (
                    <View style={[s.commentAvatarPlaceholder, { backgroundColor: accent + '22' }]}>
                      <Text style={{ fontSize: 16 }}>👤</Text>
                    </View>
                  )}
                </View>
                <View style={s.commentBody}>
                  <Text style={[s.commentUsername, { color: accent }]}>{c.username}</Text>
                  <Text style={[s.commentText, { color: textPrimary }]}>{c.text}</Text>
                  {c.createdAt && (
                    <Text style={[s.commentDate, { color: textSecondary }]}>
                      {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { paddingBottom: 50 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { fontSize: 20, fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  backPill: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  backPillText: { color: '#fff', fontWeight: '700' },

  // Banner
  banner: { width: '100%', height: 230, resizeMode: 'cover' },
  bannerPlaceholder: {
    width: '100%', height: 160,
    justifyContent: 'center', alignItems: 'center',
  },
  bannerEmoji: { fontSize: 52 },
  bannerPlaceholderText: { marginTop: 8, fontSize: 13 },

  // Map
  mapContainer: { width: '100%', height: 200, borderTopWidth: 1, borderBottomWidth: 1 },

  // Body
  body: { padding: 16, gap: 12 },

  // Translation
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  langScroll: { marginBottom: 12 },
  langPill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    marginRight: 8,
  },
  langPillText: { fontSize: 13, fontWeight: '600' },
  translatingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
  translatingText: { fontSize: 14 },

  // Info Card
  infoCard: {
    borderRadius: 20, borderWidth: 1.5, padding: 20,
  },
  eventTitle: { fontSize: 22, fontWeight: '800', lineHeight: 28, marginBottom: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  metaBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  metaBadgeText: { fontSize: 13, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 12 },
  locationPin: { fontSize: 15, marginTop: 1 },
  locationText: { flex: 1, fontSize: 14, lineHeight: 20 },
  description: {
    fontSize: 15, lineHeight: 24, marginTop: 14, paddingTop: 14, borderTopWidth: 1,
  },

  // Subscribe
  subscribeBtn: {
    paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5B5EFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14,
    elevation: 8,
  },
  subscribeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pendingNote: { textAlign: 'center', fontSize: 13, fontWeight: '600', marginTop: -4 },

  // Reactions
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reactionTotal: { fontSize: 12, fontWeight: '600' },
  reactionsCard: { borderRadius: 20, borderWidth: 1.5, padding: 16 },
  reactionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reactionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 30, borderWidth: 1.5,
    minWidth: (width - 80) / 3,
    justifyContent: 'center',
  },
  reactionEmoji: { fontSize: 20 },
  reactionCount: { fontSize: 13, fontWeight: '700' },

  // Comments
  commentInputCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 14,
  },
  commentInput: {
    fontSize: 15, lineHeight: 22, minHeight: 60, maxHeight: 120,
    textAlignVertical: 'top',
  },
  sendBtn: {
    marginTop: 10, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyCommentsCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 30, alignItems: 'center',
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
  commentCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 14,
    flexDirection: 'row', gap: 12,
  },
  commentAvatarWrap: {},
  commentAvatar: { width: 40, height: 40, borderRadius: 20 },
  commentAvatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  commentBody: { flex: 1 },
  commentUsername: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  commentText: { fontSize: 14, lineHeight: 20 },
  commentDate: { fontSize: 11, marginTop: 6 },
});
