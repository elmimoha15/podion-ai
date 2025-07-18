
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Mic, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import EmailVerification from "@/components/onboarding/EmailVerification";
import PlanSelection from "@/components/onboarding/PlanSelection";
import ReferralSource from "@/components/onboarding/ReferralSource";
import WorkspaceCreation from "@/components/onboarding/WorkspaceCreation";

interface SignUpProps {
  onSignUp: () => void;
}

type OnboardingStep = "signup" | "email-verification" | "plan-selection" | "referral-source" | "workspace-creation" | "complete";

const SignUp = ({ onSignUp }: SignUpProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("signup");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Signing up with:", formData);
      setIsLoading(false);
      setCurrentStep("email-verification");
    }, 1000);
  };

  const handleEmailVerified = () => {
    setCurrentStep("plan-selection");
  };

  const handlePlanSelected = (planId: string) => {
    console.log("Plan selected:", planId);
    setCurrentStep("referral-source");
  };

  const handleSourceSelected = (source: string, details?: string) => {
    console.log("Referral source:", source, details);
    setCurrentStep("workspace-creation");
  };

  const handleWorkspaceCreated = () => {
    setCurrentStep("complete");
    setTimeout(() => {
      onSignUp();
    }, 2000);
  };

  const renderProgressBar = () => {
    const steps = ["signup", "email-verification", "plan-selection", "referral-source", "workspace-creation"];
    const currentIndex = steps.indexOf(currentStep);
    const progress = ((currentIndex + 1) / steps.length) * 100;

    return (
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Account Setup</span>
          <span>Complete Setup</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">
          Step {currentIndex + 1} of {steps.length}
        </div>
      </div>
    );
  };

  if (currentStep === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Welcome to Podion AI!</CardTitle>
              <CardDescription className="mt-2">
                Your account is all set up. Redirecting to dashboard...
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Back to Home - only show on first step */}
        {currentStep === "signup" && (
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        )}

        {/* Progress Bar */}
        {currentStep !== "signup" && renderProgressBar()}

        {/* Step Content */}
        {currentStep === "signup" && (
          <Card className="w-full max-w-md mx-auto shadow-xl border-0">
            <CardHeader className="text-center space-y-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
                <CardDescription className="mt-2">
                  Start transforming your podcast content today
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                    className="h-11"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: !!checked})}
                  />
                  <Label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-800">Terms of Service</a>
                    {" "}and{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  disabled={isLoading || !formData.agreeToTerms}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or sign up with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11" onClick={() => console.log("Google sign up")}>
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button variant="outline" className="h-11" onClick={() => console.log("GitHub sign up")}>
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/signin" className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "email-verification" && (
          <EmailVerification 
            email={formData.email}
            onVerified={handleEmailVerified}
          />
        )}

        {currentStep === "plan-selection" && (
          <PlanSelection onPlanSelected={handlePlanSelected} />
        )}

        {currentStep === "referral-source" && (
          <ReferralSource onSourceSelected={handleSourceSelected} />
        )}

        {currentStep === "workspace-creation" && (
          <WorkspaceCreation onWorkspaceCreated={handleWorkspaceCreated} />
        )}
      </div>
    </div>
  );
};

export default SignUp;
