
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
  AlertTriangle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { podcastApi } from "@/services/podcastApi";
import { paddleApi } from "@/services/paddleApi";
import { toast } from "sonner";

const Billing = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false); // Start with false for instant loading
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subscribingToPlan, setSubscribingToPlan] = useState<string | null>(null);

  // Cache keys for localStorage
  const getCacheKey = (type: string) => `billing_${type}_${currentUser?.uid}`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Load cached data immediately
  useEffect(() => {
    if (currentUser?.uid) {
      loadCachedData();
      // Check for successful payment completion
      checkPaymentSuccess();
      // Fetch fresh data in background
      setTimeout(() => fetchBillingData(true), 100);
    }
  }, [currentUser?.uid]);

  // Check for successful payment completion
  const checkPaymentSuccess = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const planId = urlParams.get('plan');
    const transactionId = urlParams.get('transaction_id');
    
    // Also check localStorage for recent checkout
    const storedPlan = localStorage.getItem('paddle_checkout_plan');
    const storedTimestamp = localStorage.getItem('paddle_checkout_timestamp');
    
    if (success === 'true' || (storedPlan && storedTimestamp)) {
      const recentCheckout = storedTimestamp && (Date.now() - parseInt(storedTimestamp)) < 300000; // 5 minutes
      
      if (success === 'true' || recentCheckout) {
        const completedPlan = planId || storedPlan;
        
        toast.success(`🎉 Payment successful! Welcome to ${completedPlan?.charAt(0).toUpperCase() + completedPlan?.slice(1)} plan!`);
        
        // Clear the URL parameters
        if (success === 'true') {
          window.history.replaceState({}, '', '/billing');
        }
        
        // Clear localStorage
        localStorage.removeItem('paddle_checkout_plan');
        localStorage.removeItem('paddle_checkout_timestamp');
        
        // Force refresh billing data
        setTimeout(() => {
          fetchBillingData(true, true); // Force refresh
        }, 1000);
        
        // Update current plan optimistically
        if (completedPlan) {
          const planPrices: Record<string, number> = {
            'starter': 10,
            'pro': 29,
            'elite': 69
          };
          
          setCurrentPlan({
            name: completedPlan.charAt(0).toUpperCase() + completedPlan.slice(1),
            price: planPrices[completedPlan] || 0,
            id: completedPlan
          });
        }
      }
    }
  };

  const loadCachedData = () => {
    try {
      const cachedPlan = localStorage.getItem(getCacheKey('plan'));
      const cachedUsage = localStorage.getItem(getCacheKey('usage'));
      const cachedHistory = localStorage.getItem(getCacheKey('history'));
      const cachedStats = localStorage.getItem(getCacheKey('stats'));
      
      if (cachedPlan) {
        const planData = JSON.parse(cachedPlan);
        if (Date.now() - planData.timestamp < CACHE_DURATION) {
          setCurrentPlan(planData.data);
        }
      }
      
      if (cachedUsage) {
        const usageData = JSON.parse(cachedUsage);
        if (Date.now() - usageData.timestamp < CACHE_DURATION) {
          setUsage(usageData.data);
        }
      }
      
      if (cachedHistory) {
        const historyData = JSON.parse(cachedHistory);
        if (Date.now() - historyData.timestamp < CACHE_DURATION) {
          setBillingHistory(historyData.data);
        }
      }
      
      if (cachedStats) {
        const statsData = JSON.parse(cachedStats);
        if (Date.now() - statsData.timestamp < CACHE_DURATION) {
          setUsageStats(statsData.data);
        }
      }
    } catch (error) {
      console.error('Failed to load cached billing data:', error);
    }
  };

  const cacheData = (type: string, data: any) => {
    try {
      localStorage.setItem(getCacheKey(type), JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to cache billing data:', error);
    }
  };

  const fetchBillingData = async (isBackground = false, forceRefresh = false) => {
    if (!currentUser?.uid) return;
    
    try {
      if (!isBackground) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      const [planResponse, usageLimitsResponse, billingHistoryResponse, usageStatsResponse, paddleInvoicesResponse] = await Promise.all([
        podcastApi.getCurrentPlan(currentUser.uid),
        podcastApi.getUsageLimits(currentUser.uid),
        podcastApi.getBillingHistory(currentUser.uid, 6),
        podcastApi.getUserUsage(currentUser.uid, 30),
        paddleApi.getUserInvoices(10) // Fetch real Paddle invoices
      ]);
      
      if (planResponse.success) {
        setCurrentPlan(planResponse.plan);
        cacheData('plan', planResponse.plan);
      }
      
      if (usageLimitsResponse.success) {
        setUsage(usageLimitsResponse.usage);
        cacheData('usage', usageLimitsResponse.usage);
      }
      
      // Use real Paddle invoices if available, otherwise fall back to mock data
      if (paddleInvoicesResponse && paddleInvoicesResponse.success && paddleInvoicesResponse.invoices.length > 0) {
        // Format Paddle invoices for the billing history display
        const formattedInvoices = paddleInvoicesResponse.invoices.map((invoice: any) => {
          const amount = parseFloat(invoice.amount.total) / 100; // Paddle amounts are in cents
          const date = new Date(invoice.created_at);
          
          return {
            id: invoice.id,
            date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            amount: amount,
            currency: invoice.amount.currency,
            status: invoice.status === 'paid' ? 'paid' : invoice.status,
            invoice_number: invoice.number,
            pdf_url: invoice.pdf_url,
            description: `${invoice.amount.currency.toUpperCase()} ${amount.toFixed(2)} - Invoice ${invoice.number}`,
            plan_name: 'Subscription', // Could be enhanced to show actual plan name
            billing_period: invoice.billing_period
          };
        });
        
        setBillingHistory(formattedInvoices);
        cacheData('history', formattedInvoices);
        console.log('✅ Using real Paddle invoices for billing history:', formattedInvoices);
      } else if (billingHistoryResponse.success) {
        // Fall back to mock data if no Paddle invoices
        setBillingHistory(billingHistoryResponse.billing_history || []);
        cacheData('history', billingHistoryResponse.billing_history || []);
        console.log('📋 Using mock billing history data');
      }
      
      if (usageStatsResponse.success) {
        setUsageStats(usageStatsResponse.usage_stats);
        cacheData('stats', usageStatsResponse.usage_stats);
      }
      
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      if (!isBackground) {
        setError('Failed to load billing information. Please try again.');
        toast.error('Failed to load billing data');
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchBillingData(false);
  };

  const handlePlanChange = async (planName: string) => {
    if (!currentUser?.email) {
      toast.error('Please log in to subscribe');
      return;
    }

    const planId = planName.toLowerCase();
    if (planId === 'free') {
      toast.info('You are already on the free plan');
      return;
    }

    // Map plan names to Paddle plan IDs
    const paddlePlanMap: { [key: string]: string } = {
      'starter': 'starter',
      'professional': 'pro', // Map "Professional" to "pro"
      'enterprise': 'elite'   // Map "Enterprise" to "elite"
    };

    const paddlePlanId = paddlePlanMap[planId] || planId;

    setSubscribingToPlan(paddlePlanId);

    try {
      // Create Paddle checkout session
      const result = await paddleApi.createCheckoutSession({
        plan_id: paddlePlanId,
        success_url: `${window.location.origin}/billing?success=true`,
        cancel_url: `${window.location.origin}/billing?canceled=true`
      });

      if (result.success) {
        // For Paddle.js overlay checkout, no redirect needed - overlay opens automatically
        if (result.checkout_url === 'paddle_overlay_opened') {
          toast.success('Paddle checkout opened! Complete your payment in the overlay.');
          // Overlay is already open, no further action needed
        } else if (result.checkout_url) {
          // Fallback for other checkout types
          toast.success('Redirecting to Paddle checkout...');
          paddleApi.redirectToCheckout(result.checkout_url);
        } else {
          toast.success('Paddle checkout initiated successfully!');
        }
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating Paddle checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      toast.error(errorMessage);
    } finally {
      setSubscribingToPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-gray-900 mb-2">Failed to load billing data</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => fetchBillingData(false)} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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


  const handleUpdatePayment = () => {
    console.log("Update payment method");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-600">
              Manage your subscription, usage, and billing information
            </p>
            {isRefreshing && (
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchBillingData()}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
              {currentPlan && (
                <Badge className="bg-green-100 text-green-800">
                  {currentPlan.status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentPlan ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{currentPlan?.name || 'Loading...'}</h3>
                    <p className="text-gray-500">${currentPlan?.price || 0}/{currentPlan?.billing_cycle || 'month'}</p>
                  </div>
                  <Badge variant={currentPlan?.status === "active" ? "default" : "secondary"}>
                    {currentPlan?.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  {currentPlan?.features?.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  )) || []}
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Next billing date:</span>
                  <span className="font-medium">
                    {currentPlan?.next_billing_date ? new Date(currentPlan.next_billing_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Update Payment
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Change Plan
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No plan information available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Current Usage
            </CardTitle>
            <CardDescription>Your usage this billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {usage ? (
              <>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Episodes</span>
                    <span className="text-sm text-gray-500">{usage.episodes.used}/{usage.episodes.limit}</span>
                  </div>
                  <Progress value={usage.episodes.percentage} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {usage.episodes.limit - usage.episodes.used} episodes remaining
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Content Generation</span>
                    <span className="text-sm text-gray-500">{usage.content_generation.used}/{usage.content_generation.limit}</span>
                  </div>
                  <Progress value={usage.content_generation.percentage} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {usage.content_generation.limit - usage.content_generation.used} generations remaining
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Storage</span>
                    <span className="text-sm text-gray-500">{usage.storage.used.toFixed(1)}GB/{usage.storage.limit}GB</span>
                  </div>
                  <Progress value={usage.storage.percentage} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {(usage.storage.limit - usage.storage.used).toFixed(1)}GB available
                  </p>
                </div>
                
                {usageStats && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{usageStats.api_usage?.deepgram_minutes?.toFixed(1) || 0}</div>
                        <div className="text-xs text-gray-500">Minutes Transcribed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">${usageStats.costs?.total_estimated?.toFixed(2) || 0}</div>
                        <div className="text-xs text-gray-500">Estimated API Costs</div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No usage data available</p>
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
                  disabled={plan.current || subscribingToPlan !== null}
                >
                  {plan.current ? "Current Plan" : 
                   subscribingToPlan === plan.name.toLowerCase() || subscribingToPlan === (plan.name === 'Professional' ? 'pro' : plan.name === 'Enterprise' ? 'elite' : plan.name.toLowerCase()) ? (
                     <>
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       Creating Checkout...
                     </>
                   ) : (
                     currentPlan && plan.price > currentPlan.price ? "Upgrade" : 
                     currentPlan && plan.price < currentPlan.price ? "Downgrade" : "Select Plan"
                   )}
                  {!plan.current && currentPlan && plan.price > currentPlan.price && subscribingToPlan === null && (
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  )}
                  {!plan.current && currentPlan && plan.price < currentPlan.price && subscribingToPlan === null && (
                    <ArrowDownRight className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Success Simulation - FOR DEVELOPMENT ONLY */}
      <Card className="border-dashed border-2 border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-700">🧪 Test Success Flow</CardTitle>
          <CardDescription className="text-blue-600">
            Click below to simulate a successful payment and see the success flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => {
              // Simulate successful payment by updating local state
              toast.success('🎉 Test Payment Successful! Subscription activated.');
              // Simulate plan change
              setCurrentPlan({ name: 'Pro', price: 29 });
              // Refresh the page to show updated state
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            🧪 Simulate Successful Payment (Pro Plan)
          </Button>
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
            {billingHistory.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {invoice.invoice_number ? `Invoice ${invoice.invoice_number}` : invoice.description}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{invoice.invoice_number || invoice.id}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(invoice.date).toLocaleDateString()}
                      </span>
                      {invoice.billing_period && (
                        <>
                          <span>•</span>
                          <span className="text-xs">
                            {new Date(invoice.billing_period.starts_at).toLocaleDateString()} - {new Date(invoice.billing_period.ends_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">
                      {invoice.currency ? `${invoice.currency.toUpperCase()} ${invoice.amount.toFixed(2)}` : `$${invoice.amount}`}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`${
                        invoice.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                        invoice.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                  {invoice.pdf_url ? (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(invoice.pdf_url, '_blank')}
                      title="Download PDF Invoice"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
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
