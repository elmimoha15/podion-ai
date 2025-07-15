
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  FileText, 
  Share2, 
  Clock, 
  Zap, 
  Target,
  Check,
  ArrowRight,
  Play,
  Users,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const features = [
    {
      icon: FileText,
      title: "SEO Blog Post Generator",
      description: "Transform your podcast episodes into search-optimized blog content that drives organic traffic."
    },
    {
      icon: Share2,
      title: "Social Media Captions",
      description: "Generate engaging captions for Twitter, Instagram, TikTok, and LinkedIn automatically."
    },
    {
      icon: Clock,
      title: "Timestamps & Show Notes",
      description: "Create detailed show notes with accurate timestamps for better listener experience."
    },
    {
      icon: Target,
      title: "SEO Optimization",
      description: "Boost your podcast discoverability with AI-generated titles and descriptions."
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
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
      price: "$79",
      period: "/month",
      description: "For growing podcasts",
      features: [
        "25 episodes per month",
        "Advanced SEO content",
        "All social platforms",
        "Custom templates",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
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

  const faqs = [
    {
      question: "How accurate is the transcription?",
      answer: "Our AI achieves 95%+ accuracy with clear audio. We use advanced speech recognition specifically trained for podcast content."
    },
    {
      question: "Can I edit the generated content?",
      answer: "Absolutely! All generated content is fully editable. Think of it as your intelligent first draft that you can customize."
    },
    {
      question: "What audio formats do you support?",
      answer: "We support MP3, WAV, M4A, and most common audio formats. You can also paste YouTube or podcast URLs directly."
    },
    {
      question: "How long does processing take?",
      answer: "Most episodes are processed in 2-5 minutes, depending on length. You'll get real-time updates on progress."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white/80 backdrop-blur-sm z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Podion AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6 bg-blue-50 text-blue-700 border-blue-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by Advanced AI
          </Badge>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Turn Your Podcast Into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800"> SEO Gold</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Automatically transform your podcast episodes into blog posts, social media content, 
            and show notes that drive traffic and grow your audience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From podcast to published content in just three simple steps
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Upload Your Episode",
                description: "Drop your audio file or paste a URL. We support all major formats and platforms."
              },
              {
                step: "2", 
                title: "AI Does the Magic",
                description: "Our advanced AI transcribes and analyzes your content to understand context and key points."
              },
              {
                step: "3",
                title: "Get Your Content",
                description: "Download SEO-optimized blog posts, social captions, and detailed show notes in minutes."
              }
            ].map((item, index) => (
              <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive content generation tools designed for modern podcasters
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow border-gray-100">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your podcast's growth stage
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="flex items-baseline justify-center mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => console.log(`Selected ${plan.name} plan`)}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg text-left">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Mic className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-xl">Podion AI</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Transform your podcast episodes into SEO content that drives traffic and grows your audience.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Podion AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
