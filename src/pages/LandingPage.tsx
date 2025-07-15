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
  Sparkles,
  Star,
  BarChart3,
  Globe,
  Shield,
  Headphones,
  MessageSquare,
  Download,
  Heart,
  Award,
  Smartphone,
  Laptop,
  TabletSmartphone
} from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";

const LandingPage = () => {
  const features = [
    {
      icon: FileText,
      title: "SEO Blog Post Generator",
      description: "Transform your podcast episodes into search-optimized blog content that drives organic traffic.",
      delay: "0s"
    },
    {
      icon: Share2,
      title: "Social Media Captions",
      description: "Generate engaging captions for Twitter, Instagram, TikTok, and LinkedIn automatically.",
      delay: "0.1s"
    },
    {
      icon: Clock,
      title: "Timestamps & Show Notes",
      description: "Create detailed show notes with accurate timestamps for better listener experience.",
      delay: "0.2s"
    },
    {
      icon: Target,
      title: "SEO Optimization",
      description: "Boost your podcast discoverability with AI-generated titles and descriptions.",
      delay: "0.3s"
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
      popular: false,
      delay: "0s"
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
      popular: true,
      delay: "0.1s"
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
      popular: false,
      delay: "0.2s"
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

  const benefits = [
    {
      icon: BarChart3,
      title: "10x Your Reach",
      description: "Turn one podcast into 15+ pieces of content for maximum audience growth.",
      delay: "0s"
    },
    {
      icon: Clock,
      title: "Save 20+ Hours Weekly",
      description: "Automate content creation and focus on what you do best - podcasting.",
      delay: "0.1s"
    },
    {
      icon: Globe,
      title: "SEO Optimization",
      description: "Get discovered by new audiences with search-optimized content.",
      delay: "0.2s"
    },
    {
      icon: Target,
      title: "Higher Engagement",
      description: "AI-crafted content that resonates with your audience across all platforms.",
      delay: "0.3s"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Tech Podcast Host",
      content: "Podion AI transformed my workflow. What used to take me 6 hours now takes 15 minutes!",
      avatar: "SC",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Business Podcaster",
      content: "The SEO content has doubled my organic traffic. My episodes are reaching audiences I never imagined.",
      avatar: "MR",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Creative Director",
      content: "The social media captions are spot-on. My engagement rates have increased by 300%.",
      avatar: "EW",
      rating: 5
    }
  ];

  const platforms = [
    { name: "Spotify", icon: "🎵" },
    { name: "Apple Podcasts", icon: "🎧" },
    { name: "Google Podcasts", icon: "🔍" },
    { name: "YouTube", icon: "📹" },
    { name: "SoundCloud", icon: "☁️" },
    { name: "Anchor", icon: "⚓" }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="border-b glass-effect sticky top-0 z-40 animate-fade-in">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="h-8 w-8 rounded-lg blue-gradient flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Podion AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/signin">
              <Button variant="ghost" className="hover:bg-blue-50 transition-colors duration-300">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button className="blue-gradient text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6 bg-blue-50 text-blue-700 border-blue-200 animate-fade-in-up hover:scale-105 transition-transform duration-300">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by Advanced AI
          </Badge>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Turn Your Podcast Into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 inline-block transform hover:scale-105 transition-transform duration-300"> SEO Gold</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Automatically transform your podcast episodes into blog posts, social media content, 
            and show notes that drive traffic and grow your audience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8 py-6 blue-gradient text-white hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover:bg-blue-50 transform hover:scale-105 transition-all duration-300">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-300">
              <Check className="h-4 w-4 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-300">
              <Check className="h-4 w-4 text-green-500" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-300">
              <Check className="h-4 w-4 text-green-500" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 gradient-bg relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
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
              <Card key={index} className="relative overflow-hidden group hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 card-gradient animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader className="text-center">
                  <div className="h-16 w-16 rounded-full blue-gradient text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    {item.step}
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors duration-300">{item.title}</CardTitle>
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
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive content generation tools designed for modern podcasters
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-500 border-gray-100 transform hover:-translate-y-2 card-gradient animate-fade-in-up" style={{ animationDelay: feature.delay }}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors duration-300">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Podion AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of podcasters who've transformed their content strategy
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center group hover:shadow-xl transition-all duration-500 border-gray-100 transform hover:-translate-y-2 card-gradient animate-fade-in-up" style={{ animationDelay: benefit.delay }}>
                <CardHeader>
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors duration-300">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 gradient-bg relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Loved by Podcasters Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our community is saying about Podion AI
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative overflow-hidden group hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 card-gradient animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 italic">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Integration */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-fade-in-up mb-12">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Works with All Major Platforms
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Seamlessly integrate with your favorite podcast hosting and social media platforms
            </p>
          </div>
          
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-60 hover:opacity-80 transition-opacity duration-300">
            {platforms.map((platform, index) => (
              <div key={index} className="text-center group animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  {platform.icon}
                </div>
                <p className="text-sm font-medium text-gray-700">{platform.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Device Showcase */}
      <section className="py-20 gradient-bg relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Access Anywhere, Anytime
            </h2>
            <p className="text-xl text-gray-600">
              Create content on the go with our responsive design
            </p>
          </div>
          
          <div className="flex justify-center items-center gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="text-center group">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <p className="font-medium text-gray-700">Mobile</p>
            </div>
            <div className="text-center group">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <TabletSmartphone className="h-8 w-8 text-white" />
              </div>
              <p className="font-medium text-gray-700">Tablet</p>
            </div>
            <div className="text-center group">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Laptop className="h-8 w-8 text-white" />
              </div>
              <p className="font-medium text-gray-700">Desktop</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-4xl mx-auto card-gradient border-blue-200 animate-fade-in-up">
            <CardContent className="py-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Ready to Transform Your Podcast?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Join over 10,000 podcasters who've already revolutionized their content creation process
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link to="/signup">
                  <Button size="lg" className="text-lg px-8 py-6 blue-gradient text-white hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover:bg-blue-50 transform hover:scale-105 transition-all duration-300">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  14-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  No setup fees
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Cancel anytime
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 gradient-bg relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your podcast's growth stage
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative transform hover:-translate-y-4 transition-all duration-500 card-gradient animate-scale-in ${plan.popular ? 'ring-2 ring-blue-500 shadow-2xl scale-105' : 'hover:shadow-xl'}`} style={{ animationDelay: plan.delay }}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 blue-gradient text-white animate-pulse">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="flex items-baseline justify-center mt-4">
                    <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{plan.price}</span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3 group">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 group-hover:scale-125 transition-transform duration-300" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full transition-all duration-300 transform hover:scale-105 ${plan.popular ? 'blue-gradient text-white hover:shadow-lg' : 'hover:bg-blue-50'}`}
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

      {/* Social Proof */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Trusted by 10,000+ Podcasters</h3>
            <div className="flex justify-center items-center gap-8 opacity-60 hover:opacity-80 transition-opacity duration-300">
              <div className="text-lg font-semibold text-gray-600">Featured on:</div>
              <div className="flex gap-6">
                <span className="text-xl font-bold text-gray-700">TechCrunch</span>
                <span className="text-xl font-bold text-gray-700">Product Hunt</span>
                <span className="text-xl font-bold text-gray-700">Podcast Magazine</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 relative z-10 animate-fade-in">
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
