import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Platform, SafeAreaView, Dimensions } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CountryEventsScreen from './src/screens/CountryEventsScreen';
import CategoryEventsScreen from './src/screens/CategoryEventsScreen';
import EventDetailsScreen from './src/screens/EventDetailsScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AdminScreen from './src/screens/AdminScreen';
import ProfileModal from './src/components/ProfileModal';
import { initDatabase } from './src/database/db';

const { width } = Dimensions.get('window');

export default function App() {
  const [screen, setScreen] = useState('login');
  const [prevScreen, setPrevScreen] = useState('dashboard');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);

  useEffect(() => {
    async function setupDb() {
      try {
        await initDatabase();
      } catch (err) {
        console.warn('Database init warning:', err);
      } finally {
        setIsDbReady(true);
      }
    }
    setupDb();
  }, []);

  if (!isDbReady) {
    return (
      <View style={[styles.root, { backgroundColor: isDark ? '#040D21' : '#F0F4FF', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 16 }}>Chargement de l'application...</Text>
      </View>
    );
  }

  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user && user.role === 'admin') {
      setScreen('admin');
    } else {
      setScreen('welcome');
    }
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setScreen('login');
  };

  const handleWelcomeFinish = () => setScreen('dashboard');
  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setPrevScreen(screen);
    setScreen('country');
  };
  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setPrevScreen(screen);
    setScreen('category');
  };
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setPrevScreen(screen);
    setScreen('event_details');
  };
  const handleBack = () => setScreen(prevScreen || 'dashboard');

  const bg = isDark ? '#060B1E' : '#F4F7FF';
  const cardBg = isDark ? '#0A132C' : '#FFFFFF';
  const borderCol = isDark ? 'rgba(99,102,241,0.18)' : '#E0E7FF';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#818CF8' : '#475569';
  const accent = '#6366F1';

  const showNav = currentUser && !['login', 'register', 'welcome'].includes(screen);

  return (
    <View style={[styles.outerContainer, { backgroundColor: bg }]}>
      <View style={[styles.appShell, { backgroundColor: bg }]}>
        
        {/* Top Navbar Header */}
        {showNav && (
          <View style={[styles.navHeader, { backgroundColor: isDark ? 'rgba(10,19,44,0.95)' : 'rgba(255,255,255,0.95)', borderBottomColor: borderCol }]}>
            <TouchableOpacity style={styles.brandRow} onPress={() => setScreen('dashboard')}>
              <View style={styles.brandIconWrap}>
                <Text style={{ fontSize: 20 }}>🌍</Text>
              </View>
              <Text style={[styles.brandTitle, { color: textPrimary }]}>WorldEvents</Text>
            </TouchableOpacity>

            <View style={styles.navActions}>
              <TouchableOpacity 
                style={[styles.navThemeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} 
                onPress={toggleTheme}
              >
                <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.navProfileBtn, { borderColor: accent }]} 
                onPress={() => setIsProfileModalVisible(true)}
              >
                {currentUser?.photo ? (
                  <Image source={{ uri: currentUser.photo }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: accent + '22' }]}>
                    <Text style={{ fontSize: 16 }}>👤</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ProfileModal 
          visible={isProfileModalVisible} 
          user={currentUser} 
          isDark={isDark} 
          onClose={() => setIsProfileModalVisible(false)} 
          onProfileUpdated={(updatedUser) => setCurrentUser(updatedUser)} 
        />

        {/* Screen Content */}
        <View style={styles.screenContainer}>
          {screen === 'login' && (
            <LoginScreen
              onLogin={handleLogin}
              onRegister={() => setScreen('register')}
              isDark={isDark}
            />
          )}
          {screen === 'register' && (
            <RegisterScreen
              onBack={() => setScreen('login')}
              onRegistered={() => setScreen('login')}
              isDark={isDark}
            />
          )}
          {screen === 'welcome' && <WelcomeScreen onFinish={handleWelcomeFinish} isDark={isDark} />}
          {screen === 'dashboard' && (
            <DashboardScreen
              currentUser={currentUser}
              onSelectCountry={handleSelectCountry}
              onSelectCategory={handleSelectCategory}
              onLogout={handleLogout}
              isDark={isDark}
              toggleTheme={toggleTheme}
            />
          )}
          {screen === 'country' && selectedCountry && (
            <CountryEventsScreen
              country={selectedCountry}
              currentUser={currentUser}
              onBack={handleBack}
              onSelectEvent={handleSelectEvent}
              isDark={isDark}
            />
          )}
          {screen === 'category' && selectedCategory && (
            <CategoryEventsScreen
              category={selectedCategory}
              currentUser={currentUser}
              onSelectEvent={handleSelectEvent}
              onBack={handleBack}
              isDark={isDark}
              toggleTheme={toggleTheme}
            />
          )}
          {screen === 'event_details' && selectedEvent && (
            <EventDetailsScreen
              event={selectedEvent}
              currentUser={currentUser}
              onBack={handleBack}
              isDark={isDark}
              toggleTheme={toggleTheme}
            />
          )}
          {screen === 'admin' && (
            <AdminScreen
              currentUser={currentUser}
              onSelectCountry={handleSelectCountry}
              onLogout={handleLogout}
              isDark={isDark}
              toggleTheme={toggleTheme}
            />
          )}
        </View>

        {/* Bottom Tab Bar (Mobile/App Navigation Template) */}
        {showNav && (
          <View style={[styles.bottomTabBar, { backgroundColor: isDark ? '#0A1628' : '#FFFFFF', borderTopColor: borderCol }]}>
            <TouchableOpacity 
              style={styles.tabItem} 
              onPress={() => setScreen(currentUser?.role === 'admin' ? 'admin' : 'dashboard')}
            >
              <Text style={[styles.tabIcon, (screen === 'dashboard' || screen === 'admin') && styles.tabActiveIcon]}>🏠</Text>
              <Text style={[styles.tabLabel, { color: (screen === 'dashboard' || screen === 'admin') ? accent : textSecondary }]}>Accueil</Text>
            </TouchableOpacity>

            {currentUser.role === 'admin' ? (
              <TouchableOpacity 
                style={styles.tabItem} 
                onPress={() => setScreen('admin')}
              >
                <Text style={[styles.tabIcon, screen === 'admin' && styles.tabActiveIcon]}>⚡</Text>
                <Text style={[styles.tabLabel, { color: screen === 'admin' ? accent : textSecondary }]}>Admin</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.tabItem} 
                onPress={() => setIsProfileModalVisible(true)}
              >
                <Text style={styles.tabIcon}>👤</Text>
                <Text style={[styles.tabLabel, { color: textSecondary }]}>Mon Profil</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.tabItem} 
              onPress={handleLogout}
            >
              <Text style={styles.tabIcon}>🚪</Text>
              <Text style={[styles.tabLabel, { color: '#FF3D71' }]}>Quitter</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  screenContainer: {
    flex: 1,
  },
  navHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    zIndex: 1000,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(91,94,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navThemeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomTabBar: {
    paddingBottom: Platform.OS === 'ios' ? 16 : Platform.OS === 'android' ? 12 : 0,
    height: Platform.OS === 'android' ? 68 : 60,
    flexDirection: 'row',
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    flex: 1,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabActiveIcon: {
    transform: [{ scale: 1.15 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
