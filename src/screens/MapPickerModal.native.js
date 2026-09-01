import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Dimensions, ActivityIndicator, TextInput } from 'react-native';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function MapPickerModal({ visible, onClose, onSelectLocation }) {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedCountry('');
      setSelectedCity('');
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            const location = await Location.getCurrentPositionAsync({});
            const geocode = await Location.reverseGeocodeAsync(location.coords);
            if (geocode.length > 0) {
              const place = geocode[0];
              if (place.country) setSelectedCountry(place.country);
              if (place.city || place.region) setSelectedCity(place.city || place.region);
            }
          } catch (e) {
            console.log('Error getting position/geocode', e);
          }
        }
      })();
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (!selectedCountry.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du pays.');
      return;
    }

    const countryName = selectedCountry.trim();
    if (countryName.toLowerCase().includes('tunis')) {
      Alert.alert('Action non autorisée', 'Il n\'est pas possible de créer un événement en Tunisie.');
      return;
    }

    setLoading(true);
    try {
      const address = selectedCity.trim() ? `${selectedCity.trim()}, ${countryName}` : countryName;
      onSelectLocation({
        country: countryName,
        address: address,
        latitude: 48.8566,
        longitude: 2.3522,
        mapSnapshot: null
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Erreur lors de la sélection du lieu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Choisir l'emplacement</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formContent}>
            <Text style={styles.label}>📍 Pays *</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: France, Espagne, Italie..."
              placeholderTextColor="#94A3B8"
              value={selectedCountry}
              onChangeText={setSelectedCountry}
            />

            <Text style={styles.label}>🏙️ Ville / Région (Optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Paris, Madrid, Rome..."
              placeholderTextColor="#94A3B8"
              value={selectedCity}
              onChangeText={setSelectedCity}
            />

            <View style={styles.hintBox}>
              <Text style={styles.hintText}>
                💡 Les coordonnées géographiques seront automatiquement attribuées.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.confirmBtn, !selectedCountry.trim() && styles.confirmBtnDisabled]} 
              onPress={handleConfirm}
              disabled={!selectedCountry.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirmer l'emplacement</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 24, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#150D32',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 5,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 20,
  },
  formContent: {
    padding: 20,
  },
  label: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 6,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFF',
    fontSize: 15,
    marginBottom: 14,
  },
  hintBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  hintText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: '#150D32',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.2)',
  },
  confirmBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
