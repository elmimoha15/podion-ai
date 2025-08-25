import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EmailVerification } from '../components/EmailVerification';
import { useAuth } from '../hooks/useAuth';

export const EmailVerificationPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from location state or user object
  const email = location.state?.email || user?.email || '';

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    // If no email available, redirect to profile setup
    if (!loading && user && !email) {
      navigate('/onboarding');
      return;
    }
  }, [user, loading, email, navigate]);

  const handleVerificationComplete = () => {
    // Check if we came from onboarding
    const fromOnboarding = location.state?.fromOnboarding;
    
    if (fromOnboarding) {
      // Continue to onboarding flow
      navigate('/onboarding', { state: { emailVerified: true } });
    } else {
      // Go to dashboard
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    // Allow skipping verification but mark as unverified
    const fromOnboarding = location.state?.fromOnboarding;
    
    if (fromOnboarding) {
      navigate('/onboarding', { state: { emailSkipped: true } });
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !email) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Verify Your Email
          </h1>
          <p className="mt-2 text-gray-600">
            Complete your account setup with email verification
          </p>
        </div>

        <EmailVerification
          email={email}
          onVerificationComplete={handleVerificationComplete}
          onSkip={handleSkip}
          showSkipOption={true}
        />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Contact{' '}
            <a href="mailto:support@podion.ai" className="text-blue-600 hover:text-blue-700">
              support@podion.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
