import React, { useState, useEffect } from 'react';
import { Mail, Shield, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { podcastApi } from '../services/podcastApi';
import { useAuth } from '../hooks/useAuth';

interface EmailVerificationProps {
  email: string;
  onVerificationComplete?: () => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onVerificationComplete,
  onSkip,
  showSkipOption = false
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'send' | 'verify' | 'success'>('send');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [verificationSent, setVerificationSent] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Check verification status on mount and auto-send for new users
  useEffect(() => {
    const initializeVerification = async () => {
      try {
        const status = await podcastApi.getVerificationStatus();
        if (status.verified) {
          setStep('success');
        } else if (status.has_pending_verification) {
          setStep('verify');
          setVerificationSent(true);
        } else {
          // No pending verification, automatically send code for new user
          await sendVerificationCode();
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        // If status check fails, try to send verification code anyway
        await sendVerificationCode();
      }
    };
    
    initializeVerification();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const status = await podcastApi.getVerificationStatus();
      if (status.verified) {
        setStep('success');
      } else if (status.has_pending_verification) {
        setStep('verify');
        setVerificationSent(true);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const sendVerificationCode = async () => {
    if (!user) {
      toast.error('Please log in to continue');
      return;
    }

    setLoading(true);
    try {
      const result = await podcastApi.sendVerificationCode(
        email,
        user.displayName || 'User'
      );

      if (result.success) {
        setStep('verify');
        setVerificationSent(true);
        setTimeLeft(300); // 5 minutes countdown
        toast.success('Verification code sent! Check your email.');
      }
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      
      if (error.message.includes('429')) {
        toast.error('Please wait before requesting another code');
        setTimeLeft(300); // 5 minutes
      } else {
        toast.error('Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const result = await podcastApi.verifyCode(code);

      if (result.success) {
        setStep('success');
        toast.success('Email verified successfully! 🎉');
        
        if (result.welcome_email_sent) {
          toast.success('Welcome email sent to your inbox!');
        }

        // Call completion callback after a short delay
        setTimeout(() => {
          onVerificationComplete?.();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      
      if (error.message.includes('410')) {
        toast.error('Verification code has expired. Please request a new one.');
        setStep('send');
        setVerificationSent(false);
      } else if (error.message.includes('429')) {
        toast.error('Too many attempts. Please request a new code.');
        setStep('send');
        setVerificationSent(false);
      } else if (error.message.includes('attempts remaining')) {
        const remaining = error.message.match(/(\d+) attempts remaining/)?.[1];
        setAttemptsLeft(parseInt(remaining || '0'));
        toast.error(`Invalid code. ${remaining} attempts remaining.`);
      } else {
        toast.error('Invalid verification code. Please try again.');
      }
      
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setResendLoading(true);
    try {
      const result = await podcastApi.resendVerificationCode();

      if (result.success) {
        setTimeLeft(300); // 5 minutes countdown
        setAttemptsLeft(3); // Reset attempts
        toast.success('New verification code sent!');
      }
    } catch (error: any) {
      console.error('Error resending code:', error);
      
      if (error.message.includes('429')) {
        toast.error('Please wait before requesting another code');
        setTimeLeft(300);
      } else {
        toast.error('Failed to resend code. Please try again.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Email Verified! 🎉
        </h2>
        
        <p className="text-gray-600 mb-6">
          Your email has been successfully verified. You now have full access to Podion AI!
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 text-sm">
            ✅ Account verified<br/>
            📧 Welcome email sent<br/>
            🚀 Ready to create content
          </p>
        </div>

        <button
          onClick={onVerificationComplete}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Continue to Dashboard
        </button>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Enter Verification Code
          </h2>
          
          <p className="text-gray-600">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={6}
              autoComplete="one-time-code"
            />
          </div>

          {attemptsLeft < 3 && (
            <div className="flex items-center text-orange-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              {attemptsLeft} attempts remaining
            </div>
          )}

          <button
            onClick={verifyCode}
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          <div className="text-center">
            {timeLeft > 0 ? (
              <div className="flex items-center justify-center text-gray-500 text-sm">
                <Clock className="w-4 h-4 mr-2" />
                Resend available in {formatTime(timeLeft)}
              </div>
            ) : (
              <button
                onClick={resendCode}
                disabled={resendLoading}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center mx-auto"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Code
                  </>
                )}
              </button>
            )}
          </div>

          {showSkipOption && (
            <button
              onClick={onSkip}
              className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    );
  }

  // Send verification step
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verify Your Email
        </h2>
        
        <p className="text-gray-600">
          We'll send a verification code to <strong>{email}</strong> to confirm your account.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Why verify your email?</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>✅ Secure your account</li>
            <li>📧 Receive important notifications</li>
            <li>🔒 Enable password recovery</li>
            <li>🎉 Get your welcome email</li>
          </ul>
        </div>

        <button
          onClick={sendVerificationCode}
          disabled={loading || timeLeft > 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Sending Code...
            </>
          ) : timeLeft > 0 ? (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Wait {formatTime(timeLeft)}
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Send Verification Code
            </>
          )}
        </button>

        {showSkipOption && (
          <button
            onClick={onSkip}
            className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};
