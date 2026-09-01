import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { getAllEvents, deleteEvent, getAllClientEmails } from '../database/db';
import { sendEventChangeNotification } from '../services/emailService';
import CreateEventScreen from './CreateEventScreen';

// Setup French locale for Calendar
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

export default function AdminEventsView({ isDark = true }) {
  const bg          = isDark ? '#050A18' : '#F8FAFC';
  const textPrimary = isDark ? '#FFFFFF'  : '#1E293B';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const cardBg      = isDark ? '#1E293B'  : '#FFFFFF';

  const [events,       setEvents]       = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  // createScreen: null | { date, event }
  const [createScreen, setCreateScreen] = useState(null);

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    const data = await getAllEvents();
    setEvents(data);
  };

  // Compute today's date string YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  // Build markedDates
  const today = getTodayString();
  const markedDates = {};
  events.forEach(ev => {
    markedDates[ev.date] = { marked: true, dotColor: '#6C3FFF' };
  });
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: '#6C3FFF',
    };
  }
  // Disable past dates visually
  const minDate = today;

  const selectedEvent = events.find(e => e.date === selectedDate);

  const handleDayPress = (day) => {
    const chosenDate = day.dateString;

    // Validate: no past dates
    if (chosenDate < today) {
      Alert.alert('Date invalide', 'Vous ne pouvez pas sélectionner une date passée.');
      return;
    }

    // Set selected date. The calendar will be hidden and the Day View will be shown.
    setSelectedDate(chosenDate);
  };

  const handleAddNew = () => {
    if (!selectedDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date sur le calendrier.');
      return;
    }
    // Check duplicate date
    const ev = events.find(e => e.date === selectedDate);
    if (ev) {
      Alert.alert('Date occupée', 'Un événement existe déjà à cette date. Veuillez choisir une autre date.');
      return;
    }
    setCreateScreen({ date: selectedDate, event: null });
  };

  const handleEdit = () => {
    if (!selectedEvent) return;
    setCreateScreen({ date: selectedDate, event: selectedEvent });
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer cet événement ? Les clients inscrits recevront un email.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(selectedEvent.id);
              // Notify clients about deletion
              try {
                const emails = await getAllClientEmails();
                if (emails.length > 0) {
                  await sendEventChangeNotification({
                    eventTitle: selectedEvent.title,
                    eventDate: selectedEvent.date,
                    eventLocation: selectedEvent.location,
                    changeType: 'deleted',
                    clientEmails: emails,
                  });
                }
              } catch (e) {
                console.warn('Could not send deletion email:', e);
              }
              loadEvents();
              setSelectedDate('');
              Alert.alert('✅ Supprimé', 'Événement supprimé et clients notifiés !');
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de supprimer cet événement.');
            }
          },
        },
      ]
    );
  };

  // If createScreen is set, render the CreateEventScreen
  if (createScreen) {
    return (
      <CreateEventScreen
        selectedDate={createScreen.date}
        editingEvent={createScreen.event}
        isDark={isDark}
        onBack={() => setCreateScreen(null)}
        onSaved={() => {
          setCreateScreen(null);
          loadEvents();
          setSelectedDate('');
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {!selectedDate ? (
        <View style={{ flex: 1 }}>
          <Text style={[styles.calendarTitle, { color: textPrimary }]}>
            Sélectionnez une date
          </Text>
          <Calendar
            style={[styles.calendar, { borderColor: isDark ? 'rgba(91,94,255,0.2)' : '#DDE8F0' }]}
            minDate={minDate}
            theme={{
              calendarBackground: isDark ? '#0A1628' : '#FFFFFF',
              textSectionTitleColor: textSecondary,
              selectedDayBackgroundColor: '#5B5EFF',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#5B5EFF',
              dayTextColor: textPrimary,
              textDisabledColor: isDark ? '#1E2E45' : '#CBD5E1',
              dotColor: '#5B5EFF',
              selectedDotColor: '#ffffff',
              arrowColor: '#5B5EFF',
              monthTextColor: textPrimary,
              textMonthFontWeight: 'bold',
              textMonthFontSize: 16,
            }}
            onDayPress={handleDayPress}
            markedDates={markedDates}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Day View Header */}
          <View style={[styles.dayHeader, { borderBottomColor: isDark ? 'rgba(91,94,255,0.2)' : '#DDE8F0' }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedDate('')}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.dayHeaderText, { color: textPrimary }]}>
              Événement du {selectedDate}
            </Text>
          </View>

          <ScrollView
            style={styles.detailsContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {selectedEvent ? (
              // Show existing event card
              <View style={[styles.eventCard, { backgroundColor: cardBg, borderColor: isDark ? 'rgba(91,94,255,0.2)' : '#DDE8F0' }]}>
                {selectedEvent.photo && (
                  <Image source={{ uri: selectedEvent.photo }} style={styles.eventPhoto} />
                )}
                <Text style={[styles.eventTitle, { color: textPrimary }]}>{selectedEvent.title}</Text>
                <View style={styles.metaBadgesRow}>
                  <View style={[styles.metaBadge, { backgroundColor: 'rgba(91,94,255,0.15)', borderColor: 'rgba(91,94,255,0.3)' }]}>
                    <Text style={{ color: '#8B8FFF', fontSize: 12, fontWeight: '700' }}>📍 {selectedEvent.location}</Text>
                  </View>
                  <View style={[styles.metaBadge, { backgroundColor: 'rgba(0,212,255,0.12)', borderColor: 'rgba(0,212,255,0.3)' }]}>
                    <Text style={{ color: '#00D4FF', fontSize: 12, fontWeight: '700' }}>🏷️ {selectedEvent.category}</Text>
                  </View>
                </View>
                {selectedEvent.description ? (
                  <Text style={[styles.eventDescription, { color: textSecondary }]}>{selectedEvent.description}</Text>
                ) : null}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.editBtn, { backgroundColor: 'rgba(91,94,255,0.2)', borderColor: 'rgba(91,94,255,0.5)', borderWidth: 1 }]}
                    onPress={handleEdit}
                  >
                    <Text style={{ color: '#8B8FFF', fontWeight: '700', fontSize: 13 }}>✏️ Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: 'rgba(255,61,113,0.15)', borderColor: 'rgba(255,61,113,0.4)', borderWidth: 1 }]}
                    onPress={handleDelete}
                  >
                    <Text style={{ color: '#FF3D71', fontWeight: '700', fontSize: 13 }}>🗑️ Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // No event on this date
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 50, marginBottom: 16 }}>📅</Text>
                <Text style={[styles.emptyText, { color: textPrimary, fontSize: 18, fontWeight: '700' }]}>
                  Aucun événement
                </Text>
                <Text style={[styles.emptyText, { color: textSecondary, marginTop: 8 }]}>
                  Il n'y a aucun événement de programmé pour le {selectedDate}.
                </Text>
                
                <TouchableOpacity style={styles.addEventBtn} onPress={handleAddNew}>
                  <Text style={styles.addEventBtnText}>+ Ajouter un événement</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendar: {
    borderRadius: 16,
    margin: 14,
    paddingBottom: 8,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  detailsContainer: { flex: 1 },

  calendarTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(91,94,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backBtnText: { color: '#5B5EFF', fontSize: 22, fontWeight: 'bold' },
  dayHeaderText: {
    fontSize: 18,
    fontWeight: '800',
  },

  eventCard: {
    borderRadius: 20, borderWidth: 1.5, padding: 18, marginTop: 4,
  },
  eventPhoto: { width: '100%', height: 160, borderRadius: 12, marginBottom: 14 },
  eventTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  metaBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  metaBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  eventDescription: { fontSize: 14, lineHeight: 20, marginBottom: 4 },

  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyText: { textAlign: 'center', fontSize: 15, lineHeight: 22 },
  
  addEventBtn: {
    marginTop: 30,
    backgroundColor: '#5B5EFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#5B5EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  addEventBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
  editBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  deleteBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
});
