
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Share2, 
  Clock, 
  Target,
  Zap,
  BarChart3,
  Globe,
  Palette,
  Search,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "SEO Blog Post Generator",
    description: "Transform your podcast episodes into search-optimized blog content that drives organic traffic and grows your audience.",
    badge: "Most Popular",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    icon: Share2,
    title: "Multi-Platform Social Content",
    description: "Generate engaging captions for Twitter, Instagram, TikTok, LinkedIn, and Facebook with platform-specific optimization.",
    badge: "New",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    icon: Clock,
    title: "Smart Timestamps & Notes",
    description: "Create detailed show notes with accurate timestamps, key takeaways, and chapter markers for better listener experience.",
    badge: null,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    icon: Target,
    title: "Advanced SEO Optimization",
    description: "Boost your podcast discoverability with AI-generated titles, descriptions, and keyword optimization strategies.",
    badge: "Pro",
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  {
    icon: Zap,
    title: "Lightning Fast Processing",
    description: "Get your content ready in minutes, not hours. Our advanced AI processes episodes 10x faster than traditional methods.",
    badge: null,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50"
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track your content performance across platforms with detailed analytics and insights to optimize your strategy.",
    badge: "Beta",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50"
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Generate content in 50+ languages to reach global audiences and expand your podcast's international presence.",
    badge: null,
    color: "text-teal-600",
    bgColor: "bg-teal-50"
  },
  {
    icon: Palette,
    title: "Brand Voice Matching",
    description: "Our AI learns your unique voice and style to maintain consistency across all generated content and platforms.",
    badge: "AI-Powered",
    color: "text-pink-600",
    bgColor: "bg-pink-50"
  }
];

export function FeaturesShowcase() {
  return (
    <section className="py-20 relative z-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in-up">
          <Badge variant="secondary" className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Comprehensive Feature Set
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Scale Your Podcast
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From content generation to performance tracking, we've got every aspect of your podcast content strategy covered
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover-lift card-gradient border-0 shadow-lg animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader>
                <div className={`h-14 w-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                  {feature.badge && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      {feature.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
