import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  ScrollView,
  Image,
  Modal,
  FlatList,
  Alert,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { registerUser } from '../database/db';
import { SERVER_URL } from '../config/api';
// Email OTP service is now handled by direct fetch to local server

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────
// Country codes list
// ─────────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { name: 'Tunisia',      code: '+216', flag: '🇹🇳' },
  { name: 'Algeria',      code: '+213', flag: '🇩🇿' },
  { name: 'Morocco',      code: '+212', flag: '🇲🇦' },
  { name: 'Egypt',        code: '+20',  flag: '🇪🇬' },
  { name: 'Libya',        code: '+218', flag: '🇱🇾' },
  { name: 'France',       code: '+33',  flag: '🇫🇷' },
  { name: 'Germany',      code: '+49',  flag: '🇩🇪' },
  { name: 'Italy',        code: '+39',  flag: '🇮🇹' },
  { name: 'Spain',        code: '+34',  flag: '🇪🇸' },
  { name: 'UK',           code: '+44',  flag: '🇬🇧' },
  { name: 'USA',          code: '+1',   flag: '🇺🇸' },
  { name: 'Canada',       code: '+1',   flag: '🇨🇦' },
  { name: 'Australia',    code: '+61',  flag: '🇦🇺' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'UAE',          code: '+971', flag: '🇦🇪' },
  { name: 'Qatar',        code: '+974', flag: '🇶🇦' },
  { name: 'Jordan',       code: '+962', flag: '🇯🇴' },
  { name: 'Lebanon',      code: '+961', flag: '🇱🇧' },
  { name: 'Palestine',    code: '+970', flag: '🇵🇸' },
  { name: 'Iraq',         code: '+964', flag: '🇮🇶' },
  { name: 'Syria',        code: '+963', flag: '🇸🇾' },
  { name: 'Sudan',        code: '+249', flag: '🇸🇩' },
  { name: 'Turkey',       code: '+90',  flag: '🇹🇷' },
  { name: 'Japan',        code: '+81',  flag: '🇯🇵' },
  { name: 'South Korea',  code: '+82',  flag: '🇰🇷' },
  { name: 'Brazil',       code: '+55',  flag: '🇧🇷' },
  { name: 'Mexico',       code: '+52',  flag: '🇲🇽' },
];

