import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Renders a miniature accurate flag for a given countryId.
 * Used in dashboard cards.
 */
export default function MiniFlagView({ countryId, style }) {
  const flag = getFlag(countryId);
  return (
    <View style={[styles.wrapper, style]}>
      {flag}
    </View>
  );
}

function getFlag(countryId) {
  switch (countryId) {
    /* ─── FRANCE ─── Blue | White | Red (vertical thirds) */
    case 'fr':
      return (
        <View style={s.fullFill}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: '#002395' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, backgroundColor: '#ED2939' }} />
          </View>
        </View>
      );

    /* ─── ITALY ─── Green | White | Red (vertical thirds) */
    case 'it':
      return (
        <View style={s.fullFill}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: '#009246' }} />
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1, backgroundColor: '#CE2B37' }} />
          </View>
        </View>
      );

    /* ─── GERMANY ─── Black | Red | Gold (horizontal thirds) */
    case 'de':
      return (
        <View style={s.fullFill}>
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <View style={{ flex: 1, backgroundColor: '#000000' }} />
            <View style={{ flex: 1, backgroundColor: '#DD0000' }} />
            <View style={{ flex: 1, backgroundColor: '#FFCE00' }} />
          </View>
        </View>
      );

    /* ─── MEXICO ─── Green | White (🦅) | Red (vertical) */
    case 'mx':
      return (
        <View style={s.fullFill}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: '#006847' }} />
            <View style={{ flex: 2, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 18 }}>🦅</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#CE1126' }} />
          </View>
        </View>
      );

    /* ─── CANADA ─── Red | White (🍁) | Red */
    case 'ca':
      return (
        <View style={s.fullFill}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: '#FF0000' }} />
            <View style={{ flex: 2, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 26, color: '#FF0000' }}>🍁</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FF0000' }} />
          </View>
        </View>
      );

    /* ─── JAPAN ─── White + Red circle */
    case 'jp':
      return (
        <View style={[s.fullFill, { backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ width: '44%', aspectRatio: 1, borderRadius: 999, backgroundColor: '#BC002D' }} />
        </View>
      );

    /* ─── BRAZIL ─── Green + Yellow diamond + Blue circle */
    case 'br':
      return (
        <View style={[s.fullFill, { backgroundColor: '#009C3B', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }]}>
          <View style={{
            width: '72%',
            aspectRatio: 1.4,
            backgroundColor: '#FEDF00',
            transform: [{ rotate: '45deg' }],
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              width: '55%',
              aspectRatio: 1,
              backgroundColor: '#002776',
              borderRadius: 999,
              transform: [{ rotate: '-45deg' }],
            }} />
          </View>
        </View>
      );

    /* ─── USA ─── Red/White stripes + Blue canton */
    case 'us':
      return (
        <View style={[s.fullFill, { backgroundColor: '#FFFFFF', overflow: 'hidden' }]}>
          {[...Array(13)].map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 0, right: 0,
                top: `${(i * 100) / 13}%`,
                height: `${100 / 13}%`,
                backgroundColor: i % 2 === 0 ? '#B22234' : '#FFFFFF',
              }}
            />
          ))}
          <View style={{
            position: 'absolute', top: 0, left: 0,
            width: '40%', height: '53%',
            backgroundColor: '#3C3B6E',
            padding: 2,
          }}>
            {[...Array(9)].map((_, i) => (
              <Text key={i} style={{ color: '#FFFFFF', fontSize: 6, lineHeight: 8 }}>★★★</Text>
            ))}
          </View>
        </View>
      );

    /* ─── UK ─── Union Jack */
    case 'gb':
      return (
        <View style={[s.fullFill, { backgroundColor: '#012169', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }]}>
          {/* St Andrew's cross (diagonals) - white */}
          <View style={{ position: 'absolute', width: '160%', height: '30%', backgroundColor: '#FFFFFF', transform: [{ rotate: '35deg' }] }} />
          <View style={{ position: 'absolute', width: '160%', height: '30%', backgroundColor: '#FFFFFF', transform: [{ rotate: '-35deg' }] }} />
          {/* St Patrick's cross (diagonals) - red */}
          <View style={{ position: 'absolute', width: '160%', height: '14%', backgroundColor: '#C8102E', transform: [{ rotate: '35deg' }] }} />
          <View style={{ position: 'absolute', width: '160%', height: '14%', backgroundColor: '#C8102E', transform: [{ rotate: '-35deg' }] }} />
          {/* St George's cross (horizontal + vertical) */}
          <View style={{ position: 'absolute', width: '100%', height: '34%', backgroundColor: '#FFFFFF' }} />
          <View style={{ position: 'absolute', width: '24%', height: '100%', backgroundColor: '#FFFFFF' }} />
          <View style={{ position: 'absolute', width: '100%', height: '20%', backgroundColor: '#C8102E' }} />
          <View style={{ position: 'absolute', width: '14%', height: '100%', backgroundColor: '#C8102E' }} />
        </View>
      );

    /* ─── AUSTRALIA ─── Blue + Union Jack + stars */
    case 'au':
      return (
        <View style={[s.fullFill, { backgroundColor: '#00008B', overflow: 'hidden' }]}>
          {/* Union Jack in top-left */}
          <View style={{
            position: 'absolute', top: 0, left: 0,
            width: '45%', height: '50%',
            backgroundColor: '#012169',
            overflow: 'hidden',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <View style={{ position: 'absolute', width: '160%', height: '34%', backgroundColor: '#FFFFFF', transform: [{ rotate: '35deg' }] }} />
            <View style={{ position: 'absolute', width: '160%', height: '34%', backgroundColor: '#FFFFFF', transform: [{ rotate: '-35deg' }] }} />
            <View style={{ position: 'absolute', width: '160%', height: '16%', backgroundColor: '#C8102E', transform: [{ rotate: '35deg' }] }} />
            <View style={{ position: 'absolute', width: '160%', height: '16%', backgroundColor: '#C8102E', transform: [{ rotate: '-35deg' }] }} />
            <View style={{ position: 'absolute', width: '100%', height: '34%', backgroundColor: '#FFFFFF' }} />
            <View style={{ position: 'absolute', width: '24%', height: '100%', backgroundColor: '#FFFFFF' }} />
            <View style={{ position: 'absolute', width: '100%', height: '20%', backgroundColor: '#C8102E' }} />
            <View style={{ position: 'absolute', width: '14%', height: '100%', backgroundColor: '#C8102E' }} />
          </View>
          {/* Southern Cross stars */}
          <Text style={{ position: 'absolute', left: '20%', top: '58%', color: '#FFFFFF', fontSize: 18 }}>★</Text>
          <Text style={{ position: 'absolute', right: '18%', top: '20%', color: '#FFFFFF', fontSize: 10 }}>★</Text>
          <Text style={{ position: 'absolute', right: '8%', top: '42%', color: '#FFFFFF', fontSize: 10 }}>★</Text>
          <Text style={{ position: 'absolute', right: '24%', top: '55%', color: '#FFFFFF', fontSize: 10 }}>★</Text>
          <Text style={{ position: 'absolute', right: '12%', top: '68%', color: '#FFFFFF', fontSize: 10 }}>★</Text>
        </View>
      );

    /* ─── SOUTH KOREA ─── White + Taegeuk + trigrams */
    case 'kr':
      return (
        <View style={[s.fullFill, { backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ position: 'absolute', left: '10%', top: '10%', color: '#000', fontSize: 12, transform: [{ rotate: '45deg' }] }}>☰</Text>
          <Text style={{ position: 'absolute', right: '10%', top: '10%', color: '#000', fontSize: 12, transform: [{ rotate: '-45deg' }] }}>☵</Text>
          <Text style={{ position: 'absolute', left: '10%', bottom: '10%', color: '#000', fontSize: 12, transform: [{ rotate: '-45deg' }] }}>☲</Text>
          <Text style={{ position: 'absolute', right: '10%', bottom: '10%', color: '#000', fontSize: 12, transform: [{ rotate: '45deg' }] }}>☷</Text>
          <View style={{ width: '42%', aspectRatio: 1, borderRadius: 999, overflow: 'hidden', transform: [{ rotate: '-30deg' }] }}>
            <View style={{ flex: 1, backgroundColor: '#CD2E3A' }} />
            <View style={{ flex: 1, backgroundColor: '#003478' }} />
          </View>
        </View>
      );

    /* ─── SAUDI ARABIA ─── Green with white crescent/sword (simplified) */
    case 'sa':
      return (
        <View style={[s.fullFill, { backgroundColor: '#006C35', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 }}>لا إله إلا الله</Text>
          <View style={{ width: '60%', height: 3, backgroundColor: '#FFFFFF', marginTop: 6 }} />
        </View>
      );

    default:
      return <View style={[s.fullFill, { backgroundColor: '#334455' }]} />;
  }
}

const s = StyleSheet.create({
  fullFill: {
    ...StyleSheet.absoluteFillObject,
  },
});

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
});
