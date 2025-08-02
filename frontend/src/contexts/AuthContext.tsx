import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isOnboardingComplete: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const signUp = async (email: string, password: string, name?: string) => {
    setIsSigningUp(true);
    
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with name if provided
      if (name && user) {
        await updateProfile(user, {
          displayName: name
        });
      }
      
      // Mark new user as needing onboarding
      setIsOnboardingComplete(false);
      localStorage.removeItem('onboarding_completed');
    } finally {
      setIsSigningUp(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if this is a new user (account was just created)
    const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
    
    if (isNewUser) {
      // Delete the automatically created account and throw error
      await user.delete();
      throw new Error('USER_NEEDS_SIGNUP');
    }
  };

  const signUpWithGoogle = async () => {
    setIsSigningUp(true);
    
    try {
      await signInWithPopup(auth, googleProvider);
      
      // Mark new Google user as needing onboarding
      setIsOnboardingComplete(false);
      localStorage.removeItem('onboarding_completed');
    } finally {
      setIsSigningUp(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setIsOnboardingComplete(false);
    localStorage.removeItem('onboarding_completed');
  };

  const completeOnboarding = () => {
    setIsOnboardingComplete(true);
    localStorage.setItem('onboarding_completed', 'true');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Check onboarding completion status
      if (user) {
        // If user is in the middle of signing up, don't check localStorage
        // The signup functions will handle setting the onboarding state
        if (!isSigningUp) {
          const onboardingCompleted = localStorage.getItem('onboarding_completed') === 'true';
          setIsOnboardingComplete(onboardingCompleted);
        }
      } else {
        setIsOnboardingComplete(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [isSigningUp]);

  const value: AuthContextType = {
    currentUser,
    loading,
    isOnboardingComplete,
    signUp,
    signIn,
    signInWithGoogle,
    signUpWithGoogle,
    logout,
    completeOnboarding
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
