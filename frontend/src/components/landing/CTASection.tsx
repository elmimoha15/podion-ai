
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Zap, Target } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-20 blue-gradient-soft relative z-10">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto card-gradient border-0 shadow-2xl hover-lift">
          <CardContent className="p-12 text-center">
            <Badge variant="secondary" className="mb-6 bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
              <Sparkles className="h-3 w-3 mr-1" />
              Limited Time Offer
            </Badge>
            
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6 animate-fade-in-up">
              Ready to Transform Your 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800"> Podcast Content?</span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Join thousands of podcasters who are already creating amazing content with Podion AI. 
              Start your free trial today and see the difference in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/signup">
                <Button size="lg" className="text-lg px-8 py-6 blue-gradient-intense text-white hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-2xl">
                  <Zap className="mr-2 h-5 w-5" />
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover:bg-blue-50 hover:border-blue-300 transform hover:scale-105 transition-all duration-300 rounded-2xl">
                <Target className="mr-2 h-5 w-5" />
                Schedule Demo
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-200 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">14 Days</div>
                <div className="text-sm text-gray-500">Free Trial</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">No Credit Card</div>
                <div className="text-sm text-gray-500">Required</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">Cancel Anytime</div>
                <div className="text-sm text-gray-500">No Questions Asked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