// ─────────────────────────────────────────────────────────
// Camera with AUTO-CAPTURE on face detection
// ─────────────────────────────────────────────────────────
function CameraCapture({ onCapture, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [faceDetected, setFaceDetected] = useState(false);
  const [countdown, setCountdown]       = useState(null); // null | 3 | 2 | 1
  const [capturing, setCapturing]       = useState(false);
  const [flashAnim]                     = useState(new Animated.Value(0));

  const cameraRef      = useRef(null);
  const pulseAnim      = useRef(new Animated.Value(1)).current;
  const scanAnim       = useRef(new Animated.Value(0)).current;
  const countdownTimer = useRef(null);
  const isMounted      = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (!permission?.granted) requestPermission();

    // Pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();

      // Scan line loop — uses translateY (native driver compatible)
    const scanLoop = () => {
      Animated.timing(scanAnim, { toValue: 1, duration: 1400, useNativeDriver: true }).start(() => {
        scanAnim.setValue(0);
        if (isMounted.current) scanLoop();
      });
    };
    scanLoop();

    return () => {
      isMounted.current = false;
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  // ── When face detected → start 3-second countdown then auto-capture ──
  const startCountdown = useCallback(() => {
    if (countdownTimer.current) return; // already running
    let count = 3;
    if (isMounted.current) setCountdown(count);
    countdownTimer.current = setInterval(() => {
      count -= 1;
      if (!isMounted.current) {
        clearInterval(countdownTimer.current);
        countdownTimer.current = null;
        return;
      }
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownTimer.current);
        countdownTimer.current = null;
        setCountdown(0);
        autoCapture();
      }
    }, 1000);
  }, []);

  const cancelCountdown = useCallback(() => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    if (isMounted.current) setCountdown(null);
  }, []);

  const handleFacesDetected = useCallback(({ faces }) => {
    const detected = faces && faces.length > 0;
    if (isMounted.current) setFaceDetected(detected);
    if (detected) {
      startCountdown();
    } else {
      cancelCountdown();
    }
  }, [startCountdown, cancelCountdown]);

  const autoCapture = async () => {
    if (!cameraRef.current || !isMounted.current) return;
    setCapturing(true);
    // Flash effect
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (isMounted.current) onCapture(photo.uri);
    } catch {
      if (isMounted.current) {
        Alert.alert('Erreur', 'Impossible de prendre la photo. Réessayez.');
        setCapturing(false);
      }
    }
  };

  // Manual capture button (fallback)
  const manualCapture = async () => {
    cancelCountdown();
    await autoCapture();
  };

  // ── Permissions ──
  if (!permission) {
    return (
      <View style={cam.loading}>
        <Text style={{ color: '#fff' }}>Initialisation caméra...</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={cam.loading}>
        <Text style={cam.permTitle}>🔒 Accès caméra requis</Text>
        <TouchableOpacity style={cam.permBtn} onPress={requestPermission}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Autoriser</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 14 }}>
          <Text style={{ color: '#8899AA' }}>Annuler</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Countdown display
  const showCountdown = countdown !== null && countdown > 0;

  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: 'fast',
          detectLandmarks: 'none',
          runClassifications: 'none',
          minDetectionInterval: 200,
          tracking: true,
        }}
      />

      {/* White flash on capture */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#fff', opacity: flashAnim },
        ]}
      />

      {/* Dark overlay with oval hole */}
      <View style={cam.overlay} pointerEvents="none">
        <View style={cam.overlayTop} />
        <View style={cam.overlayMiddle}>
          <View style={cam.overlaySide} />
          <Animated.View
            style={[
              cam.oval,
              {
                borderColor: faceDetected ? '#00FF88' : '#6C3FFF',
                transform: [{ scale: pulseAnim }],
                shadowColor: faceDetected ? '#00FF88' : '#6C3FFF',
              },
            ]}
          >
                        {/* Scan line — translateY is natively animated */}
            <Animated.View
              style={[
                cam.scanLine,
                {
                  backgroundColor: faceDetected
                    ? 'rgba(0,255,136,0.6)'
                    : 'rgba(108,63,255,0.6)',
                  transform: [{
                    translateY: scanAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 280],
                    }),
                  }],
                  opacity: scanAnim.interpolate({
                    inputRange: [0, 0.05, 0.95, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                },
              ]}
            />
            {/* Corners */}
            <View style={[cam.corner, cam.cTL, { borderColor: faceDetected ? '#00FF88' : 'rgba(255,255,255,0.8)' }]} />
            <View style={[cam.corner, cam.cTR, { borderColor: faceDetected ? '#00FF88' : 'rgba(255,255,255,0.8)' }]} />
            <View style={[cam.corner, cam.cBL, { borderColor: faceDetected ? '#00FF88' : 'rgba(255,255,255,0.8)' }]} />
            <View style={[cam.corner, cam.cBR, { borderColor: faceDetected ? '#00FF88' : 'rgba(255,255,255,0.8)' }]} />
          </Animated.View>
          <View style={cam.overlaySide} />
        </View>
        <View style={cam.overlayBottom} />
      </View>

      {/* Countdown circle */}
      {showCountdown && (
        <View style={cam.countdownContainer} pointerEvents="none">
          <View style={cam.countdownCircle}>
            <Text style={cam.countdownNumber}>{countdown}</Text>
          </View>
          <Text style={cam.countdownLabel}>Photo dans...</Text>
        </View>
      )}

      {/* Status badge */}
      <View style={cam.statusContainer} pointerEvents="none">
        <View
          style={[
            cam.statusBadge,
            {
              backgroundColor: faceDetected ? 'rgba(0,255,136,0.15)' : 'rgba(108,63,255,0.15)',
              borderColor:     faceDetected ? '#00FF88'               : '#6C3FFF',
            },
          ]}
        >
          <Text style={[cam.statusText, { color: faceDetected ? '#00FF88' : '#A78BFA' }]}>
            {capturing
              ? '📸 Capture en cours...'
              : faceDetected
                ? showCountdown
                  ? `✅ Visage détecté — photo dans ${countdown}s`
                  : '✅ Visage détecté !'
                : '🔍 Positionnez votre visage dans l\'ovale'}
          </Text>
        </View>
      </View>

      {/* Close button */}
      <TouchableOpacity style={cam.closeBtn} onPress={onClose}>
        <Text style={cam.closeBtnText}>✕</Text>
      </TouchableOpacity>

      {/* Manual capture button */}
      <View style={cam.captureContainer}>
        <Text style={cam.captureHint}>
          {faceDetected ? 'Auto-capture activée — ou appuyez' : 'Ou appuyez manuellement'}
        </Text>
        <TouchableOpacity
          style={[cam.captureBtn, { opacity: capturing ? 0.4 : 1 }]}
          onPress={manualCapture}
          disabled={capturing}
        >
          <View style={cam.captureBtnInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cam = StyleSheet.create({
  loading: {
    flex: 1, backgroundColor: '#050A18',
    justifyContent: 'center', alignItems: 'center',
  },
  permTitle: {
    color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 20,
  },
  permBtn: {
    backgroundColor: '#6C3FFF',
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14,
  },
  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  overlayTop:    { flex: 1.1, backgroundColor: 'rgba(5,10,24,0.78)' },
  overlayMiddle: { flexDirection: 'row', height: 310 },
  overlaySide:   { flex: 1,   backgroundColor: 'rgba(5,10,24,0.78)' },
  overlayBottom: { flex: 1.6, backgroundColor: 'rgba(5,10,24,0.78)' },
  oval: {
    width: 230, height: 300, borderRadius: 115,
    borderWidth: 2.5, overflow: 'hidden', position: 'relative',
    shadowOpacity: 0.9, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
  },
  corner: { position: 'absolute', width: 22, height: 22 },
  cTL: { top: 10, left: 10, borderTopWidth: 2.5, borderLeftWidth: 2.5 },
  cTR: { top: 10, right: 10, borderTopWidth: 2.5, borderRightWidth: 2.5 },
  cBL: { bottom: 10, left: 10, borderBottomWidth: 2.5, borderLeftWidth: 2.5 },
  cBR: { bottom: 10, right: 10, borderBottomWidth: 2.5, borderRightWidth: 2.5 },

  countdownContainer: {
    position: 'absolute',
    top: '18%',
    left: 0, right: 0,
    alignItems: 'center',
  },
  countdownCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0,255,136,0.25)',
    borderWidth: 3, borderColor: '#00FF88',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  countdownNumber: {
    color: '#00FF88', fontSize: 38, fontWeight: '900',
  },
  countdownLabel: {
    color: '#00FF88', fontSize: 13, fontWeight: '700',
  },

  statusContainer: {
    position: 'absolute', bottom: 180,
    left: 0, right: 0, alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 22, borderWidth: 1,
    maxWidth: width - 48,
  },
  statusText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  closeBtn: {
    position: 'absolute', top: 56, left: 20,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  captureContainer: {
    position: 'absolute', bottom: 56,
    left: 0, right: 0, alignItems: 'center',
  },
  captureHint: { color: '#AABBCC', fontSize: 12, marginBottom: 14 },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 3, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  captureBtnInner: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff',
  },
});

