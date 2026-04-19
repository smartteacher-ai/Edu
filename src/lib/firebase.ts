import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, logEvent as trackAction } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  analyticsInstance = getAnalytics(app);
}
export const analytics = analyticsInstance;

// Analytics helper
export const logEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (analytics) {
    trackAction(analytics, eventName, eventParams);
  }
};

// Auth providers
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    logEvent('login', { method: 'google' });
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    logEvent('logout');
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
