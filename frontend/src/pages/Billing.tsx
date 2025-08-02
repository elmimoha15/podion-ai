
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Zap,
  Crown,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

const Billing = () => {
  const currentPlan = {
    name: "Professional",
    price: 79,
    period: "month",
    status: "active",
    nextBilling: "February 15, 2024",
    features: [
      "25 episodes per month",
      "Advanced SEO content",
      "All social platforms", 
      "Custom templates",
      "Priority support"
    ]
  };

  const usage = {
    episodes: { used: 18, limit: 25 },
    contentGeneration: { used: 72, limit: 100 },
    storage: { used: 2.4, limit: 10 }
  };

  const plans = [
    {
      name: "Free",
      price: 0,
      period: "month",
      description: "Perfect for trying out",
      features: [
        "1 episode per month",
        "Basic blog posts",
        "Basic social captions",
        "Community support"
      ],
      popular: false
    },
    {
      name: "Starter",
      price: 29,
      period: "month",
      description: "Perfect for new podcasters",
      features: [
        "5 episodes per month",
        "SEO blog posts",
        "Basic social captions",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Professional", 
      price: 79,
      period: "month",
      description: "For growing podcasts",
      features: [
        "25 episodes per month",
        "Advanced SEO content",
        "All social platforms",
        "Custom templates",
        "Priority support"
      ],
      popular: true,
      current: true
    },
    {
      name: "Enterprise",
      price: 199,
      period: "month", 
      description: "For podcast networks",
      features: [
        "Unlimited episodes",
        "White-label options",
        "API access",
        "Custom integrations",
        "Dedicated support"
      ],
      popular: false
    }
  ];

  const invoices = [
    {
      id: "INV-2024-001",
      date: "Jan 15, 2024",
      amount: 79,
      status: "paid",
      description: "Professional Plan - January 2024"
    },
    {
      id: "INV-2023-012",
      date: "Dec 15, 2023",
      amount: 79,
      status: "paid", 
      description: "Professional Plan - December 2023"
    },
    {
      id: "INV-2023-011",
      date: "Nov 15, 2023",
      amount: 79,
      status: "paid",
      description: "Professional Plan - November 2023"
    },
    {
      id: "INV-2023-010",
      date: "Oct 15, 2023",
      amount: 29,
      status: "paid",
      description: "Starter Plan - October 2023"
    }
  ];

  const handlePlanChange = (planName: string) => {
    console.log(`Changing to ${planName} plan`);
  };

  const handleCancelSubscription = () => {
    console.log("Cancel subscription requested");
  };

  const handleUpdatePayment = () => {
    console.log("Update payment method");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-1">
          Manage your subscription, usage, and billing information
        </p>
      </div>

      {/* Current Plan & Usage */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Current Plan
                </CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {currentPlan.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">${currentPlan.price}</span>
                <span className="text-gray-500">/{currentPlan.period}</span>
              </div>
              <p className="text-lg font-medium text-gray-900">{currentPlan.name}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Next billing date:</p>
              <p className="font-medium">{currentPlan.nextBilling}</p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Plan Features:</p>
              <ul className="space-y-1">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleUpdatePayment}>
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleCancelSubscription}>
                Cancel Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Current Usage
            </CardTitle>
            <CardDescription>Your usage for this billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Episodes Processed</span>
                <span className="text-sm text-gray-600">
                  {usage.episodes.used}/{usage.episodes.limit}
                </span>
              </div>
              <Progress 
                value={(usage.episodes.used / usage.episodes.limit) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {usage.episodes.limit - usage.episodes.used} episodes remaining
              </p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Content Generations</span>
                <span className="text-sm text-gray-600">
                  {usage.contentGeneration.used}/{usage.contentGeneration.limit}
                </span>
              </div>
              <Progress 
                value={(usage.contentGeneration.used / usage.contentGeneration.limit) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {usage.contentGeneration.limit - usage.contentGeneration.used} generations remaining
              </p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Storage Used</span>
                <span className="text-sm text-gray-600">
                  {usage.storage.used} GB / {usage.storage.limit} GB
                </span>
              </div>
              <Progress 
                value={(usage.storage.used / usage.storage.limit) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {usage.storage.limit - usage.storage.used} GB available
              </p>
            </div>
            
            {usage.episodes.used / usage.episodes.limit > 0.8 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  You're approaching your monthly limit. Consider upgrading your plan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that best fits your podcast needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <div key={index} className={`relative border rounded-lg p-6 ${plan.current ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}`}>
                {plan.popular && !plan.current && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Most Popular
                  </Badge>
                )}
                {plan.current && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
                    Current Plan
                  </Badge>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  variant={plan.current ? "outline" : (plan.popular ? "default" : "outline")}
                  onClick={() => handlePlanChange(plan.name)}
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : (
                    plan.price > currentPlan.price ? "Upgrade" : "Downgrade"
                  )}
                  {!plan.current && plan.price > currentPlan.price && (
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  )}
                  {!plan.current && plan.price < currentPlan.price && (
                    <ArrowDownRight className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Your recent invoices and payments</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{invoice.description}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{invoice.id}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {invoice.date}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">${invoice.amount}</p>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {invoice.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
