import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { format } from 'date-fns';

export interface UserProfile {
  email: string;
  displayName: string;
  photoURL: string;
  plan: 'free' | 'pro' | 'team';
  usageCount: number;
  lastUsageDate: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  incrementUsage: () => Promise<boolean>;
  canGenerate: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  logActivity: (action: string, metadata?: Record<string, any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  incrementUsage: async () => false,
  canGenerate: false,
  signInWithGoogle: async () => {},
  logout: async () => {},
  logActivity: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Setup realtime listener for profile
        const unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (!docSnap.exists()) {
            const newProfile: UserProfile = {
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              plan: 'free',
              usageCount: 0,
              lastUsageDate: format(new Date(), 'yyyy-MM-dd'),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              emailVerified: firebaseUser.emailVerified
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(docSnap.data() as UserProfile);
          }
        });
        
        setLoading(false);
        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const logActivity = async (action: string, metadata: Record<string, any> = {}) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'activity_logs'), {
        userId: user.uid,
        action,
        metadata,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to log activity', e);
    }
  };

  const incrementUsage = async (): Promise<boolean> => {
    if (!user || !profile) return false;
    
    // Pro members have no limits
    if (profile.plan === 'pro' || profile.plan === 'team') return true;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const userRef = doc(db, 'users', user.uid);
    
    let newCount = profile.usageCount;
    if (profile.lastUsageDate !== today) {
      newCount = 1;
    } else {
      if (newCount >= 3) {
        return false; // Rate limit hit for free user
      }
      newCount++;
    }
    
    await setDoc(userRef, {
      usageCount: newCount,
      lastUsageDate: today,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return true;
  };

  const getCanGenerate = () => {
    if (!profile) return false;
    if (profile.plan === 'pro' || profile.plan === 'team') return true;
    const today = format(new Date(), 'yyyy-MM-dd');
    if (profile.lastUsageDate !== today) return true;
    return profile.usageCount < 3; // 3 generations for free tier
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        throw new Error('Login popup was closed before finishing. Please try again.');
      } else if (error?.code === 'auth/popup-blocked') {
        throw new Error('Your browser blocked the login popup. Please allow popups for this site.');
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, incrementUsage, canGenerate: getCanGenerate(), signInWithGoogle, logout, logActivity }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
