
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Rocket, Loader2, CreditCard } from "lucide-react";
import { paddleApi } from "@/services/paddleApi";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: any;
  popular?: boolean;
}

interface PlanSelectionProps {
  onPlanSelected: (planId: string) => void;
  onPaymentSuccess?: (planId: string) => void;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    icon: Zap,
    features: [
      "1 episode per month",
      "Basic transcription",
      "Simple show notes",
      "Community support"
    ]
  },
  {
    id: "starter",
    name: "Starter",
    price: "$10",
    description: "Perfect for new podcasters",
    icon: Rocket,
    features: [
      "5 episodes per month",
      "AI transcription",
      "SEO content generation",
      "Social media posts",
      "Email support"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    description: "For growing podcasts",
    icon: Crown,
    popular: true,
    features: [
      "25 episodes per month",
      "Advanced SEO optimization",
      "Custom show notes templates",
      "Multiple workspace support",
      "Priority support"
    ]
  },
  {
    id: "elite",
    name: "Elite",
    price: "$69",
    description: "For podcast networks",
    icon: Rocket,
    features: [
      "Unlimited episodes",
      "White-label content",
      "API access",
      "Team collaboration",
      "Custom integrations",
      "Dedicated support"
    ]
  }
];

const PlanSelection = ({ onPlanSelected, onPaymentSuccess }: PlanSelectionProps) => {
  const { currentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<string | null>(null);

  // Listen for Paddle payment success and check URL parameters
  useEffect(() => {
    // Check URL parameters for payment success
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const planId = urlParams.get('plan');
    
    if (success === 'true' && planId) {
      console.log('Payment success detected from URL parameters:', planId);
      
      toast.success(`🎉 Payment successful! Welcome to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan!`);
      
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      
      // Clear onboarding payment context
      localStorage.removeItem('onboarding_payment_context');
      localStorage.removeItem('paddle_checkout_plan');
      localStorage.removeItem('paddle_checkout_timestamp');
      
      // Complete onboarding with paid plan immediately
      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess(planId);
        } else {
          onPlanSelected(planId);
        }
      }, 1000);
      
      return; // Don't set up other listeners if we already detected success
    }
    
    // Listen for Paddle payment success event
    const handlePaddleSuccess = (event: CustomEvent) => {
      const { planId } = event.detail;
      console.log('Received Paddle payment success event for plan:', planId);
      
      toast.success(`🎉 Payment successful! Welcome to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan!`);
      
      // Clear onboarding payment context
      localStorage.removeItem('onboarding_payment_context');
      localStorage.removeItem('paddle_checkout_plan');
      localStorage.removeItem('paddle_checkout_timestamp');
      
      // Complete onboarding with paid plan
      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess(planId);
        } else {
          onPlanSelected(planId);
        }
      }, 1000);
    };
    
    // Add event listener
    window.addEventListener('paddlePaymentSuccess', handlePaddleSuccess as EventListener);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('paddlePaymentSuccess', handlePaddleSuccess as EventListener);
    };
  }, [onPlanSelected, onPaymentSuccess]);



  const handlePlanSelection = async () => {
    if (!currentUser) {
      toast.error('Please log in to continue');
      return;
    }

    // If Free plan is selected, continue without payment
    if (selectedPlan === 'free') {
      toast.success('Welcome to Podion AI! Starting with the Free plan.');
      onPlanSelected(selectedPlan);
      return;
    }

    // For paid plans, initiate Paddle checkout
    try {
      setIsProcessingPayment(true);
      setPaymentPlan(selectedPlan);
      
      // Set onboarding context for payment success handling
      localStorage.setItem('onboarding_payment_context', 'true');
      localStorage.setItem('onboarding_selected_plan', selectedPlan);
      
      const result = await paddleApi.openPaddleCheckout(selectedPlan);
      
      if (result.success) {
        toast.success('Paddle checkout opened! Complete your payment to continue.');
        
        // Start polling for payment success
        startPaymentPolling(selectedPlan);
      } else {
        throw new Error(result.error || 'Failed to open checkout');
      }
    } catch (error) {
      console.error('Error opening Paddle checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to open checkout';
      toast.error(errorMessage);
      localStorage.removeItem('onboarding_payment_context');
      localStorage.removeItem('onboarding_selected_plan');
    } finally {
      setIsProcessingPayment(false);
      setPaymentPlan(null);
    }
  };

  const startPaymentPolling = (planId: string) => {
    // Skip backend polling if not on localhost (backend not available in production)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.log('Skipping backend polling - backend not available in production');
      return;
    }
    
    let attempts = 0;
    const maxAttempts = 180; // 3 minutes of polling
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        // Check if user has an active subscription (payment succeeded)
        const response = await fetch(`/api/v1/paddle/subscription/${currentUser?.uid}`, {
          headers: {
            'Authorization': `Bearer ${await currentUser?.getIdToken()}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // If user has active subscription, payment succeeded
          if (data.subscription && data.subscription.status === 'active') {
            console.log('🎉 Payment success detected via backend!');
            
            clearInterval(pollInterval);
            
            toast.success(`🎉 Payment successful! Welcome to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan!`);
            
            // Clear onboarding payment context
            localStorage.removeItem('onboarding_payment_context');
            localStorage.removeItem('onboarding_selected_plan');
            localStorage.removeItem('paddle_checkout_plan');
            localStorage.removeItem('paddle_checkout_timestamp');
            
            // Complete onboarding with paid plan
            setTimeout(() => {
              if (onPaymentSuccess) {
                onPaymentSuccess(planId);
              } else {
                onPlanSelected(planId);
              }
            }, 1000);
            
            return;
          }
        }
      } catch (error) {
        console.log('Polling error (normal during payment):', error);
      }
      
      // Stop polling after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        console.log('Payment polling stopped - user may have cancelled or payment failed');
      }
    }, 1000); // Poll every second
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose your plan</h2>
        <p className="text-gray-600">Start with a plan that fits your podcast's needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isSelected = selectedPlan === plan.id;
          
          return (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                isSelected 
                  ? "ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-xl" 
                  : "bg-white/90 backdrop-blur-sm hover:shadow-lg"
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                  isSelected 
                    ? "bg-gradient-to-br from-blue-500 to-blue-600" 
                    : "bg-gradient-to-br from-gray-400 to-gray-500"
                }`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-900">
                    {plan.price}
                    <span className="text-sm font-normal text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Button 
          onClick={handlePlanSelection}
          disabled={isProcessingPayment}
          className="h-12 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg disabled:opacity-50"
        >
          {isProcessingPayment ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {paymentPlan === selectedPlan ? 'Opening Checkout...' : 'Processing...'}
            </>
          ) : selectedPlan === 'free' ? (
            `Start with ${plans.find(p => p.id === selectedPlan)?.name}`
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Continue with {plans.find(p => p.id === selectedPlan)?.name}
            </>
          )}
        </Button>
        
        {selectedPlan !== 'free' && (
          <p className="text-sm text-gray-500 mt-3">
            🔒 Secure payment powered by Paddle • Cancel anytime
          </p>
        )}
      </div>
    </div>
  );
};

export default PlanSelection;
