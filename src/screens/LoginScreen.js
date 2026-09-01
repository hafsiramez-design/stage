import React, { useState, useRef, useEffect } from 'react';
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
  Modal,
  ActivityIndicator,
} from 'react-native';

import { getUserByEmail, updateUserPassword } from '../database/db';
import ImageCaptcha from '../components/ImageCaptcha';
import { sendOtpEmail } from '../services/emailService';

const { width } = Dimensions.get('window');

// ── Design Tokens ────────────────────────────────────────────────
const ACCENT       = '#8B5CF6';
const CYAN         = '#06B6D4';
const DANGER       = '#FF3D71';
const SUCCESS      = '#10B981';

const BG_DARK      = '#0B071E';
const BG_LIGHT     = '#F5F3FF';

const SURFACE_DARK = '#150D32';
const SURFACE_LIGHT = '#FFFFFF';

const TEXT_PRI_DARK  = '#F8FAFC';
const TEXT_PRI_LIGHT = '#0F172A';

const TEXT_SEC_DARK  = '#A78BFA';
const TEXT_SEC_LIGHT = '#475569';

const BORDER_DARK  = 'rgba(139,92,246,0.2)';
const BORDER_LIGHT = '#E0E7FF';
// ─────────────────────────────────────────────────────────────────

// ── Forgot Password Modal ────────────────────────────────────────
// Steps:  'email' → 'otp' → 'newpass' → done (closes)
function ForgotPasswordModal({ visible, onClose, isDark }) {
  const [step, setStep]                     = useState('email');
  const [fpEmail, setFpEmail]               = useState('');
  const [fpOtp, setFpOtp]                   = useState('');
  const [fpOtpRef, setFpOtpRef]             = useState('');
  const [fpNewPass, setFpNewPass]           = useState('');
  const [fpConfirmPass, setFpConfirmPass]   = useState('');
  const [fpLoading, setFpLoading]           = useState(false);
  const [fpError, setFpError]               = useState('');
  const [fpSuccess, setFpSuccess]           = useState('');
  const [showNewPass, setShowNewPass]       = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('email');
      setFpEmail(''); setFpOtp(''); setFpOtpRef('');
      setFpNewPass(''); setFpConfirmPass('');
      setFpError(''); setFpSuccess('');
      setFpLoading(false);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 50, useNativeDriver: true }),
        Animated.timing(opacAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(60);
      opacAnim.setValue(0);
    }
  }, [visible]);

  const bg      = isDark ? SURFACE_DARK : SURFACE_LIGHT;
  const textPri = isDark ? TEXT_PRI_DARK : TEXT_PRI_LIGHT;
  const textSec = isDark ? TEXT_SEC_DARK : TEXT_SEC_LIGHT;
  const inputBg = isDark ? 'rgba(139,92,246,0.08)' : '#F5F3FF';
  const inputBd = isDark ? 'rgba(139,92,246,0.25)' : '#E0E7FF';

  // ── Step 1: Send OTP to email ────────────────────────────────
  const handleSendOtp = async () => {
    setFpError('');
    if (!fpEmail.trim() || !fpEmail.includes('@')) {
      return setFpError("Veuillez saisir une adresse email valide.");
    }
    // Check if user exists
    const user = await getUserByEmail(fpEmail.trim().toLowerCase());
    if (!user) {
      return setFpError("Aucun compte trouvé avec cet email.");
    }

    setFpLoading(true);
    try {
      const data = await sendOtpEmail(fpEmail.trim());
      setFpLoading(false);
      if (data.success) {
        setFpOtpRef(data.code || '');
        setStep('otp');
        setFpSuccess('Un code a été envoyé à votre email.');
      } else {
        setFpError("Erreur d'envoi d'email.");
      }
    } catch {
      setFpLoading(false);
      const fallback = String(Math.floor(100000 + Math.random() * 900000));
      setFpOtpRef(fallback);
      setStep('otp');
      setFpSuccess('Code généré (mode secours).');
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────
  const handleVerifyOtp = () => {
    setFpError('');
    if (!fpOtp.trim()) return setFpError("Veuillez entrer le code reçu.");
    if (fpOtp.trim() !== fpOtpRef) {
      return setFpError("Code incorrect. Vérifiez votre email.");
    }
    setFpSuccess('');
    setStep('newpass');
  };

  // ── Step 3: Update Password ──────────────────────────────────
  const handleUpdatePassword = async () => {
    setFpError('');
    if (!fpNewPass) return setFpError("Veuillez saisir un nouveau mot de passe.");
    if (fpNewPass.length < 6) return setFpError("Le mot de passe doit contenir au moins 6 caractères.");
    if (fpNewPass !== fpConfirmPass) return setFpError("Les mots de passe ne correspondent pas.");

    setFpLoading(true);
    const updated = await updateUserPassword(fpEmail.trim().toLowerCase(), fpNewPass);
    setFpLoading(false);

    if (updated) {
      setFpSuccess('✅ Mot de passe mis à jour avec succès !');
      setTimeout(() => { onClose(); }, 1600);
    } else {
      setFpError("Erreur lors de la mise à jour. Réessayez.");
    }
  };

  const stepTitles = { email: '🔐 Mot de passe oublié', otp: '📩 Vérification', newpass: '🔑 Nouveau mot de passe' };
  const stepSubtitles = {
    email: 'Entrez votre email pour recevoir un code de réinitialisation.',
    otp: `Un code à 6 chiffres a été envoyé à\n${fpEmail}`,
    newpass: 'Choisissez un nouveau mot de passe sécurisé.',
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.fpOverlay}>
          <Animated.View
            style={[
              styles.fpCard,
              {
                backgroundColor: bg,
                transform: [{ translateY: slideAnim }],
                opacity: opacAnim,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.fpHeader}>
              <View style={styles.fpHeaderIconWrap}>
                <Text style={styles.fpHeaderIcon}>
                  {step === 'email' ? '🔐' : step === 'otp' ? '📩' : '🔑'}
                </Text>
              </View>
              <TouchableOpacity style={styles.fpCloseBtn} onPress={onClose}>
                <Text style={{ color: textSec, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.fpTitle, { color: textPri }]}>{stepTitles[step]}</Text>
            <Text style={[styles.fpSubtitle, { color: textSec }]}>{stepSubtitles[step]}</Text>

            {/* Step progress dots */}
            <View style={styles.fpDots}>
              {['email', 'otp', 'newpass'].map((s, i) => (
                <View
                  key={s}
                  style={[
                    styles.fpDot,
                    {
                      backgroundColor: s === step ? ACCENT : (
                        (['email', 'otp', 'newpass'].indexOf(step) > i) ? SUCCESS : 'rgba(139,92,246,0.2)'
                      ),
                      width: s === step ? 20 : 8,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Error / Success messages */}
            {fpError !== '' && (
              <View style={styles.fpErrorBox}>
                <Text style={styles.fpErrorText}>⚠️  {fpError}</Text>
              </View>
            )}
            {fpSuccess !== '' && (
              <View style={styles.fpSuccessBox}>
                <Text style={styles.fpSuccessText}>{fpSuccess}</Text>
              </View>
            )}

            {/* ── STEP 1: Email Input ── */}
            {step === 'email' && (
              <>
                <View style={[styles.fpInputWrap, { backgroundColor: inputBg, borderColor: inputBd }]}>
                  <Text style={styles.fpInputIcon}>✉️</Text>
                  <TextInput
                    style={[styles.fpInput, { color: textPri }]}
                    placeholder="Adresse email"
                    placeholderTextColor={textSec}
                    value={fpEmail}
                    onChangeText={(t) => { setFpEmail(t); setFpError(''); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.fpPrimaryBtn, fpLoading && { opacity: 0.7 }]}
                  onPress={handleSendOtp}
                  disabled={fpLoading}
                >
                  {fpLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.fpPrimaryBtnText}>Envoyer le code →</Text>
                  }
                </TouchableOpacity>
              </>
            )}

            {/* ── STEP 2: OTP Input ── */}
            {step === 'otp' && (
              <>
                <View style={[styles.fpInputWrap, { backgroundColor: inputBg, borderColor: inputBd }]}>
                  <Text style={styles.fpInputIcon}>🔢</Text>
                  <TextInput
                    style={[styles.fpInput, { color: textPri, letterSpacing: 6, fontWeight: '800', fontSize: 20 }]}
                    placeholder="_ _ _ _ _ _"
                    placeholderTextColor={textSec}
                    value={fpOtp}
                    onChangeText={(t) => { setFpOtp(t.replace(/[^0-9]/g, '')); setFpError(''); }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity
                  style={styles.fpPrimaryBtn}
                  onPress={handleVerifyOtp}
                >
                  <Text style={styles.fpPrimaryBtnText}>Vérifier le code ✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fpSecondaryBtn}
                  onPress={() => { setStep('email'); setFpError(''); setFpSuccess(''); }}
                >
                  <Text style={[styles.fpSecondaryBtnText, { color: textSec }]}>← Changer d'email</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── STEP 3: New Password ── */}
            {step === 'newpass' && (
              <>
                <View style={[styles.fpInputWrap, { backgroundColor: inputBg, borderColor: inputBd }]}>
                  <Text style={styles.fpInputIcon}>🔒</Text>
                  <TextInput
                    style={[styles.fpInput, { color: textPri }]}
                    placeholder="Nouveau mot de passe"
                    placeholderTextColor={textSec}
                    value={fpNewPass}
                    onChangeText={(t) => { setFpNewPass(t); setFpError(''); }}
                    secureTextEntry={!showNewPass}
                  />
                  <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)}>
                    <Text style={{ fontSize: 18 }}>{showNewPass ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.fpInputWrap, { backgroundColor: inputBg, borderColor: inputBd }]}>
                  <Text style={styles.fpInputIcon}>🔐</Text>
                  <TextInput
                    style={[styles.fpInput, { color: textPri }]}
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor={textSec}
                    value={fpConfirmPass}
                    onChangeText={(t) => { setFpConfirmPass(t); setFpError(''); }}
                    secureTextEntry={!showConfirmPass}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
                    <Text style={{ fontSize: 18 }}>{showConfirmPass ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {fpNewPass.length > 0 && (
                  <View style={styles.fpStrengthBar}>
                    <View
                      style={[
                        styles.fpStrengthFill,
                        {
                          width: `${Math.min(100, fpNewPass.length * 12)}%`,
                          backgroundColor: fpNewPass.length < 6 ? DANGER : fpNewPass.length < 10 ? '#F59E0B' : SUCCESS,
                        },
                      ]}
                    />
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.fpPrimaryBtn, fpLoading && { opacity: 0.7 }]}
                  onPress={handleUpdatePassword}
                  disabled={fpLoading}
                >
                  {fpLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.fpPrimaryBtnText}>Mettre à jour le mot de passe ✓</Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────────
// Main LoginScreen
// ────────────────────────────────────────────────────────────────
export default function LoginScreen({ onLogin, onRegister, isDark = true, toggleTheme }) {
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [emailFocused, setEmailFocused]   = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');
  const [emailError, setEmailError]       = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [captchaError, setCaptchaError]   = useState(false);

  // ── Forgot password state ──────────────────────────────────
  const [wrongAttempts, setWrongAttempts]       = useState(0);
  const [showForgotModal, setShowForgotModal]   = useState(false);
  const forgotBtnScale = useRef(new Animated.Value(0)).current;

  const cardAnim    = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardAnim, {
        toValue: 0,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Show "Forgot Password" button after 1+ wrong attempt
  useEffect(() => {
    if (wrongAttempts >= 1) {
      Animated.spring(forgotBtnScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [wrongAttempts]);

  const showError = (msg) => {
    setErrorMsg(msg);
    errorOpacity.setValue(0);
    Animated.timing(errorOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    // Shake card
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setEmailError(false);
    setPasswordError(false);
    setErrorMsg('');

    const trimmedEmail    = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail && !trimmedPassword) {
      setEmailError(true);
      setPasswordError(true);
      showError('Veuillez saisir votre email et mot de passe.');
      return;
    }

    if (!trimmedEmail) {
      setEmailError(true);
      showError('Veuillez saisir votre adresse email.');
      return;
    }

    if (!trimmedPassword) {
      setPasswordError(true);
      showError('Veuillez saisir votre mot de passe.');
      return;
    }

    if (!captchaPassed) {
      setCaptchaError(true);
      showError('Veuillez compléter la vérification CAPTCHA.');
      return;
    }

    setLoading(true);
    try {
      const user = await getUserByEmail(trimmedEmail);

      if (!user) {
        setEmailError(true);
        setPasswordError(true);
        showError('Email ou mot de passe incorrect.');
        setWrongAttempts(prev => prev + 1);
        setLoading(false);
        return;
      }

      if (user.password !== trimmedPassword) {
        setPasswordError(true);
        showError('Email ou mot de passe incorrect.');
        setWrongAttempts(prev => prev + 1);
        setLoading(false);
        return;
      }

      if (user.status === 'closed') {
        showError('Votre compte a été clôturé. Vous ne pouvez plus vous connecter.');
        setLoading(false);
        return;
      }

      // ✅ Credentials and CAPTCHA correct — proceed
      Animated.sequence([
        Animated.spring(buttonScale, { toValue: 0.93, useNativeDriver: true, friction: 3 }),
        Animated.spring(buttonScale, { toValue: 1,    useNativeDriver: true, friction: 3 }),
      ]).start(() => {
        setLoading(false);
        onLogin(user);
      });
    } catch (e) {
      console.error('Login error:', e);
      showError("Une erreur s'est produite. Réessayez.");
      setLoading(false);
    }
  };

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.82, 1],
  });

  // ── Dynamic colours ──────────────────────────────────────────
  const bg          = isDark ? BG_DARK       : BG_LIGHT;
  const cardBg      = isDark ? SURFACE_DARK  : SURFACE_LIGHT;
  const cardBorder  = isDark ? BORDER_DARK   : BORDER_LIGHT;
  const textPrimary = isDark ? TEXT_PRI_DARK  : TEXT_PRI_LIGHT;
  const textSecond  = isDark ? TEXT_SEC_DARK  : TEXT_SEC_LIGHT;

  const inputBg     = isDark ? 'rgba(139,92,246,0.06)' : '#EEF3FF';
  const inputBorder = isDark ? 'rgba(139,92,246,0.2)'  : '#D4C5F9';
  // ─────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />

      {/* ── Forgot Password Modal ─────────────────────────────── */}
      <ForgotPasswordModal
        visible={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        isDark={isDark}
      />

      {/* ── Background blobs ─────────────────────────────────── */}
      <View
        style={[
          styles.blob1,
          {
            backgroundColor: ACCENT,
            opacity: isDark ? 0.18 : 0.10,
          },
        ]}
      />
      <View
        style={[
          styles.blob2,
          {
            backgroundColor: CYAN,
            opacity: isDark ? 0.12 : 0.07,
          },
        ]}
      />
      <View
        style={[
          styles.blob3,
          {
            backgroundColor: '#EC4899',
            opacity: isDark ? 0.10 : 0.05,
          },
        ]}
      />

      {/* ── Content ──────────────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                transform: [
                  { translateY: cardAnim },
                  { translateX: shakeAnim },
                ],
                opacity: opacityAnim,
              },
            ]}
          >
            {/* ── Logo area ─────────────────────────────────── */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>🌍</Text>
              </View>
              <Text style={[styles.appName, { color: textPrimary }]}>WorldEvents</Text>
              <Text style={[styles.tagline, { color: textSecond }]}>
                Discover events around the globe
              </Text>
            </View>

            {/* ── Email field ───────────────────────────────── */}
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: inputBg, borderColor: inputBorder },
                emailFocused && styles.inputWrapperFocused,
                emailError   && styles.inputWrapperError,
              ]}
            >
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="Adresse email"
                placeholderTextColor={textSecond}
                value={email}
                onChangeText={(t) => { setEmail(t); setEmailError(false); setErrorMsg(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* ── Password field ────────────────────────────── */}
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: inputBg, borderColor: inputBorder },
                passwordFocused && styles.inputWrapperFocused,
                passwordError   && styles.inputWrapperError,
              ]}
            >
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="Mot de passe"
                placeholderTextColor={textSecond}
                value={password}
                onChangeText={(t) => { setPassword(t); setPasswordError(false); setErrorMsg(''); }}
                secureTextEntry
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>

            {/* ── Image CAPTCHA ─────────────────────────────── */}
            <ImageCaptcha
              onVerified={() => {
                setCaptchaPassed(true);
                setCaptchaError(false);
                setErrorMsg('');
              }}
              onFailed={() => {
                setCaptchaPassed(false);
              }}
            />
            {captchaError && !captchaPassed && (
              <Text style={styles.captchaHint}>
                ⚠️ Veuillez d'abord compléter la vérification.
              </Text>
            )}

            {/* ── Inline error box ──────────────────────────── */}
            {errorMsg !== '' && (
              <Animated.View style={[styles.errorBox, { opacity: errorOpacity }]}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </Animated.View>
            )}

            {/* ── Forgot password button (appears after wrong attempt) ── */}
            {wrongAttempts >= 1 && (
              <Animated.View style={{ transform: [{ scale: forgotBtnScale }], marginBottom: 8 }}>
                <TouchableOpacity
                  style={styles.forgotBtn}
                  onPress={() => setShowForgotModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.forgotBtnText}>🔑 Mot de passe oublié ?</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* ── Login button ──────────────────────────────── */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonLoading]}
                onPress={handleLogin}
                activeOpacity={0.9}
                disabled={loading}
              >
                <Animated.Text style={[styles.loginButtonText, { opacity: shimmerOpacity }]}>
                  {loading ? 'Connexion…' : 'SE CONNECTER →'}
                </Animated.Text>
              </TouchableOpacity>
            </Animated.View>

            {/* ── Divider ───────────────────────────────────── */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(139,92,246,0.18)' : '#E0E7FF' }]} />
              <Text style={[styles.dividerText, { color: textSecond }]}>ou</Text>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(139,92,246,0.18)' : '#E0E7FF' }]} />
            </View>

            {/* ── Register button ───────────────────────────── */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                { backgroundColor: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.05)' },
              ]}
              onPress={onRegister}
              activeOpacity={0.85}
            >
              <Text style={styles.registerButtonText}>✨ S'inscrire</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Blobs ────────────────────────────────────────────────────
  blob1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -90,
    left: -90,
  },
  blob2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: 60,
    right: -70,
  },
  blob3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: '40%',
    right: -60,
  },

  // ── Layout ───────────────────────────────────────────────────
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingBottom: 56,
  },

  // ── Card ─────────────────────────────────────────────────────
  card: {
    width: Math.min(width * 0.92, 480),
    borderRadius: 28,
    padding: 28,
    borderWidth: 1.5,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 12,
  },

  // ── Logo ─────────────────────────────────────────────────────
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#8B5CF633',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  logoText: {
    fontSize: 36,
  },
  appName: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: 13,
    marginTop: 5,
    letterSpacing: 0.4,
    fontWeight: '500',
  },

  // ── Inputs ───────────────────────────────────────────────────
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  inputWrapperFocused: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(139,92,246,0.10)',
  },
  inputWrapperError: {
    borderColor: DANGER,
    backgroundColor: 'rgba(255,61,113,0.07)',
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },

  // ── CAPTCHA hint ─────────────────────────────────────────────
  captchaHint: {
    color: '#FF6B93',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },

  // ── Error box ────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,61,113,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,61,113,0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
    gap: 8,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    color: '#FF6B93',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },

  // ── Forgot Password Button ────────────────────────────────────
  forgotBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    marginBottom: 4,
  },
  forgotBtnText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Login button ─────────────────────────────────────────────
  loginButton: {
    backgroundColor: ACCENT,
    borderRadius: 15,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 9,
  },
  loginButtonLoading: {
    backgroundColor: '#7C3AED',
    shadowOpacity: 0.25,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },

  // ── Divider ──────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Register button ──────────────────────────────────────────
  registerButton: {
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.4)',
  },
  registerButtonText: {
    color: ACCENT,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── Forgot Password Modal styles ─────────────────────────────
  fpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,7,30,0.88)',
    justifyContent: 'flex-end',
  },
  fpCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(139,92,246,0.4)',
    maxHeight: '90%',
  },
  fpHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  fpHeaderIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fpHeaderIcon: {
    fontSize: 28,
  },
  fpCloseBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
  },
  fpTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  fpSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  fpDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  fpDot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s',
  },
  fpErrorBox: {
    backgroundColor: 'rgba(255,61,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,61,113,0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  fpErrorText: {
    color: '#FF6B93',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  fpSuccessBox: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  fpSuccessText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  fpInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  fpInputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  fpInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  fpPrimaryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 10,
  },
  fpPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fpSecondaryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  fpSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fpStrengthBar: {
    height: 4,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  fpStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
});
