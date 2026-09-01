import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function MapPickerModal({ visible, onClose, onSelectLocation }) {
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'locationSelected') {
        if (onSelectLocation) {
          onSelectLocation(event.data.location);
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [onSelectLocation]);

  const srcDoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body { height: 100%; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0F172A; color: #FFF; }
        #container { display: flex; flex-direction: column; height: 100%; }
        #search-bar { display: flex; padding: 12px; gap: 8px; background: #1E293B; border-bottom: 1px solid #334155; }
        #search-input { flex: 1; padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; background: #0F172A; color: #fff; font-size: 14px; outline: none; }
        #search-btn { padding: 10px 18px; border-radius: 8px; border: none; background: #6C3FFF; color: #fff; font-weight: bold; cursor: pointer; font-size: 14px; }
        #map { flex: 1; width: 100%; }
        #footer { padding: 12px; background: #1E293B; text-align: center; border-top: 1px solid #334155; }
        #confirm-btn { width: 100%; padding: 14px; border-radius: 10px; border: none; background: #6C3FFF; color: #fff; font-weight: bold; font-size: 15px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div id="container">
        <div id="search-bar">
          <input type="text" id="search-input" placeholder="Rechercher une ville, lieu, adresse..." />
          <button id="search-btn">Chercher</button>
        </div>
        <div id="map"></div>
        <div id="footer">
          <button id="confirm-btn">Confirmer l'emplacement</button>
        </div>
      </div>

      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        var map, marker;
        var selectedLocation = null;

        function initMap() {
          map = L.map('map').setView([48.8566, 2.3522], 4);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          map.on('click', function(e) {
            setMarker(e.latlng.lat, e.latlng.lng);
          });

          document.getElementById('search-btn').onclick = function() {
            var query = document.getElementById('search-input').value;
            if (!query) return;
            fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=1')
              .then(function(r) { return r.json(); })
              .then(function(data) {
                if (data && data.length > 0) {
                  var item = data[0];
                  var lat = parseFloat(item.lat);
                  var lon = parseFloat(item.lon);
                  map.setView([lat, lon], 12);
                  setMarker(lat, lon);
                } else {
                  alert('Lieu non trouvé. Essayez une autre recherche.');
                }
              })
              .catch(function(err) {
                alert('Erreur lors de la recherche.');
              });
          };

          document.getElementById('confirm-btn').onclick = function() {
            if (!selectedLocation) {
              alert('Veuillez cliquer sur la carte pour choisir un emplacement.');
              return;
            }
            window.parent.postMessage({
              type: 'locationSelected',
              location: selectedLocation
            }, '*');
          };
        }

        function setMarker(lat, lng) {
          if (!map) return;
          if (marker) map.removeLayer(marker);
          marker = L.marker([lat, lng]).addTo(map);

          fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&zoom=18&addressdetails=1')
            .then(function(r) { return r.json(); })
            .then(function(data) {
              var addr = (data && data.address) || {};
              var country = addr.country || '';
              var addressStr = (data && data.display_name) || (lat.toFixed(4) + ', ' + lng.toFixed(4));

              if (country.toLowerCase().includes('tunis')) {
                alert('Action non autorisée: Il n\\'est pas possible de créer un événement en Tunisie.');
                map.removeLayer(marker);
                marker = null;
                selectedLocation = null;
                return;
              }

              selectedLocation = {
                country: country,
                address: addressStr,
                latitude: lat,
                longitude: lng
              };
            })
            .catch(function() {
              selectedLocation = {
                country: 'Inconnu',
                address: lat.toFixed(4) + ', ' + lng.toFixed(4),
                latitude: lat,
                longitude: lng
              };
            });
        }

        window.onload = function() {
          initMap();
        };
      </script>
    </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Choisir l'emplacement</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            <iframe
              srcDoc={srcDoc}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Map Picker"
            />
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
    height: height * 0.8,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  closeBtn: { padding: 5 },
  closeText: { color: '#94A3B8', fontSize: 20 },
  body: { flex: 1 },
});
