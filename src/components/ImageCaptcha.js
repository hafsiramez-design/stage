import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';

export default function ImageCaptcha({ onVerified, onFailed }) {
  const [status, setStatus] = useState('idle'); // idle | verifying | verified | failed
  const checkScale = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (status === 'verified') return;

    setStatus('verifying');

    // Spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();

    // Simulate verification delay (like real reCAPTCHA)
    setTimeout(() => {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
      setStatus('verified');

      // Checkmark pop animation
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start();

      if (onVerified) onVerified();
    }, 1500);
  };

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        {/* Checkbox area */}
        <TouchableOpacity
          style={styles.checkboxArea}
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={status === 'verified' || status === 'verifying'}
        >
          <View style={[
            styles.checkbox,
            status === 'verified' && styles.checkboxChecked,
          ]}>
            {status === 'idle' && null}
            {status === 'verifying' && (
              <Animated.Text style={[styles.spinner, { transform: [{ rotate: spinInterpolate }] }]}>
                ⟳
              </Animated.Text>
            )}
            {status === 'verified' && (
              <Animated.Text style={[styles.checkmark, { transform: [{ scale: checkScale }] }]}>
                ✓
              </Animated.Text>
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>I'm not a robot</Text>

        {/* reCAPTCHA branding */}
        <View style={styles.branding}>
          <Text style={styles.recaptchaIcon}>🔄</Text>
          <Text style={styles.recaptchaText}>reCAPTCHA</Text>
          <Text style={styles.privacyText}>Privacy - Terms</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9F9F9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxArea: {
    marginRight: 14,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#C1C1C1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#4CAF50',
    backgroundColor: '#FFFFFF',
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: '900',
  },
  spinner: {
    color: '#4285F4',
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    flex: 1,
    color: '#202124',
    fontSize: 15,
    fontWeight: '500',
  },
  branding: {
    alignItems: 'center',
  },
  recaptchaIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  recaptchaText: {
    color: '#555',
    fontSize: 10,
    fontWeight: '700',
  },
  privacyText: {
    color: '#888',
    fontSize: 8,
  },
});
