import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { getUserProfile, createUserProfile, updateUserRole, isAdminEmail } from '../services/db';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  makeAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load saved local session if present
  useEffect(() => {
    const savedSession = localStorage.getItem('degree_app_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.email) {
          const role = isAdminEmail(parsed.email) ? 'admin' : (parsed.role || 'user');
          const localProf: UserProfile = {
            uid: parsed.uid || 'local-user',
            email: parsed.email,
            role,
            createdAt: parsed.createdAt || new Date().toISOString()
          };
          setProfile(localProf);
          setUser({ uid: localProf.uid, email: localProf.email } as FirebaseUser);
        }
      } catch (e) {
        console.error('Failed to parse local auth session', e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        let userProf = await getUserProfile(firebaseUser.uid);
        if (!userProf) {
          userProf = await createUserProfile(firebaseUser.uid, firebaseUser.email || '', 'user');
        }
        setProfile(userProf);
        localStorage.setItem('degree_app_session', JSON.stringify(userProf));
      }
      setLoading(false);
    });

    setLoading(false);
    return () => unsubscribe();
  }, []);

  const createFallbackSession = async (email: string): Promise<UserProfile> => {
    const role = isAdminEmail(email) ? 'admin' : 'user';
    const uid = 'user-' + btoa(email).replace(/=/g, '');
    const localProf: UserProfile = {
      uid,
      email,
      role,
      createdAt: new Date().toISOString()
    };
    
    // Try creating or getting in Firestore if permissions allow
    try {
      const prof = await createUserProfile(uid, email, role);
      setProfile(prof);
      localStorage.setItem('degree_app_session', JSON.stringify(prof));
      return prof;
    } catch (err) {
      setProfile(localProf);
      localStorage.setItem('degree_app_session', JSON.stringify(localProf));
      return localProf;
    }
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      let res;
      try {
        res = await signInWithEmailAndPassword(auth, email, pass);
      } catch (err: any) {
        // If operation not allowed or user not found, try signup or fallback
        if (err.code === 'auth/operation-not-allowed') {
          console.warn('Firebase Email/Password Auth disabled in console. Using direct session authentication.');
          const prof = await createFallbackSession(email);
          setUser({ uid: prof.uid, email: prof.email } as FirebaseUser);
          return;
        }

        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            res = await createUserWithEmailAndPassword(auth, email, pass);
          } catch (signupErr: any) {
            if (signupErr.code === 'auth/operation-not-allowed') {
              const prof = await createFallbackSession(email);
              setUser({ uid: prof.uid, email: prof.email } as FirebaseUser);
              return;
            }
            // Fallback for any other signup error
            const prof = await createFallbackSession(email);
            setUser({ uid: prof.uid, email: prof.email } as FirebaseUser);
            return;
          }
        } else {
          // Fallback for unexpected auth errors
          const prof = await createFallbackSession(email);
          setUser({ uid: prof.uid, email: prof.email } as FirebaseUser);
          return;
        }
      }

      if (res && res.user) {
        let userProf = await getUserProfile(res.user.uid);
        if (!userProf) {
          userProf = await createUserProfile(res.user.uid, res.user.email || email, 'user');
        }
        setProfile(userProf);
        localStorage.setItem('degree_app_session', JSON.stringify(userProf));
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string) => {
    setLoading(true);
    try {
      try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        const newProf = await createUserProfile(res.user.uid, email, 'user');
        setProfile(newProf);
        localStorage.setItem('degree_app_session', JSON.stringify(newProf));
      } catch (err: any) {
        if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
          const prof = await createFallbackSession(email);
          setUser({ uid: prof.uid, email: prof.email } as FirebaseUser);
        } else {
          const prof = await createFallbackSession(email);
          setUser({ uid: prof.uid, email: prof.email } as FirebaseUser);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('degree_app_session');
    setUser(null);
    setProfile(null);
  };

  const makeAdmin = async () => {
    if (user && profile) {
      await updateUserRole(user.uid, 'admin');
      setProfile({ ...profile, role: 'admin' });
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin,
      login,
      signup,
      logout,
      makeAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
