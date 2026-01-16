// Los matchers de Jest para React Native están incluidos en @testing-library/react-native v12.4+
// Nota: import/require removido temporalmente por conflictos con jest-expo setup
// require('@testing-library/react-native/extend-expect')

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
  Stack: 'Stack',
}))

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: -3.99313,
        longitude: -79.20422,
        altitude: 0,
        accuracy: 10,
        heading: 0,
        speed: 0,
      },
    })
  ),
  watchPositionAsync: jest.fn(),
}))

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}))

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
}))

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native')
  return {
    __esModule: true,
    default: View,
    Marker: View,
    Polyline: View,
    Circle: View,
  }
})

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}))

// Mock Firebase Performance
jest.mock('@react-native-firebase/perf', () => {
  const mockTrace = {
    putAttribute: jest.fn(),
    putMetric: jest.fn(),
    stop: jest.fn(() => Promise.resolve()),
  };

  const mockHttpMetric = {
    setHttpResponseCode: jest.fn(),
    setResponseContentType: jest.fn(),
    setResponsePayloadSize: jest.fn(),
    setRequestPayloadSize: jest.fn(),
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
  };

  return jest.fn(() => ({
    startTrace: jest.fn(() => Promise.resolve(mockTrace)),
    newHttpMetric: jest.fn(() => Promise.resolve(mockHttpMetric)),
    setPerformanceCollectionEnabled: jest.fn(() => Promise.resolve()),
    isPerformanceCollectionEnabled: jest.fn(() => Promise.resolve(true)),
  }));
});

// Mock Firebase Crashlytics
jest.mock('@react-native-firebase/crashlytics', () => jest.fn(() => ({
  crash: jest.fn(),
  log: jest.fn(),
  recordError: jest.fn(),
  setUserId: jest.fn(() => Promise.resolve()),
  setAttribute: jest.fn(() => Promise.resolve()),
  setAttributes: jest.fn(() => Promise.resolve()),
  setCrashlyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
  isCrashlyticsCollectionEnabled: jest.fn(() => Promise.resolve(true)),
  checkForUnsentReports: jest.fn(() => Promise.resolve(false)),
  sendUnsentReports: jest.fn(() => Promise.resolve()),
  deleteUnsentReports: jest.fn(() => Promise.resolve()),
})))

// Suppress specific warnings
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