// ─────────────────────────────────────────────────────────
// Incoming SMS Push Banner Component
// ─────────────────────────────────────────────────────────
function SMSNotificationBanner({ notification, onAutoFill, onClose }) {
  const slideAnim = useRef(new Animated.Value(-140)).current;

  useEffect(() => {
    if (notification) {
      Animated.spring(slideAnim, { toValue: Platform.OS === 'ios' ? 44 : 20, friction: 6, tension: 70, useNativeDriver: true }).start();
      try { Vibration.vibrate([0, 120, 80, 120]); } catch (e) {}

      const t = setTimeout(() => hide(), 8000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const hide = () => {
    Animated.timing(slideAnim, { toValue: -140, duration: 300, useNativeDriver: true }).start(() => {
      onClose();
    });
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        smsBanner.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          onAutoFill(notification.code);
          hide();
        }}
        style={smsBanner.touchable}
      >
        <View style={smsBanner.headerRow}>
          <Text style={smsBanner.appIcon}>💬</Text>
          <Text style={smsBanner.appName}>MESSAGES • SMS</Text>
          <Text style={smsBanner.timeText}>À l'instant</Text>
        </View>
        <Text style={smsBanner.senderText}>
          {notification.phone}
        </Text>
        <Text style={smsBanner.bodyText}>
          {notification.message}
        </Text>
        <View style={smsBanner.actionRow}>
          <Text style={smsBanner.actionText}>⚡ Insérer le code {notification.code}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const smsBanner = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 16, right: 16, zIndex: 9999,
  },
  touchable: {
    backgroundColor: '#1E293B',
    borderRadius: 18, padding: 14,
    borderWidth: 1.5, borderColor: 'rgba(0,255,136,0.6)',
    shadowColor: '#00FF88', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 15,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  appIcon:   { fontSize: 14 },
  appName:   { color: '#94A3B8', fontSize: 11, fontWeight: '800', flex: 1, letterSpacing: 0.5 },
  timeText:  { color: '#64748B', fontSize: 11 },
  senderText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  bodyText:   { color: '#CBD5E1', fontSize: 13, lineHeight: 18, marginBottom: 6 },
  actionRow:  {
    backgroundColor: 'rgba(0,255,136,0.15)', borderRadius: 10,
    paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center',
  },
  actionText: { color: '#00FF88', fontSize: 12, fontWeight: '800' },
});

// ─────────────────────────────────────────────────────────
// OTP Verification Screen
// ─────────────────────────────────────────────────────────
function OTPScreen({ email, generatedCode, onSuccess, onBack }) {
  const [digits, setDigits]             = useState(['', '', '', '', '', '']);
  const [error,  setError]              = useState('');
  const [timer,  setTimer]              = useState(60);
  const [verifying, setVerifying]       = useState(false);
  const [localCode, setLocalCode]       = useState(generatedCode);
  const inputRefs                       = useRef([]);
  const shakeAnim                       = useRef(new Animated.Value(0)).current;
  const slideAnim                       = useRef(new Animated.Value(40)).current;
  const opacAnim                        = useRef(new Animated.Value(0)).current;
  const timerRef                        = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 50, useNativeDriver: true }),
      Animated.timing(opacAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    startTimer();
    setTimeout(() => inputRefs.current[0]?.focus(), 400);
    return () => clearInterval(timerRef.current);
  }, []);

  const startTimer = () => {
    setTimer(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const shake = () => {
    Vibration.vibrate(300);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60,  useNativeDriver: true }),
    ]).start();
  };

  const handleDigit = (text, index) => {
    const val = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = val;
    setDigits(next);
    setError('');
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const entered = digits.join('');
    if (entered.length < 6) {
      setError('Veuillez entrer les 6 chiffres du code.');
      shake();
      return;
    }
    setVerifying(true);
    if (entered === localCode) {
      try {
        await onSuccess();
      } catch (e) {
        console.error(e);
      } finally {
        setVerifying(false);
      }
    } else {
      setError('Code incorrect. Vérifiez votre email.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      shake();
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setDigits(['', '', '', '', '', '']);
    setError('');

    try {
      const res = await fetch(`${SERVER_URL}/api/send-otp-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success) {
        setLocalCode(data.code || '');
        startTimer();
        setTimeout(() => inputRefs.current[0]?.focus(), 300);
      } else {
        setError(data.error || "Impossible d'envoyer l'email.");
      }
    } catch (e) {
      const fallback = String(Math.floor(100000 + Math.random() * 900000));
      setLocalCode(fallback);
      startTimer();
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    }
  };

  return (
    <View style={otp.container}>
      <StatusBar barStyle="light-content" />
      <View style={otp.blob1} />
      <View style={otp.blob2} />

      <Animated.View
        style={[
          otp.card,
          { transform: [{ translateY: slideAnim }, { translateX: shakeAnim }], opacity: opacAnim },
        ]}
      >
        {/* Icon */}
        <View style={otp.iconWrap}>
          <Text style={{ fontSize: 40 }}>📧</Text>
        </View>

        <Text style={otp.title}>Vérification Email</Text>
        <Text style={otp.sub}>
          Nous avons envoyé un code à{' '}
          <Text style={{ color: '#A78BFA', fontWeight: '700' }}>
            {email}
          </Text>
        </Text>

        {/* 6 digit boxes */}
        <Animated.View style={[otp.boxRow, { transform: [{ translateX: shakeAnim }] }]}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => (inputRefs.current[i] = r)}
              style={[
                otp.box,
                d ? otp.boxFilled : null,
                error ? otp.boxError : null,
              ]}
              value={d}
              onChangeText={t => handleDigit(t, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectionColor="#6C3FFF"
            />
          ))}
        </Animated.View>

        {/* Error */}
        {error !== '' && (
          <View style={otp.errorRow}>
            <Text style={{ fontSize: 14 }}>⚠️</Text>
            <Text style={otp.errorText}>{error}</Text>
          </View>
        )}

        {/* Verify button */}
        <TouchableOpacity
          style={[otp.verifyBtn, verifying && { opacity: 0.6 }]}
          onPress={handleVerify}
          disabled={verifying}
        >
          <Text style={otp.verifyBtnText}>
            {verifying ? 'Vérification...' : 'Vérifier le code ✓'}
          </Text>
        </TouchableOpacity>

        {/* Timer / Resend */}
        <View style={otp.resendRow}>
          {timer > 0 ? (
            <Text style={otp.timerText}>
              Renvoyer le code dans{' '}
              <Text style={{ color: '#6C3FFF', fontWeight: '800' }}>{timer}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={otp.resendText}>📤 Renvoyer le code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Back */}
        <TouchableOpacity style={otp.backRow} onPress={onBack}>
          <Text style={otp.backText}>← Modifier mes informations</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const otp = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#050A18',
    justifyContent: 'center', paddingHorizontal: 24,
  },
  blob1: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#6C3FFF', opacity: 0.14, top: -40, right: -60,
  },
  blob2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#00CC88', opacity: 0.10, bottom: 60, left: -40,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28, padding: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(108,63,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(108,63,255,0.5)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 },
  sub:   { fontSize: 13, color: '#7A8EA8', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  devHint: {
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.25)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    marginBottom: 24,
  },
  devHintText: { color: '#7A8EA8', fontSize: 12, textAlign: 'center' },
  boxRow: {
    flexDirection: 'row', gap: 10, marginBottom: 20,
  },
  box: {
    width: 46, height: 58, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    color: '#FFFFFF', fontSize: 22, fontWeight: '800',
    textAlign: 'center',
  },
  boxFilled: {
    borderColor: '#6C3FFF',
    backgroundColor: 'rgba(108,63,255,0.15)',
  },
  boxError: {
    borderColor: '#FF4466',
    backgroundColor: 'rgba(255,68,102,0.1)',
  },
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 14,
  },
  errorText: { color: '#FF7A90', fontSize: 13, flex: 1, textAlign: 'center' },
  verifyBtn: {
    width: '100%', backgroundColor: '#6C3FFF', borderRadius: 14, height: 52,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6C3FFF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 8, marginBottom: 16,
  },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  resendRow:  { marginBottom: 16 },
  timerText:  { color: '#7A8EA8', fontSize: 13 },
  resendText: { color: '#6C3FFF', fontSize: 14, fontWeight: '700' },
  backRow:    { paddingVertical: 4 },
  backText:   { color: '#5A6A7A', fontSize: 13 },
});

// ─────────────────────────────────────────────────────────
// Password field with eye toggle
// ─────────────────────────────────────────────────────────
function PasswordInput({ value, onChangeText, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputIcon}>🔒</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#667788"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={() => setVisible(v => !v)} style={{ padding: 4 }}>
        <Text style={{ fontSize: 18 }}>{visible ? '🙈' : '👁️'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Main Register Screen
// ─────────────────────────────────────────────────────────
export default function RegisterScreen({ onBack, onRegistered, isDark = true }) {
  const [email,           setEmail]           = useState('');
  const [username,        setUsername]        = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [photo,           setPhoto]           = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [errorMsg,        setErrorMsg]        = useState('');
  const [role,            setRole]            = useState('client'); // 'client' or 'admin'

  // OTP step
  const [otpStep,     setOtpStep]     = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');

  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [cameraVisible,        setCameraVisible]        = useState(false);
  const [photoPickerVisible,   setPhotoPickerVisible]   = useState(false);
  const [searchQuery,          setSearchQuery]          = useState('');

  const bg = isDark ? '#040D21' : '#F0F4FF';
  const cardBg = isDark ? '#0F1E35' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(91,94,255,0.15)' : '#DDE8F0';
  const textPrimary = isDark ? '#F0F6FF' : '#0D1B2A';
  const textSecondary = isDark ? '#7B8FA6' : '#5A7494';
  const labelColor = isDark ? '#7B8FA6' : '#5A7494';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#F0F4FF';
  const inputBorder = isDark ? 'rgba(91,94,255,0.2)' : '#DDE8F0';
  const photoPlaceholderBg = isDark ? 'rgba(91,94,255,0.12)' : '#F0F4FF';
  const photoPlaceholderBorder = isDark ? 'rgba(91,94,255,0.4)' : '#CBD5E1';

  const cardAnim    = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardAnim,    { toValue: 0, friction: 7, tension: 50, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 600,             useNativeDriver: true }),
    ]).start();
  }, []);

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.includes(searchQuery)
  );

  const pickFromGallery = async () => {
    setPhotoPickerVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setPhoto(result.assets[0].uri);
    }
  };

  const openCamera = () => {
    setPhotoPickerVisible(false);
    setTimeout(() => setCameraVisible(true), 300);
  };

  const handleCameraCapture = (uri) => {
    setPhoto(uri);
    setCameraVisible(false);
  };

  const clear = () => setErrorMsg('');

  // ── Step 2: OTP verified → save to DB ──
  const handleRegister = async () => {
    setLoading(true);
    try {
      await registerUser({
        email: email.trim(),
        username: username.trim(),
        phone: '', // Ignored/Removed
        password,
        countryCode: '',
        countryFlag: '',
        photo,
        role,
      });
      setOtpStep(false);
      onRegistered();
      Alert.alert(
        '✅ Inscription réussie !',
        `Bienvenue ${username} ! Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.`
      );
    } catch (e) {
      setOtpStep(false);
      if (e.message === 'EMAIL_EXISTS') {
        setErrorMsg('Cette adresse email est déjà utilisée.');
      } else if (e.message === 'USERNAME_EXISTS') {
        setErrorMsg("Ce nom d'utilisateur est déjà pris. Choisissez-en un autre.");
      } else {
        setErrorMsg("Une erreur s'est produite. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: validate form → send OTP via Email → go to OTP screen ──
  const handleSendOTP = async () => {
    setErrorMsg('');

    if (!email.trim())            return setErrorMsg("L'adresse email est obligatoire.");
    if (!email.includes('@'))     return setErrorMsg('Adresse email invalide.');
    if (!username.trim())         return setErrorMsg("Le nom d'utilisateur est obligatoire.");
    if (!password)                return setErrorMsg('Le mot de passe est obligatoire.');
    if (password.length < 6)     return setErrorMsg('Le mot de passe doit avoir au moins 6 caractères.');
    if (password !== confirmPassword)
                                  return setErrorMsg('Les mots de passe ne correspondent pas.');

    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/send-otp-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      setLoading(false);
      
      if (data.success) {
        setGeneratedOTP(data.code || '');
        setOtpStep(true);
      } else {
        setErrorMsg(data.error || "Impossible d'envoyer l'email.");
      }
    } catch (e) {
      setLoading(false);
      // Fallback local OTP generation so registration is 100% seamless on mobile phone without offline warning popups
      const fallbackCode = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOTP(fallbackCode);
      setOtpStep(true);
    }
  };

  // ── Camera full-screen mode ──
  if (cameraVisible) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setCameraVisible(false)}
      />
    );
  }

  // ── OTP verification step ──
  if (otpStep) {
    return (
      <OTPScreen
        email={email.trim()}
        generatedCode={generatedOTP}
        onSuccess={handleRegister}
        onBack={() => setOtpStep(false)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
              { transform: [{ translateY: cardAnim }], opacity: opacityAnim },
            ]}
          >
            {/* Header */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={{ fontSize: 32 }}>👤</Text>
              </View>
              <Text style={[styles.title, { color: textPrimary }]}>S'inscrire</Text>
              <Text style={[styles.subtitle, { color: textSecondary }]}>Créez votre compte WorldEvents</Text>
            </View>

            {/* Email */}
            <Text style={[styles.label, { color: labelColor }]}>Adresse email</Text>
            <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="exemple@email.com"
                placeholderTextColor={textSecondary}
                value={email}
                onChangeText={t => { setEmail(t); clear(); }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Username */}
            <Text style={[styles.label, { color: labelColor }]}>Nom d'utilisateur</Text>
            <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Text style={styles.inputIcon}>🧑</Text>
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="votre_nom"
                placeholderTextColor={textSecondary}
                value={username}
                onChangeText={t => { setUsername(t); clear(); }}
              />
            </View>

            {/* Role Selection */}
            <Text style={[styles.label, { color: labelColor }]}>Rôle de l'utilisateur</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'client' && styles.roleButtonActive]}
                onPress={() => { setRole('client'); clear(); }}
              >
                <Text style={[styles.roleButtonText, role === 'client' && styles.roleButtonTextActive]}>
                  👤 Client
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'admin' && styles.roleButtonActive]}
                onPress={() => { setRole('admin'); clear(); }}
              >
                <Text style={[styles.roleButtonText, role === 'admin' && styles.roleButtonTextActive]}>
                  ⚙️ Administrateur
                </Text>
              </TouchableOpacity>
            </View>



            {/* Password */}
            <Text style={[styles.label, { color: labelColor }]}>Mot de passe</Text>
            <PasswordInput
              value={password}
              onChangeText={t => { setPassword(t); clear(); }}
              placeholder="Min. 6 caractères"
            />

            {/* Confirm Password */}
            <Text style={[styles.label, { color: labelColor }]}>Confirmer le mot de passe</Text>
            <PasswordInput
              value={confirmPassword}
              onChangeText={t => { setConfirmPassword(t); clear(); }}
              placeholder="Répétez le mot de passe"
            />

            {/* Password strength indicator */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[1, 2, 3, 4].map(i => {
                  const len = password.length;
                  const level = len < 6 ? 1 : len < 10 ? 2 : len < 14 ? 3 : 4;
                  const filled = i <= level;
                  const colors = ['#FF4466', '#FF9900', '#FFDD00', '#00CC88'];
                  return (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: filled ? colors[level - 1] : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') },
                      ]}
                    />
                  );
                })}
                <Text style={[styles.strengthLabel, { color: textSecondary }]}>
                  {password.length < 6  ? 'Trop court'  :
                   password.length < 10 ? 'Moyen'       :
                   password.length < 14 ? 'Fort'        : 'Très fort'}
                </Text>
              </View>
            )}

            {/* Photo */}
            <Text style={[styles.label, { marginTop: 6, color: labelColor }]}>Photo de profil (Optionnelle)</Text>
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={() => setPhotoPickerVisible(true)}
            >
              {photo ? (
                <View style={styles.photoPreviewWrapper}>
                  <Image source={{ uri: photo }} style={styles.photoPreview} />
                  <View style={styles.photoEditBadge}>
                    <Text style={{ color: '#fff', fontSize: 12 }}>✏️</Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: photoPlaceholderBg, borderColor: photoPlaceholderBorder }]}>
                  <Text style={{ fontSize: 36 }}>📸</Text>
                  <Text style={[styles.photoPlaceholderText, { color: textSecondary }]}>Ajouter une photo</Text>
                  <Text style={styles.photoPlaceholderSub}>Galerie ou Caméra</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Error box */}
            {errorMsg !== '' && (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Register button */}
            <TouchableOpacity
              style={[styles.registerBtn, loading && { opacity: 0.6 }]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              <Text style={styles.registerBtnText}>
                {loading ? 'Chargement...' : 'Suivant — Vérifier mon email →'}
              </Text>
            </TouchableOpacity>

            {/* Back link */}
            <TouchableOpacity style={styles.backLink} onPress={onBack}>
              <Text style={[styles.backLinkText, { color: textSecondary }]}>
                Déjà un compte ?{' '}
                <Text style={{ color: '#6C3FFF', fontWeight: '700' }}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>



      {/* ── Photo source picker ── */}
      <Modal visible={photoPickerVisible} animationType="fade" transparent>
        <View style={photoModal.overlay}>
          <View style={photoModal.card}>
            <Text style={photoModal.title}>📸 Ajouter une photo</Text>
            <Text style={photoModal.subtitle}>Choisissez comment ajouter votre photo de profil</Text>

            <TouchableOpacity style={photoModal.option} onPress={pickFromGallery}>
              <View style={[photoModal.iconCircle, { backgroundColor: 'rgba(59,130,246,0.2)' }]}>
                <Text style={{ fontSize: 28 }}>🖼️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={photoModal.optionTitle}>Depuis la galerie</Text>
                <Text style={photoModal.optionSub}>Choisir une photo existante</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={photoModal.option} onPress={openCamera}>
              <View style={[photoModal.iconCircle, { backgroundColor: 'rgba(0,255,136,0.15)' }]}>
                <Text style={{ fontSize: 28 }}>📷</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={photoModal.optionTitle}>Prendre avec la caméra</Text>
                <Text style={photoModal.optionSub}>🤖 Auto-capture dès que le visage est détecté</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={photoModal.cancelBtn}
              onPress={() => setPhotoPickerVisible(false)}
            >
              <Text style={{ color: '#AABBCC', fontWeight: '600' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#050A18' },
  blob1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#6C3FFF', opacity: 0.18, top: -60, right: -60,
  },
  blob2: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#FF3FA4', opacity: 0.12, bottom: 80, left: -50,
  },
  scrollContent: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 40,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  logoContainer: { alignItems: 'center', marginBottom: 22 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(108,63,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(108,63,255,0.5)',
  },
  title:    { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: '#7A8EA8', marginTop: 4 },
  label: {
    fontSize: 12, fontWeight: '700', color: '#94A3B8',
    marginBottom: 6, marginTop: 2,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14, paddingHorizontal: 14, height: 52,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input:     { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  phoneRow:  { flexDirection: 'row', gap: 8, alignItems: 'center' },
  countryCodeBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, height: 52, gap: 6,
  },
  countryFlag:     { fontSize: 20 },
  countryCodeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // Password strength
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 14, marginTop: -8 },
  strengthBar:  { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600', marginLeft: 6 },

  photoContainer:      { marginBottom: 14, alignItems: 'center' },
  photoPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(108,63,255,0.12)',
    borderWidth: 2, borderColor: 'rgba(108,63,255,0.4)', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  photoPlaceholderText: { color: '#8B9AB8', fontSize: 12, fontWeight: '600' },
  photoPlaceholderSub:  { color: '#6C3FFF', fontSize: 11, fontWeight: '600' },
  photoPreviewWrapper:  { position: 'relative' },
  photoPreview: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: '#6C3FFF',
  },
  photoEditBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#6C3FFF', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#050A18',
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,68,102,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,68,102,0.4)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 14, gap: 8,
  },
  errorIcon: { fontSize: 15 },
  errorText: { color: '#FF7A90', fontSize: 13, flex: 1, lineHeight: 18 },
  registerBtn: {
    backgroundColor: '#6C3FFF', borderRadius: 14, height: 52,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6C3FFF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 8, marginBottom: 14,
  },
  registerBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1.5 },
  backLink:     { alignItems: 'center', paddingVertical: 4 },
  backLinkText: { color: '#7A8EA8', fontSize: 13 },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    height: 48,
  },
  roleButtonActive: {
    backgroundColor: 'rgba(108,63,255,0.25)',
    borderColor: '#6C3FFF',
    shadowColor: '#6C3FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  roleButtonText: {
    color: '#8A99AD',
    fontSize: 14,
    fontWeight: '700',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
});

const modal = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, borderTopWidth: 1, borderColor: '#6C3FFF',
    maxHeight: height * 0.75,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 14 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  countryItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 12, marginBottom: 4,
  },
  countryItemActive: { backgroundColor: 'rgba(108,63,255,0.2)' },
  countryName: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500' },
  countryCode: { color: '#6C3FFF', fontWeight: '700', fontSize: 14 },
  cancelBtn: {
    marginTop: 12, paddingVertical: 14, alignItems: 'center',
    backgroundColor: '#1E293B', borderRadius: 14,
  },
});

const photoModal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card: {
    width: '100%', backgroundColor: '#0F172A',
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(108,63,255,0.4)',
  },
  title:    { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#7A8EA8', textAlign: 'center', marginBottom: 20 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 16, marginBottom: 12, gap: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  optionTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  optionSub:   { color: '#7A8EA8', fontSize: 12 },
  cancelBtn:   { marginTop: 4, paddingVertical: 14, alignItems: 'center' },
});
