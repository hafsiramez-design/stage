import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { updateUserProfile } from '../database/db';

export default function ProfileModal({ visible, user, isDark, onClose, onProfileUpdated }) {
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState(user?.password || '');
  const [photo, setPhoto] = useState(user?.photo || '');

  // Reset states when opened
  React.useEffect(() => {
    if (visible && user) {
      setUsername(user.username);
      setPassword(user.password);
      setPhoto(user.photo || '');
    }
  }, [visible, user]);

  const handleSave = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur et le mot de passe sont obligatoires.');
      return;
    }
    const updatedUser = await updateUserProfile(user.id, {
      username: username.trim(),
      password: password.trim(),
      photo: photo.trim()
    });

    if (updatedUser) {
      onProfileUpdated(updatedUser);
      Alert.alert('Succès', 'Profil mis à jour !');
    } else {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    }
  };

  if (!user) return null;

  const bgModal = isDark ? '#0F172A' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const inputBg = isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0';
  const subTextColor = isDark ? '#8899aa' : '#64748B';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalBox, { backgroundColor: bgModal, borderColor }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={[styles.closeBtnText, { color: textColor }]}>✕</Text>
          </TouchableOpacity>

          <Text style={[styles.modalTitle, { color: textColor }]}>Mon Profil</Text>

          {/* Current Avatar preview */}
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarPreview} />
          ) : (
            <View style={[styles.avatarPlaceholder, { borderColor }]}>
              <Text style={{ fontSize: 40 }}>👤</Text>
            </View>
          )}
          
          <Text style={[styles.emailText, { color: subTextColor }]}>{user.email}</Text>
          <Text style={[styles.roleBadge, { color: subTextColor, borderColor }]}>Rôle: {user.role}</Text>

          <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor }]}>
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Nom d'utilisateur"
              placeholderTextColor={subTextColor}
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor }]}>
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Mot de passe"
              placeholderTextColor={subTextColor}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor }]}>
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="URL de la photo (optionnel)"
              placeholderTextColor={subTextColor}
              value={photo}
              onChangeText={setPhoto}
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#6C3FFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  emailText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 4,
  },
  roleBadge: {
    textAlign: 'center',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    borderWidth: 1,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    height: '100%',
  },
  saveBtn: {
    backgroundColor: '#6C3FFF',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
