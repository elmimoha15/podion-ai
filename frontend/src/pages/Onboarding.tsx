import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Onboarding Components
import EmailVerification from "@/components/onboarding/EmailVerification";
import ReferralSource from "@/components/onboarding/ReferralSource";
import PlanSelection from "@/components/onboarding/PlanSelection";
import WorkspaceCreation from "@/components/onboarding/WorkspaceCreation";

type OnboardingStep = "email-verification" | "referral-source" | "plan-selection" | "workspace-creation";

const Onboarding = () => {
  const { currentUser, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("email-verification");
  const [onboardingData, setOnboardingData] = useState({
    emailVerified: false,
    referralSource: "",
    referralDetails: "",
    selectedPlan: "",
    workspaceName: "",
    workspaceDescription: "",
    workspaceCategory: ""
  });

  // If user is not authenticated, redirect to signin
  if (!currentUser) {
    navigate("/signin");
    return null;
  }

  const handleEmailVerified = () => {
    setOnboardingData(prev => ({ ...prev, emailVerified: true }));
    setCurrentStep("referral-source");
  };

  const handleReferralSourceSelected = (source: string, details?: string) => {
    setOnboardingData(prev => ({ 
      ...prev, 
      referralSource: source,
      referralDetails: details || ""
    }));
    setCurrentStep("plan-selection");
  };

  const handlePlanSelected = (planId: string) => {
    setOnboardingData(prev => ({ ...prev, selectedPlan: planId }));
    setCurrentStep("workspace-creation");
  };

  const handleWorkspaceCreated = () => {
    // TODO: Save onboarding data to backend
    console.log("Onboarding completed:", onboardingData);
    
    // Mark onboarding as complete and redirect to dashboard
    completeOnboarding();
    navigate("/dashboard");
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "email-verification":
        return (
          <EmailVerification
            email={currentUser?.email || ""}
            onVerified={handleEmailVerified}
          />
        );
      case "referral-source":
        return (
          <ReferralSource
            onSourceSelected={handleReferralSourceSelected}
          />
        );
      case "plan-selection":
        return (
          <PlanSelection
            onPlanSelected={handlePlanSelected}
          />
        );
      case "workspace-creation":
        return (
          <WorkspaceCreation
            onNext={handleWorkspaceCreated}
          />
        );
      default:
        return null;
    }
  };

  const getStepNumber = () => {
    const steps = ["email-verification", "referral-source", "plan-selection", "workspace-creation"];
    return steps.indexOf(currentStep) + 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= getStepNumber()
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        step < getStepNumber() ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Step {getStepNumber()} of 4
            </p>
          </div>
        </div>

        {/* Current Step Content */}
        <div className="flex justify-center">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
