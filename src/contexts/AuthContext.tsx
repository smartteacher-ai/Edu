import React, { createContext, useContext, useEffect, useState } from 'react';
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
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  incrementUsage: () => Promise<boolean>;
  canGenerate: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  logActivity: (action: string, metadata?: Record<string, any>) => Promise<void>;
}

const defaultProfile: UserProfile = {
  email: 'local@user.com',
  displayName: 'Local User',
  photoURL: '',
  plan: 'pro',
  usageCount: 0,
  lastUsageDate: format(new Date(), 'yyyy-MM-dd'),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  emailVerified: true
};

const AuthContext = createContext<AuthContextType>({
  user: { uid: 'local_user' },
  profile: defaultProfile,
  loading: false,
  incrementUsage: async () => true,
  canGenerate: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  logActivity: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  return (
    <AuthContext.Provider value={{ 
      user: { uid: 'local_user' }, 
      profile, 
      loading: false, 
      incrementUsage: async () => true, 
      canGenerate: true, 
      signInWithGoogle: async () => {}, 
      logout: async () => {}, 
      logActivity: async () => {} 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
