
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Clock, 
  Calendar, 
  RotateCcw, 
  Copy, 
  Download,
  Share2,
  FileText,
  Twitter,
  Instagram,
  Linkedin,
  Eye,
  ChevronLeft
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";

const EpisodeDetail = () => {
  const { id } = useParams();
  const [copiedContent, setCopiedContent] = useState<string | null>(null);

  const episode = {
    id: "1",
    title: "The Future of AI in Business",
    description: "Exploring how artificial intelligence is transforming modern business operations and what it means for the future of work.",
    duration: "45:23",
    uploadedAt: "2 hours ago",
    workspace: "Tech Talk Show",
    status: "completed"
  };

  const transcript = `[00:00] Welcome to Tech Talk Show. I'm your host, John Smith, and today we're diving deep into the future of artificial intelligence in business.

[00:15] Joining me today is Dr. Sarah Johnson, a leading AI researcher at Stanford University, and Mark Thompson, CTO of InnovateTech Solutions.

[00:30] Dr. Johnson, let's start with you. How do you see AI transforming business operations in the next five years?

[01:45] Dr. Johnson: That's a great question, John. I think we're at an inflection point where AI is moving from experimental to essential. We're seeing three major areas of transformation...

[02:15] First, automation of routine tasks. This isn't just about manufacturing anymore - we're talking about customer service, data analysis, even creative tasks like content generation.

[03:30] Second, predictive analytics are becoming incredibly sophisticated. Businesses can now forecast demand, identify potential issues, and optimize operations in real-time.

[04:45] Third, personalization at scale. AI enables companies to deliver truly personalized experiences to millions of customers simultaneously.

[05:30] Mark Thompson: I'd add to that from a practical perspective. At InnovateTech, we've implemented AI across our entire operations stack...

[06:00] We've seen a 40% reduction in customer support tickets through AI-powered chatbots, and our sales forecasting accuracy has improved by 60%.

[07:15] But the real game-changer is what we call 'augmented decision making' - where AI doesn't replace human judgment but enhances it with data-driven insights.

[08:30] John: That's fascinating. Let's talk about the challenges. What are the biggest obstacles businesses face when implementing AI?

[09:00] Dr. Johnson: The number one challenge is data quality and quantity. AI is only as good as the data it's trained on...

[Continue transcript...]`;

  const blogPost = `# The Future of AI in Business: Transforming Operations and Enhancing Human Potential

In our latest Tech Talk Show episode, we explored how artificial intelligence is revolutionizing business operations across industries. Featuring insights from Dr. Sarah Johnson of Stanford University and Mark Thompson, CTO of InnovateTech Solutions, this discussion reveals the three critical areas where AI is making the biggest impact.

## The Three Pillars of AI Transformation

### 1. Intelligent Automation Beyond Manufacturing

Gone are the days when automation was limited to factory floors. Today's AI-powered automation is transforming:

- **Customer Service**: Advanced chatbots and virtual assistants handle complex queries
- **Data Analysis**: Automated insights from vast datasets in real-time
- **Creative Tasks**: AI assists in content generation, design, and strategic planning

Dr. Johnson emphasizes that this shift represents moving AI "from experimental to essential" in business operations.

### 2. Predictive Analytics Revolution

Modern AI systems offer unprecedented forecasting capabilities:

- **Demand Forecasting**: Predict market trends with remarkable accuracy
- **Issue Prevention**: Identify potential problems before they occur
- **Real-time Optimization**: Continuously improve operations based on live data

InnovateTech Solutions has achieved a 60% improvement in sales forecasting accuracy using these technologies.

### 3. Personalization at Scale

Perhaps the most customer-facing benefit is AI's ability to deliver personalized experiences to millions of users simultaneously. This capability enables:

- Customized product recommendations
- Tailored marketing messages
- Individualized user interfaces
- Dynamic pricing strategies

## Real-World Implementation Success

Mark Thompson shares InnovateTech's remarkable results:

- **40% reduction** in customer support tickets through AI chatbots
- **60% improvement** in sales forecasting accuracy
- Introduction of "augmented decision making" - enhancing human judgment with AI insights

## Overcoming Implementation Challenges

The biggest obstacle to AI adoption remains **data quality and quantity**. As Dr. Johnson notes, "AI is only as good as the data it's trained on." Successful implementation requires:

1. **Data Strategy**: Comprehensive data collection and cleaning processes
2. **Change Management**: Preparing teams for AI-augmented workflows
3. **Ethical Considerations**: Ensuring responsible AI deployment
4. **Continuous Learning**: Adapting to rapidly evolving AI capabilities

## The Path Forward

The future of AI in business isn't about replacing humans but augmenting human capabilities. Organizations that embrace this collaborative approach will lead the next wave of business innovation.

*Ready to explore AI for your business? Start with a clear data strategy and focus on solving specific business problems rather than implementing AI for its own sake.*

---

**Key Takeaways:**
- AI transformation spans automation, prediction, and personalization
- Data quality is crucial for successful implementation
- Human-AI collaboration outperforms pure automation
- Start small and scale based on proven results

**Listen to the full episode** to dive deeper into these insights and discover specific strategies for implementing AI in your organization.`;

  const showNotes = `# Episode 45: The Future of AI in Business

## Guests
- **Dr. Sarah Johnson** - AI Researcher, Stanford University
- **Mark Thompson** - CTO, InnovateTech Solutions

## Key Timestamps

**[00:00 - 01:30]** Introduction and Guest Welcomes
- Show introduction and context setting
- Guest background and expertise overview

**[01:45 - 04:45]** Three Pillars of AI Transformation (Dr. Johnson)
- Automation beyond manufacturing
- Predictive analytics revolution
- Personalization at scale

**[05:30 - 08:00]** Real-World Implementation (Mark Thompson)
- InnovateTech's AI journey
- 40% reduction in support tickets
- 60% improvement in sales forecasting
- Augmented decision making concept

**[08:30 - 12:15]** Implementation Challenges
- Data quality and quantity issues
- Change management strategies
- Ethical considerations in AI deployment

**[12:30 - 18:45]** Industry-Specific Applications
- Healthcare AI innovations
- Financial services transformation
- Retail and e-commerce evolution
- Manufacturing 4.0 developments

**[19:00 - 25:30]** Future Predictions and Trends
- Next 5-year outlook for business AI
- Emerging technologies to watch
- Skills development for the AI era

**[25:45 - 30:00]** Practical Implementation Advice
- Starting your AI journey
- Measuring success and ROI
- Building AI-ready teams

**[30:15 - 35:45]** Ethical AI and Responsible Deployment
- Bias mitigation strategies
- Transparency in AI decision-making
- Regulatory compliance considerations

**[36:00 - 42:30]** Q&A and Listener Questions
- Small business AI adoption
- Cost considerations and budgeting
- Common implementation mistakes

**[42:45 - 45:23]** Closing Thoughts and Resources
- Key takeaways summary
- Recommended reading and resources
- Next episode preview

## Episode Resources

### Mentioned Tools and Platforms
- TensorFlow and PyTorch for ML development
- AWS AI/ML services
- Google Cloud AI Platform
- Microsoft Azure Cognitive Services

### Recommended Reading
- "Prediction Machines" by Ajay Agrawal
- "The AI Advantage" by Thomas Davenport
- "Human + Machine" by Paul Daugherty

### Useful Links
- Stanford AI Research: ai.stanford.edu
- InnovateTech Solutions: innovatetech.com
- AI Ethics Guidelines: partnership.ai

## Episode Stats
- **Duration**: 45 minutes 23 seconds
- **Recording Date**: January 15, 2024
- **Guests**: 2
- **Topics Covered**: 8 major themes
- **Practical Tips**: 15+ actionable insights

*Subscribe to Tech Talk Show for weekly deep dives into technology trends shaping the future of business.*`;

  const socialCaptions = {
    twitter: `🚀 Just dropped: "The Future of AI in Business" 

Key insights from Stanford's Dr. Sarah Johnson & InnovateTech CTO:

✅ 40% reduction in support tickets with AI
✅ 60% better sales forecasting 
✅ AI augments human decision-making

The future isn't human vs AI - it's human + AI 🤝

Listen now: [link] #AI #BusinessTech #PodcastEpisode`,

    instagram: `🎙️ NEW EPISODE ALERT 🎙️

"The Future of AI in Business" is now live!

💡 Featuring:
• Dr. Sarah Johnson (Stanford AI Research)
• Mark Thompson (InnovateTech CTO)

🔥 What you'll learn:
• 3 pillars of AI transformation
• Real results: 40% support reduction
• How to start your AI journey
• Ethical AI implementation

Swipe for key takeaways ➡️

Link in bio to listen! 

#PodcastLife #AIRevolution #BusinessTech #TechTalk #Innovation #FutureOfWork #Entrepreneur #TechPodcast #AI #MachineLearning`,

    linkedin: `🎯 How is AI actually transforming business operations?

Our latest Tech Talk Show episode features Dr. Sarah Johnson from Stanford University and Mark Thompson, CTO of InnovateTech Solutions, sharing real-world insights on AI implementation.

🔍 Key Discussion Points:
→ Moving AI from experimental to essential business operations
→ The three critical areas of AI transformation
→ InnovateTech's 40% reduction in support tickets and 60% improvement in sales forecasting
→ "Augmented decision making" - enhancing human judgment with AI

💡 Main Takeaway: The future isn't about replacing humans with AI, but creating powerful human-AI collaboration.

Whether you're just starting your AI journey or looking to scale existing implementations, this episode provides actionable insights for business leaders.

What's your organization's biggest AI challenge? Share in the comments 👇

🎧 Listen to the full episode: [link]

#ArtificialIntelligence #BusinessStrategy #DigitalTransformation #TechLeadership #Innovation #FutureOfWork`,

    tiktok: `POV: You're 5 years behind on AI and your competition isn't 📈

🔥 Mind-blowing AI stats from our latest podcast:

✅ 40% fewer customer complaints
✅ 60% better sales predictions  
✅ AI + humans = unstoppable combo

Stop thinking AI will replace you. Start thinking about how to work WITH it 🤝

Full episode link in bio! 

#AITips #BusinessHacks #TechTalk #FutureOfWork #AIRevolution #PodcastTok #BusinessTech #Innovation`
  };

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedContent(type);
    setTimeout(() => setCopiedContent(null), 2000);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/dashboard" className="mt-1">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              {episode.workspace}
            </Badge>
            <Badge variant="default" className="bg-green-100 text-green-800">
              {episode.status}
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{episode.title}</h1>
          <p className="text-gray-600 mb-4">{episode.description}</p>
          
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {episode.duration}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {episode.uploadedAt}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              1,250 views
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Regenerate All
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="blog" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="blog">SEO Blog Post</TabsTrigger>
          <TabsTrigger value="notes">Show Notes</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        {/* SEO Blog Post */}
        <TabsContent value="blog">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  SEO Blog Post
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopy(blogPost, 'blog')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedContent === 'blog' ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                  {blogPost}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Show Notes */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Show Notes with Timestamps
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopy(showNotes, 'notes')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedContent === 'notes' ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                  {showNotes}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media */}
        <TabsContent value="social">
          <div className="grid gap-6">
            {/* Twitter */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Twitter className="h-5 w-5" />
                    Twitter/X
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopy(socialCaptions.twitter, 'twitter')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedContent === 'twitter' ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {socialCaptions.twitter}
                  </pre>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Character count: {socialCaptions.twitter.length}/280
                </div>
              </CardContent>
            </Card>

            {/* Instagram */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Instagram className="h-5 w-5" />
                    Instagram
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopy(socialCaptions.instagram, 'instagram')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedContent === 'instagram' ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {socialCaptions.instagram}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* LinkedIn */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Linkedin className="h-5 w-5" />
                    LinkedIn
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopy(socialCaptions.linkedin, 'linkedin')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedContent === 'linkedin' ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {socialCaptions.linkedin}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transcript */}
        <TabsContent value="transcript">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Full Transcript
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopy(transcript, 'transcript')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedContent === 'transcript' ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                  {transcript}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata */}
        <TabsContent value="metadata">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">SEO Title</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">The Future of AI in Business: Transform Operations & Enhance Human Potential | Tech Talk Show</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Meta Description</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">Discover how AI is revolutionizing business operations. Learn from Stanford's Dr. Sarah Johnson & InnovateTech CTO about real implementation strategies, 40% support reduction, and augmented decision-making.</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Keywords</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {['AI in business', 'artificial intelligence', 'business automation', 'predictive analytics', 'digital transformation', 'machine learning', 'tech podcast'].map((keyword) => (
                      <Badge key={keyword} variant="outline">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EpisodeDetail;
