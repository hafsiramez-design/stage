import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { getAllAdmins } from '../database/db';

export default function AdminListModal({ visible, onClose, onSelectAdmin }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadAdmins();
    }
  }, [visible]);

  const loadAdmins = async () => {
    setLoading(true);
    const data = await getAllAdmins();
    setAdmins(data);
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>💬 Contacter un Administrateur</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Choisissez un administrateur pour démarrer une discussion</Text>

          {/* Admin List */}
          {loading ? (
            <ActivityIndicator size="large" color="#6C3FFF" style={{ marginTop: 40 }} />
          ) : admins.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyText}>Aucun administrateur disponible pour le moment.</Text>
            </View>
          ) : (
            <FlatList
              data={admins}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.adminCard}
                  onPress={() => onSelectAdmin(item)}
                  activeOpacity={0.7}
                >
                  {/* Avatar */}
                  {item.photo ? (
                    <Image source={{ uri: item.photo }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {item.username?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {/* Info */}
                  <View style={styles.adminInfo}>
                    <Text style={styles.adminName}>{item.username}</Text>
                    <Text style={styles.adminEmail}>{item.email}</Text>
                  </View>

                  {/* Arrow */}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Admin</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,10,24,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: 'rgba(108,63,255,0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: { padding: 4 },
  closeText: { color: '#94A3B8', fontSize: 22 },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  list: {
    padding: 16,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6C3FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  adminInfo: { flex: 1 },
  adminName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  adminEmail: {
    color: '#94A3B8',
    fontSize: 12,
  },
  badge: {
    backgroundColor: 'rgba(108,63,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#6C3FFF',
  },
  badgeText: {
    color: '#6C3FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  arrow: {
    color: '#6C3FFF',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
