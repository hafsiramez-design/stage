import { Platform } from 'react-native';

// Local PC server
export const LOCAL_SERVER = 'http://localhost:3000';

// Cloud server — works on ANY network (4G, 5G, any Wi-Fi worldwide)
export const CLOUD_SERVER = 'https://world-events-backend-ji93.onrender.com';

// false = use Cloud (works everywhere), true = use local PC only
export const USE_LOCAL_SERVER = true;

export const SERVER_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : (USE_LOCAL_SERVER ? LOCAL_SERVER : CLOUD_SERVER);

