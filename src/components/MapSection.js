import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function MapSection({ events }) {
  if (events && events.length > 0) {
    const event = events[0];
    const lat = event.latitude;
    const lng = event.longitude;

    if (lat != null && lng != null) {
      return (
        <View style={styles.container}>
          <iframe
            src={`https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="Event Location"
          />
        </View>
      );
    }
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  }
});
