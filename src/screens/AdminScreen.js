import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { getAllUsers, closeUserAccount, activateUserAccount, getAllSubscriptions, updateSubscriptionStatus, getUnreadMessageCounts } from '../database/db';
import AdminEventsView from './AdminEventsView';
import ChatModal from '../components/ChatModal';
import { SERVER_URL } from '../config/api';

const { width } = Dimensions.get('window');

export default function AdminScreen({ currentUser, onSelectCountry, onLogout, isDark = true }) {
  // ── Color tokens ──────────────────────────────────────────────────────────
  const bg            = isDark ? '#0B071E' : '#F5F3FF';
  const surface       = isDark ? '#150D32' : '#FFFFFF';
  const card          = isDark ? '#180F38' : '#FFFFFF';
  const cardBorder    = isDark ? 'rgba(139,92,246,0.2)' : '#E0E7FF';
  const textPrimary   = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#A78BFA' : '#475569';
  const accent        = '#8B5CF6';
  const danger        = '#FF3D71';
  const success       = '#00E676';
  const warning       = '#F59E0B';

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]       = useState('events'); // 'events' | 'demands' | 'clients'
  const [users, setUsers]               = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [detailsClient, setDetailsClient] = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [chatPartner, setChatPartner]   = useState(null);
  const [chatVisible, setChatVisible]   = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  const fetchUnread = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await getUnreadMessageCounts(currentUser.id);
      setUnreadCounts(res.counts || {});
    } catch (e) {}
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 2500);
    return () => clearInterval(interval);
  }, [currentUser]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      // Only show clients to the admin
      const clientsOnly = (data || []).filter(u => u.role === 'client');
      setUsers(clientsOnly);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const subs = await getAllSubscriptions();
      setSubscriptions(subs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'clients') {
      fetchUsers();
    } else if (activeTab === 'demands') {
      fetchSubscriptions();
    }
  }, [activeTab]);

  const handleDecision = async (sub, newStatus) => {
    try {
      await updateSubscriptionStatus(sub.id, newStatus);
      try {
        await fetch(`${SERVER_URL}/api/send-demand-status-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: sub.userEmail,
            username: sub.username,
            eventTitle: sub.eventTitle,
            status: newStatus,
          }),
        });
      } catch (e) {
        console.warn('Could not send decision email:', e);
      }
      await fetchSubscriptions();
      const statusLabels = { accepted: 'ACCEPTÉE', refused: 'REFUSÉE', waitlist: 'placée en LISTE D\'ATTENTE' };
      const msg = `✅ Demande ${statusLabels[newStatus]} pour ${sub.username}. Email de notification envoyé !`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('✅ Décision enregistrée', msg);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de mettre à jour la demande.');
    }
  };

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (e) {
      return isoString;
    }
  };

  // ── Cross-Platform Handlers ───────────────────────────────────────────────
  const handleCloseAccount = async (user) => {
    let confirmed = true;
    if (Platform.OS === 'web') {
      confirmed = window.confirm(`Êtes-vous sûr de vouloir clôturer le compte de ${user.username} ?\nLe client ne pourra plus se connecter et recevra un email de notification.`);
    }
    if (!confirmed) return;

    try {
      await closeUserAccount(user.id);
      try {
        await fetch(`${SERVER_URL}/api/send-account-blocked-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, username: user.username }),
        });
      } catch (e) {
        console.warn('Could not send blocked email:', e);
      }
      await fetchUsers();
      if (Platform.OS === 'web') {
        alert(`✅ Compte clôturé : Le compte de ${user.username} a été clôturé et un email a été envoyé.`);
      } else {
        Alert.alert('✅ Compte clôturé', `Le compte de ${user.username} a été clôturé et un email a été envoyé.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivateAccount = async (user) => {
    let confirmed = true;
    if (Platform.OS === 'web') {
      confirmed = window.confirm(`Voulez-vous réactiver le compte de ${user.username} ?\nLe client pourra à nouveau se connecter et recevra un email de notification.`);
    }
    if (!confirmed) return;

    try {
      await activateUserAccount(user.id);
      try {
        await fetch(`${SERVER_URL}/api/send-account-activated-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, username: user.username }),
        });
      } catch (e) {
        console.warn('Could not send activation email:', e);
      }
      await fetchUsers();
      if (Platform.OS === 'web') {
        alert(`✅ Compte activé : Le compte de ${user.username} a été réactivé et un email a été envoyé.`);
      } else {
        Alert.alert('✅ Compte activé', `Le compte de ${user.username} a été réactivé et un email a été envoyé.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Render client card ────────────────────────────────────────────────────
  const renderClientCard = ({ item }) => {
    const unreadCount = unreadCounts[item.id] || 0;

    return (
      <View
        style={[
          styles.clientCard,
          {
            backgroundColor: item.status === 'closed'
              ? (isDark ? 'rgba(255,61,113,0.06)' : 'rgba(255,61,113,0.04)')
              : card,
            borderColor: unreadCount > 0 ? '#FF3D71' : (item.status === 'closed' ? 'rgba(255,61,113,0.35)' : cardBorder),
          },
        ]}
      >
        <View style={styles.clientCardHeader}>
          <View style={{ position: 'relative' }}>
            {item.photo ? (
              <Image
                source={{ uri: item.photo }}
                style={[styles.clientAvatar, { borderColor: unreadCount > 0 ? '#FF3D71' : accent }]}
              />
            ) : (
              <View
                style={[
                  styles.clientAvatarPlaceholder,
                  { borderColor: unreadCount > 0 ? '#FF3D71' : accent, backgroundColor: `${accent}22` },
                ]}
              >
                <Text style={{ fontSize: 22 }}>👤</Text>
              </View>
            )}

            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.clientName, { color: textPrimary }]}>{item.username}</Text>
              {unreadCount > 0 && (
                <View style={styles.newMsgPill}>
                  <Text style={styles.newMsgPillText}>{unreadCount} message{unreadCount > 1 ? 's' : ''}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.clientEmail, { color: textSecondary }]} numberOfLines={1}>
              {item.email}
            </Text>
            {item.status === 'closed' && (
              <View style={styles.closedBadge}>
                <Text style={styles.closedBadgeText}>🔒 Compte clôturé</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.clientActions}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: `${accent}22`,
                borderColor: `${accent}66`,
              },
            ]}
            onPress={() => setDetailsClient(item)}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: '#C4B5FD' }]}>Voir plus</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: unreadCount > 0 ? '#FF3D71' : 'rgba(6,182,212,0.15)',
                borderColor: unreadCount > 0 ? '#FF3D71' : 'rgba(6,182,212,0.4)',
                position: 'relative',
              },
            ]}
            onPress={() => {
              setChatPartner(item);
              setChatVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: unreadCount > 0 ? '#FFFFFF' : '#06B6D4' }]}>
              {unreadCount > 0 ? `💬 Discuter (${unreadCount})` : 'Discuter 💬'}
            </Text>
          </TouchableOpacity>

        {item.status !== 'closed' ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: 'rgba(255,61,113,0.15)',
                borderColor: 'rgba(255,61,113,0.4)',
              },
            ]}
            onPress={() => handleCloseAccount(item)}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: '#FF7A90' }]}>Fermer le compte</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: 'rgba(0,230,118,0.15)',
                borderColor: 'rgba(0,230,118,0.4)',
              },
            ]}
            onPress={() => handleActivateAccount(item)}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: '#00E676' }]}>Activer le compte</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />

      {/* Ambient background blobs */}
      {isDark && (
        <>
          <View style={[styles.blob, styles.blob1]} />
          <View style={[styles.blob, styles.blob2]} />
        </>
      )}

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: cardBorder }]}>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Panneau Administrateur</Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Connecté : {currentUser?.username || 'Admin'}
          </Text>
        </View>

        {onLogout && (
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
            <Text style={styles.logoutBtnText}>Déconnexion 🚪</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pill Tabs Selector */}
      <View style={[styles.tabsRow, { backgroundColor: surface, borderColor: cardBorder }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'events' && [styles.tabBtnActive, { backgroundColor: accent }]]}
          onPress={() => setActiveTab('events')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabBtnText, activeTab === 'events' ? styles.tabBtnTextActive : { color: textSecondary }]}>
            📅 Événements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'demands' && [styles.tabBtnActive, { backgroundColor: accent }]]}
          onPress={() => setActiveTab('demands')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabBtnText, activeTab === 'demands' ? styles.tabBtnTextActive : { color: textSecondary }]}>
            📥 Demandes ({subscriptions.filter(s => s.status === 'pending').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'clients' && [styles.tabBtnActive, { backgroundColor: accent }]]}
          onPress={() => setActiveTab('clients')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabBtnText, activeTab === 'clients' ? styles.tabBtnTextActive : { color: textSecondary }]}>
            👥 Clients
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'events' ? (
        <View style={{ flex: 1 }}>
          <AdminEventsView isDark={isDark} />
        </View>
      ) : activeTab === 'demands' ? (
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={accent} />
              <Text style={[styles.loadingText, { color: textSecondary }]}>Chargement des demandes...</Text>
            </View>
          ) : subscriptions.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={{ fontSize: 52, marginBottom: 16 }}>📥</Text>
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>Aucune demande</Text>
              <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                Les demandes d'inscription des clients s'afficheront ici.
              </Text>
            </View>
          ) : (
            <FlatList
              data={subscriptions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              renderItem={({ item }) => (
                <View style={[styles.clientCard, { backgroundColor: card, borderColor: cardBorder }]}>
                  <View style={styles.clientCardHeader}>
                    <View style={[styles.clientAvatarPlaceholder, { borderColor: accent, backgroundColor: `${accent}22` }]}>
                      <Text style={{ fontSize: 22 }}>📩</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[styles.clientName, { color: textPrimary }]}>{item.username}</Text>
                      <Text style={[styles.clientEmail, { color: textSecondary }]}>{item.userEmail}</Text>
                      <Text style={{ color: accent, fontWeight: '700', fontSize: 13, marginTop: 4 }}>
                        🎯 Événement : {item.eventTitle}
                      </Text>
                    </View>
                    <View style={{
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
                      backgroundColor: item.status === 'accepted' ? `${success}22` : item.status === 'refused' ? `${danger}22` : item.status === 'waitlist' ? `${warning}22` : `${accent}22`
                    }}>
                      <Text style={{
                        fontSize: 12, fontWeight: '800',
                        color: item.status === 'accepted' ? success : item.status === 'refused' ? danger : item.status === 'waitlist' ? warning : accent
                      }}>
                        {item.status === 'accepted' ? '✅ Acceptée' : item.status === 'refused' ? '❌ Refusée' : item.status === 'waitlist' ? '⏳ Liste d\'attente' : '⏳ En attente'}
                      </Text>
                    </View>
                  </View>

                  {/* Decision Buttons */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { flex: 1, backgroundColor: `${success}22`, borderColor: `${success}66` }]}
                      onPress={() => handleDecision(item, 'accepted')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.actionBtnText, { color: success }]}>✅ Accepter</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { flex: 1, backgroundColor: `${warning}22`, borderColor: `${warning}66` }]}
                      onPress={() => handleDecision(item, 'waitlist')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.actionBtnText, { color: warning }]}>⏳ Liste d'attente</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { flex: 1, backgroundColor: `${danger}22`, borderColor: `${danger}66` }]}
                      onPress={() => handleDecision(item, 'refused')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.actionBtnText, { color: danger }]}>❌ Refuser</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Search Bar */}
          <View style={[styles.searchBarWrap, { backgroundColor: surface, borderColor: cardBorder }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Rechercher un client par nom ou email..."
              placeholderTextColor={textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Text style={{ color: textSecondary, fontWeight: '700', fontSize: 14 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={accent} />
              <Text style={[styles.loadingText, { color: textSecondary }]}>Chargement des comptes...</Text>
            </View>
          ) : (() => {
            const allClients = users.filter((u) => u.role === 'client');
            const filteredClients = allClients.filter((u) =>
              u.username.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
              u.email.toLowerCase().includes(searchQuery.toLowerCase().trim())
            );

            if (allClients.length === 0) {
              return (
                <View style={styles.centerContainer}>
                  <Text style={{ fontSize: 52, marginBottom: 16 }}>👥</Text>
                  <Text style={[styles.emptyTitle, { color: textPrimary }]}>Aucun client</Text>
                  <Text style={[styles.emptyText, { color: textSecondary }]}>
                    Aucun compte client n'a encore été créé.
                  </Text>
                </View>
              );
            }

            if (filteredClients.length === 0) {
              return (
                <View style={styles.centerContainer}>
                  <Text style={{ fontSize: 44, marginBottom: 12 }}>🔍</Text>
                  <Text style={[styles.emptyTitle, { color: textPrimary }]}>Aucun résultat</Text>
                  <Text style={[styles.emptyText, { color: textSecondary }]}>
                    Aucun client ne correspond à "{searchQuery}".
                  </Text>
                </View>
              );
            }

            return (
              <FlatList
                data={filteredClients}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={renderClientCard}
              />
            );
          })()}
        </View>
      )}

      {/* Client Details Modal */}
      <Modal visible={!!detailsClient} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: surface, borderColor: `${accent}44` }]}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Profil client</Text>

              {detailsClient?.photo ? (
                <Image source={{ uri: detailsClient.photo }} style={[styles.modalAvatar, { borderColor: accent }]} />
              ) : (
                <View style={[styles.modalAvatarPlaceholder, { borderColor: accent, backgroundColor: `${accent}22` }]}>
                  <Text style={{ fontSize: 40 }}>👤</Text>
                </View>
              )}

              <DetailRow label="Nom d'utilisateur" value={detailsClient?.username} textPrimary={textPrimary} textSecondary={textSecondary} />
              <DetailRow label="Email" value={detailsClient?.email} textPrimary={textPrimary} textSecondary={textSecondary} />
              <DetailRow label="Rôle" value={detailsClient?.role} textPrimary={textPrimary} textSecondary={textSecondary} />
              <DetailRow
                label="Statut"
                value={detailsClient?.status === 'closed' ? '🔒 Clôturé' : '✅ Actif'}
                valueColor={detailsClient?.status === 'closed' ? danger : success}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />
              <DetailRow
                label="Inscrit le"
                value={detailsClient ? formatDate(detailsClient.createdAt) : '-'}
                textPrimary={textPrimary}
                textSecondary={textSecondary}
              />
              <DetailRow label="ID Client" value={detailsClient?.id} textPrimary={textPrimary} textSecondary={textSecondary} small />
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: '#06B6D4', marginBottom: 10 }]}
              onPress={() => {
                const client = detailsClient;
                setDetailsClient(null);
                setChatPartner(client);
                setChatVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalCloseBtnText}>Discuter avec le client 💬</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: accent }]} onPress={() => setDetailsClient(null)} activeOpacity={0.85}>
              <Text style={styles.modalCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Chat / Discussion Modal */}
      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        currentUser={currentUser}
        chatPartner={chatPartner}
      />
    </SafeAreaView>
  );
}

function DetailRow({ label, value, valueColor, textPrimary, textSecondary, small }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: valueColor || textPrimary }, small && { fontSize: 11 }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  blob1: { top: -100, left: -100, backgroundColor: 'rgba(139,92,246,0.12)' },
  blob2: { bottom: -100, right: -100, backgroundColor: 'rgba(236,72,153,0.08)' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 12, marginTop: 2 },

  logoutBtn: {
    backgroundColor: 'rgba(255,61,113,0.12)',
    borderColor: 'rgba(255,61,113,0.35)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  logoutBtnText: { color: '#FF7A90', fontWeight: '700', fontSize: 12 },

  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 14,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1.5,
  },
  tabBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  tabBtnActive: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  tabBtnText: { fontSize: 13, fontWeight: '700' },
  tabBtnTextActive: { color: '#FFFFFF', fontWeight: '800' },

  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  clearSearchBtn: {
    padding: 6,
  },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  loadingText: { marginTop: 12, fontSize: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  emptyText: { fontSize: 13, textAlign: 'center' },

  listContent: { padding: 16, paddingBottom: 40 },

  clientCard: { borderRadius: 20, borderWidth: 1.5, padding: 16, marginBottom: 14 },
  clientCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  clientAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2 },
  clientAvatarPlaceholder: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3D71',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#0B071E',
    zIndex: 10,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  newMsgPill: {
    backgroundColor: 'rgba(255,61,113,0.18)',
    borderColor: '#FF3D71',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newMsgPillText: {
    color: '#FF3D71',
    fontSize: 11,
    fontWeight: '800',
  },
  clientName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  clientEmail: { fontSize: 13, marginBottom: 4 },
  closedBadge: {
    backgroundColor: 'rgba(255,61,113,0.15)',
    borderColor: 'rgba(255,61,113,0.4)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  closedBadgeText: { color: '#FF7A90', fontSize: 11, fontWeight: '700' },

  clientActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  actionBtnText: { fontWeight: '700', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%', borderTopWidth: 2 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  modalAvatar: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginBottom: 20, borderWidth: 3 },
  modalAvatarPlaceholder: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 3 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  detailLabel: { fontSize: 13, fontWeight: '600' },
  detailValue: { fontSize: 14, fontWeight: '700', maxWidth: '55%', textAlign: 'right' },
  modalCloseBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  modalCloseBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
