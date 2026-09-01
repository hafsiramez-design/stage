import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, Image, Platform, SafeAreaView, StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { sendNewEventNotification, sendEventChangeNotification } from '../services/emailService';
import MapPickerModal from './MapPickerModal';
import {
  addEvent,
  updateEvent,
  getOrCreateCountryId,
  getAllClientEmails,
} from '../database/db';

const CATEGORIES = ['Festival', 'Music', 'Sports', 'Culture', 'Fashion', 'Art', 'Technology'];

export default function CreateEventScreen({ selectedDate, editingEvent, isDark = true, onBack, onSaved }) {
  const bg          = isDark ? '#050A18' : '#F8FAFC';
  const textPrimary = isDark ? '#FFFFFF'  : '#1E293B';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const cardBg      = isDark ? '#1E293B'  : '#FFFFFF';
  const inputBg     = isDark ? '#0F172A'  : '#F1F5F9';
  const inputBorder = isDark ? '#334155'  : '#E2E8F0';

  const [title,            setTitle]            = useState(editingEvent?.title || '');
  const [category,         setCategory]         = useState(editingEvent?.category || CATEGORIES[0]);
  const [locationObj,      setLocationObj]      = useState(
    editingEvent ? { address: editingEvent.location, country: '' } : null
  );
  const [description,      setDescription]      = useState(editingEvent?.description || '');
  const [eventPhoto,       setEventPhoto]       = useState(editingEvent?.photo || null);
  const [eventPhotoBase64, setEventPhotoBase64] = useState(null);
  const [mapVisible,       setMapVisible]       = useState(false);
  const [isSubmitting,     setIsSubmitting]     = useState(false);

  const isEditing = !!editingEvent;

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
      base64: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      setEventPhoto(result.assets[0].uri);
      // No base64 needed — file URI is sufficient and avoids OOM crashes
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !locationObj || !selectedDate) {
      Alert.alert('Erreur', 'Veuillez remplir le titre, la localisation (Map) et la date.');
      return;
    }

    // Validate past date (only for new events)
    if (!isEditing) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(selectedDate);
      if (eventDate < today) {
        Alert.alert('Date invalide', 'Vous ne pouvez pas créer un événement à une date déjà passée.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let countryId = editingEvent ? editingEvent.countryId : null;
      if (locationObj.country) {
        countryId = await getOrCreateCountryId(locationObj.country);
      }

      const savedTitle = title.trim();
      const savedLoc = locationObj.address;
      const savedDesc = description.trim() || 'No description provided.';
      const savedCat = category;

      if (isEditing) {
        await updateEvent({
          id: editingEvent.id,
          countryId,
          title: savedTitle,
          date: selectedDate,
          location: savedLoc,
          category: savedCat,
          description: savedDesc,
          photo: eventPhoto || null, // Use URI, never base64 (avoids OOM crash)
        });

        Alert.alert('✅ Succès', 'Événement modifié avec succès.');

        // Send change notification — await so it completes before navigation
        try {
          const emails = await getAllClientEmails();
          console.log('[CreateEvent] Client emails for change notification:', emails);
          if (emails && emails.length > 0) {
            const result = await sendEventChangeNotification({
              eventTitle: savedTitle,
              eventDate: selectedDate,
              eventLocation: savedLoc,
              changeType: 'modified',
              clientEmails: emails,
            });
            console.log('[CreateEvent] Change notification result:', result);
          }
        } catch (emailErr) {
          console.warn('[CreateEvent] Change notification failed:', emailErr);
        }

      } else {
        try {
          await addEvent({
            countryId,
            title: savedTitle,
            date: selectedDate,
            location: savedLoc,
            category: savedCat,
            description: savedDesc,
            photo: eventPhoto || null, // Use URI, never base64 (avoids OOM crash)
          });
        } catch (e) {
          if (e.message === 'DATE_EXISTS') {
            Alert.alert('Date déjà utilisée', 'Un événement existe déjà à cette date. Veuillez choisir une autre date.');
            setIsSubmitting(false);
            return;
          }
          throw e;
        }

        Alert.alert('✅ Succès', 'Événement créé avec succès !');

        // Send email notification — await so it completes before navigation
        try {
          const emails = await getAllClientEmails();
          console.log('[CreateEvent] Client emails for notification:', emails);
          if (emails && emails.length > 0) {
            const result = await sendNewEventNotification({
              eventTitle: savedTitle,
              eventCategory: savedCat,
              eventDate: selectedDate,
              eventLocation: savedLoc,
              eventDescription: savedDesc,
              clientEmails: emails,
            });
            console.log('[CreateEvent] Email notification result:', result);
          } else {
            console.log('[CreateEvent] No client emails found, skipping notification');
          }
        } catch (emailErr) {
          console.warn('[CreateEvent] Email notification failed:', emailErr);
        }
      }

      onSaved();
    } catch (e) {
      Alert.alert('Erreur', "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(91,94,255,0.2)' : '#E2E8F0' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
          <Text style={{ color: '#5B5EFF', fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            {isEditing ? '✏️ Modifier l\'événement' : '✨ Nouvel événement'}
          </Text>
          <Text style={[styles.headerDate, { color: '#5B5EFF' }]}>📅 {selectedDate}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[styles.label, { color: textSecondary }]}>Titre de l'événement :</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex. Tomorrowland 2026"
          placeholderTextColor={textSecondary}
        />

        {/* Location */}
        <Text style={[styles.label, { color: textSecondary }]}>Localisation (carte) :</Text>
        <TouchableOpacity
          style={[styles.mapBtn, { backgroundColor: inputBg, borderColor: 'rgba(91,94,255,0.4)' }]}
          onPress={() => setMapVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.mapBtnText, { color: locationObj ? '#00E676' : '#5B5EFF' }]}>
            {locationObj ? `📍 ${locationObj.address}` : '🗺️ Choisir sur la carte'}
          </Text>
        </TouchableOpacity>

        {/* Category */}
        <Text style={[styles.label, { color: textSecondary }]}>Catégorie :</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: category === cat ? '#5B5EFF' : (isDark ? '#0F1E35' : '#EEF2FF'),
                  borderColor: category === cat ? '#5B5EFF' : 'rgba(91,94,255,0.2)',
                },
              ]}
              onPress={() => setCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={{ color: category === cat ? '#fff' : textSecondary, fontWeight: '600', fontSize: 13 }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Description */}
        <Text style={[styles.label, { color: textSecondary }]}>Description :</Text>
        <TextInput
          style={[styles.input, { height: 90, textAlignVertical: 'top', backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Description de l'événement..."
          placeholderTextColor={textSecondary}
          multiline
        />

        {/* Photo */}
        <Text style={[styles.label, { color: textSecondary }]}>Photo (Optionnelle) :</Text>
        <TouchableOpacity
          style={[styles.photoPickerBtn, { backgroundColor: inputBg, borderColor: 'rgba(91,94,255,0.3)' }]}
          onPress={pickPhoto}
          activeOpacity={0.8}
        >
          {eventPhoto ? (
            <Image source={{ uri: eventPhoto }} style={styles.photoPreview} />
          ) : (
            <Text style={{ color: '#5B5EFF', textAlign: 'center', paddingVertical: 24, fontWeight: '600' }}>
              🖼️ Choisir une photo depuis la galerie
            </Text>
          )}
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: isDark ? '#0F1E35' : '#EEF2FF', borderColor: 'rgba(91,94,255,0.2)', borderWidth: 1 }]}
            onPress={onBack}
            disabled={isSubmitting}
          >
            <Text style={{ color: textSecondary, fontWeight: '700' }}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, { opacity: isSubmitting ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
              {isSubmitting ? '⏳ Enregistrement...' : isEditing ? '✅ Modifier' : '✅ Créer'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <MapPickerModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onSelectLocation={(loc) => {
          setLocationObj(loc);
          setMapVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 50 : 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(91,94,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerDate: { fontSize: 13, fontWeight: '600', marginTop: 2 },

  label: {
    fontSize: 12, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 8, marginTop: 18,
  },
  input: {
    padding: 14, borderRadius: 12, borderWidth: 1.5, fontSize: 14,
  },
  mapBtn: {
    padding: 16, borderRadius: 12, borderWidth: 1.5, alignItems: 'center',
  },
  mapBtnText: { fontWeight: '700', fontSize: 14 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, marginRight: 8, borderWidth: 1.5,
  },
  photoPickerBtn: { borderRadius: 12, borderWidth: 1.5, overflow: 'hidden' },
  photoPreview: { width: '100%', height: 180 },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  cancelBtn: {
    paddingHorizontal: 22, paddingVertical: 15, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  saveBtn: {
    flex: 1, backgroundColor: '#5B5EFF', paddingVertical: 15,
    borderRadius: 14, alignItems: 'center',
    shadowColor: '#5B5EFF', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 6,
  },
});
