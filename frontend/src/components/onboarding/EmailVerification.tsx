
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from 'sonner';
import { podcastApi } from '../../services/podcastApi';
import { useAuth } from '../../contexts/AuthContext';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
}

const EmailVerification = ({ email, onVerified }: EmailVerificationProps) => {
  const { currentUser } = useAuth();
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [emailSent, setEmailSent] = useState(false);
  const [step, setStep] = useState<'sending' | 'verify' | 'success'>('sending');

  // Countdown timer for resend
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Auto-send verification email when component mounts
  useEffect(() => {
    const initializeVerification = async () => {
      try {
        // Check if user already has a pending verification
        const status = await podcastApi.getVerificationStatus();
        if (status.verified) {
          setStep('success');
          onVerified();
          return;
        } else if (status.has_pending_verification) {
          setStep('verify');
          setEmailSent(true);
          setTimeLeft(300); // 5 minutes
          return;
        }
      } catch (error) {
        console.log('No existing verification status, sending new code');
      }
      
      // Send new verification code
      await sendVerificationCode();
    };
    
    initializeVerification();
  }, []);

  const sendVerificationCode = async () => {
    if (!currentUser) {
      toast.error('Please log in to continue');
      return;
    }

    setIsLoading(true);
    try {
      const result = await podcastApi.sendVerificationCode(
        email,
        currentUser.displayName || 'User'
      );

      if (result.success) {
        setStep('verify');
        setEmailSent(true);
        setTimeLeft(300); // 5 minutes countdown
        toast.success('Verification code sent! Check your email.');
      } else {
        toast.error(result.error || 'Failed to send verification code');
      }
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      
      if (error.message?.includes('429')) {
        toast.error('Please wait before requesting another code');
        setTimeLeft(300);
      } else {
        toast.error('Failed to send verification code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      toast.error('Verification code must be 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const result = await podcastApi.verifyCode(verificationCode);
      
      if (result.success) {
        setStep('success');
        toast.success('Email verified successfully!');
        if (result.welcome_email_sent) {
          toast.success('Welcome email sent!');
        }
        onVerified();
      } else {
        if (result.error?.includes('expired')) {
          toast.error('Verification code has expired. Please request a new one.');
          setEmailSent(false);
          setStep('sending');
        } else if (result.error?.includes('invalid')) {
          toast.error('Invalid verification code. Please try again.');
          setAttemptsLeft(prev => Math.max(0, prev - 1));
        } else {
          toast.error(result.error || 'Verification failed');
        }
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast.error('Verification failed. Please try again.');
      setAttemptsLeft(prev => Math.max(0, prev - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) {
      toast.error(`Please wait ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} before requesting another code`);
      return;
    }

    setIsResending(true);
    try {
      const result = await podcastApi.resendVerificationCode();
      
      if (result.success) {
        setTimeLeft(300); // 5 minutes
        setAttemptsLeft(3); // Reset attempts
        toast.success('New verification code sent!');
      } else {
        toast.error(result.error || 'Failed to resend code');
      }
    } catch (error: any) {
      console.error('Error resending code:', error);
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto">
          {step === 'success' ? (
            <CheckCircle className="h-6 w-6 text-white" />
          ) : step === 'sending' ? (
            <RefreshCw className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Mail className="h-6 w-6 text-white" />
          )}
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">
            {step === 'success' ? 'Email Verified!' : 
             step === 'sending' ? 'Sending verification code...' : 
             'Verify your email'}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {step === 'success' ? (
              'Your email has been successfully verified!'
            ) : step === 'sending' ? (
              `Sending verification code to ${email}...`
            ) : (
              <>We've sent a verification code to <strong>{email}</strong></>
            )}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {step !== 'success' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="h-11 text-center text-lg tracking-widest"
                maxLength={6}
                disabled={step === 'sending'}
              />
              {attemptsLeft < 3 && (
                <p className="text-sm text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {attemptsLeft} attempts remaining
                </p>
              )}
            </div>

            <Button 
              onClick={handleVerify}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              disabled={isLoading || verificationCode.length !== 6 || step === 'sending'}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Verify Email
                </div>
              )}
            </Button>

            {step === 'verify' && (
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {timeLeft > 0 ? (
                    `Resend available in ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
                  ) : (
                    'You can request a new code'
                  )}
                </div>
                <div>
                  <span className="text-sm text-gray-600">Didn't receive the code? </span>
                  <Button
                    variant="link"
                    className="p-0 text-sm text-blue-600 hover:text-blue-800"
                    onClick={handleResend}
                    disabled={isResending || timeLeft > 0}
                  >
                    {isResending ? "Sending..." : "Resend"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        
        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="text-green-600 font-medium">
              ✓ Email verification complete!
            </div>
            <p className="text-sm text-gray-600">
              You can now continue with the onboarding process.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailVerification;
