import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const WELCOME_TEXT = 'Welcome!';

export default function WelcomeScreen({ onFinish }) {
  const letters = WELCOME_TEXT.split('');
  const letterAnims = useRef(letters.map(() => new Animated.Value(0))).current;
  const mainOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslate = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;
  const orb3 = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Orb floating animations
    const floatOrb = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 2000 + delay, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 2000 + delay, useNativeDriver: true }),
        ])
      ).start();

    floatOrb(orb1, 0);
    floatOrb(orb2, 400);
    floatOrb(orb3, 800);

    // Main reveal
    Animated.sequence([
      Animated.timing(mainOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.stagger(
        60,
        letterAnims.map((anim) =>
          Animated.spring(anim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true })
        )
      ),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(subtitleTranslate, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();

      // Exit after 2.5 seconds
      setTimeout(() => {
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start(() => onFinish());
      }, 2200);
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: exitOpacity }]}>
      <StatusBar barStyle="light-content" />

      {/* Floating orbs */}
      <Animated.View style={[styles.orb, styles.orb1, {
        transform: [{ translateY: orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }],
      }]} />
      <Animated.View style={[styles.orb, styles.orb2, {
        transform: [{ translateY: orb2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) }],
      }]} />
      <Animated.View style={[styles.orb, styles.orb3, {
        transform: [{ translateY: orb3.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) }],
      }]} />

      <Animated.View style={[styles.content, { opacity: mainOpacity, transform: [{ scale: scaleAnim }] }]}>
        {/* Globe icon */}
        <View style={styles.globeContainer}>
          <Text style={styles.globe}>🌍</Text>
        </View>

        {/* Staggered letters */}
        <View style={styles.lettersContainer}>
          {letters.map((letter, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.letter,
                letter === ' ' && { width: 12 },
                {
                  opacity: letterAnims[i],
                  transform: [
                    {
                      translateY: letterAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                    {
                      scale: letterAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslate }],
            },
          ]}
        >
          Your global events passport 🌐
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050A18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 280,
    height: 280,
    backgroundColor: '#6C3FFF',
    opacity: 0.2,
    top: -80,
    left: -80,
  },
  orb2: {
    width: 220,
    height: 220,
    backgroundColor: '#FF3FA4',
    opacity: 0.18,
    bottom: 80,
    right: -60,
  },
  orb3: {
    width: 160,
    height: 160,
    backgroundColor: '#3FDFFF',
    opacity: 0.15,
    top: height * 0.3,
    left: 30,
  },
  content: {
    alignItems: 'center',
  },
  globeContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(108,63,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(108,63,255,0.5)',
  },
  globe: {
    fontSize: 48,
  },
  lettersContainer: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  letter: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: '#6C3FFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#7A9ABF',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
