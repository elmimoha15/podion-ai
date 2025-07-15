
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Rocket } from "lucide-react";

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
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$9",
    description: "Perfect for new podcasters",
    icon: Zap,
    features: [
      "5 episodes per month",
      "Basic SEO content generation",
      "Social media captions",
      "Email support"
    ]
  },
  {
    id: "creator",
    name: "Creator",
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
    id: "pro",
    name: "Pro",
    price: "$99",
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

const PlanSelection = ({ onPlanSelected }: PlanSelectionProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string>("creator");

  const handleContinue = () => {
    console.log("Selected plan:", selectedPlan);
    onPlanSelected(selectedPlan);
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
          onClick={handleContinue}
          className="h-12 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg"
        >
          Continue with {plans.find(p => p.id === selectedPlan)?.name}
        </Button>
      </div>
    </div>
  );
};

export default PlanSelection;
