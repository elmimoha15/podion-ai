
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle } from "lucide-react";

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
}

const EmailVerification = ({ email, onVerified }: EmailVerificationProps) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    // Simulate verification
    setTimeout(() => {
      console.log("Email verified with code:", verificationCode);
      setIsLoading(false);
      onVerified();
    }, 1500);
  };

  const handleResend = async () => {
    setIsResending(true);
    // Simulate resending
    setTimeout(() => {
      console.log("Verification code resent to:", email);
      setIsResending(false);
    }, 1000);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto">
          <Mail className="h-6 w-6 text-white" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
          <p className="text-gray-600 mt-2">
            We've sent a verification code to <strong>{email}</strong>
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="h-11 text-center text-lg tracking-widest"
            maxLength={6}
          />
        </div>

        <Button 
          onClick={handleVerify}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          disabled={isLoading || verificationCode.length !== 6}
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

        <div className="text-center">
          <span className="text-sm text-gray-600">Didn't receive the code? </span>
          <Button
            variant="link"
            className="p-0 text-sm text-blue-600 hover:text-blue-800"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? "Sending..." : "Resend"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailVerification;
