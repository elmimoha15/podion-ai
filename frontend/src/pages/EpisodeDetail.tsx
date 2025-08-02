
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
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { podcastApi, PodcastDocument } from "@/services/podcastApi";
import { toast } from "sonner";

const EpisodeDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [copiedContent, setCopiedContent] = useState<string | null>(null);
  const [podcast, setPodcast] = useState<PodcastDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPodcast = async () => {
      if (!id || !currentUser) {
        setError("Invalid podcast ID or user not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Determine if ID is upload_id or document_id based on format
        // upload_id format: "upload_1234567890_userId"
        // document_id format: "podcast_20250731_124749_randomId"
        let podcastData;
        
        if (id.startsWith('upload_')) {
          // This is an upload_id, fetch by upload_id
          try {
            podcastData = await podcastApi.getPodcastByUploadId(id);
            console.log("Successfully fetched podcast by upload_id:", id);
          } catch (uploadIdError) {
            console.log("Failed to fetch by upload_id, trying document_id as fallback:", uploadIdError);
            podcastData = await podcastApi.getPodcastById(id);
            console.log("Successfully fetched podcast by document_id (fallback):", id);
          }
        } else {
          // This is likely a document_id, fetch by document_id first
          try {
            podcastData = await podcastApi.getPodcastById(id);
            console.log("Successfully fetched podcast by document_id:", id);
          } catch (docIdError) {
            console.log("Failed to fetch by document_id, trying upload_id as fallback:", docIdError);
            podcastData = await podcastApi.getPodcastByUploadId(id);
            console.log("Successfully fetched podcast by upload_id (fallback):", id);
          }
        }
        
        setPodcast(podcastData);
      } catch (error) {
        console.error("Failed to fetch podcast:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load podcast";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPodcast();
  }, [id, currentUser]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen blue-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading episode details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !podcast) {
    return (
      <div className="min-h-screen blue-gradient-soft flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Episode</h2>
            <p className="text-red-600 mb-4">{error || "Episode not found"}</p>
            <Link to="/dashboard">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to extract title from episode data (prioritize SEO metadata)
  const getEpisodeTitle = (episode: any) => {
    // Check for SEO title in various locations
    const seoTitle = episode.gemini_seo_content?.seo_title || 
                    episode.seo_content?.seo_title ||
                    episode.gemini_seo_content?.metadata?.seo_title ||
                    episode.seo_content?.metadata?.seo_title ||
                    episode.metadata?.seo_title;
                    
    return seoTitle || episode.filename || 'Untitled Episode';
  };

  // Helper function to get episode duration from metadata (same as WorkspaceDetail)
  const getEpisodeDuration = (episode: any) => {
    // Try different possible locations for duration in seconds
    let durationInSeconds = null;
    
    // Check various possible locations for duration data
    if (episode.deepgram_data?.words && episode.deepgram_data.words.length > 0) {
      // Get duration from last word's end time
      const lastWord = episode.deepgram_data.words[episode.deepgram_data.words.length - 1];
      durationInSeconds = lastWord.end;
    } else if (episode.transcript?.metadata?.duration) {
      durationInSeconds = episode.transcript.metadata.duration;
    } else if (episode.processing_info?.duration) {
      durationInSeconds = episode.processing_info.duration;
    } else if (episode.metadata?.duration) {
      durationInSeconds = episode.metadata.duration;
    }
    
    if (durationInSeconds && durationInSeconds > 0) {
      const totalMinutes = Math.floor(durationInSeconds / 60);
      const seconds = Math.floor(durationInSeconds % 60);
      
      if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
      } else {
        return `${totalMinutes}m`;
      }
    }
    
    return 'Unknown'; // Show unknown instead of fake duration
  };

  // Helper function to format upload date (same as WorkspaceDetail)
  const formatUploadDate = (episode: any) => {
    // Try different possible date formats
    let dateStr = episode.created_at || episode.metadata?.created_at;
    
    if (dateStr) {
      let date;
      
      // Handle Firestore timestamp format
      if (typeof dateStr === 'object' && dateStr.seconds) {
        date = new Date(dateStr.seconds * 1000);
      } else if (typeof dateStr === 'string') {
        date = new Date(dateStr);
      } else {
        date = new Date(dateStr);
      }
      
      if (!isNaN(date.getTime())) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const episodeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        // Check if the episode was created today
        if (episodeDate.getTime() === today.getTime()) {
          // Show exact time only (e.g., "2:35 PM")
          return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        } else {
          // Show full date and time (e.g., "July 29, 2025 – 10:12 AM")
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) + ' – ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      }
    }
    return 'Unknown date';
  };

  // Extract data from podcast object
  const episode = {
    id: podcast.id,
    title: getEpisodeTitle(podcast),
    description: "", // Could be added to backend later
    duration: getEpisodeDuration(podcast),
    uploadedAt: formatUploadDate(podcast),
    workspaceId: podcast.workspace_id || null
  };

  const transcript = podcast.transcription?.transcript || `[00:00] Welcome to Tech Talk Show. I'm your host, John Smith, and today we're diving deep into the future of artificial intelligence in business.

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

  // Helper function to format blog post content
  const formatBlogPost = (blogPostData: any) => {
    if (typeof blogPostData === 'string') {
      return blogPostData;
    }
    
    if (typeof blogPostData === 'object' && blogPostData !== null) {
      // Handle structured blog post object from backend
      const { title, intro, body, conclusion } = blogPostData;
      
      let formattedPost = '';
      
      if (title) {
        formattedPost += `# ${title}\n\n`;
      }
      
      if (intro) {
        formattedPost += `${intro}\n\n`;
      }
      
      if (body) {
        formattedPost += `${body}\n\n`;
      }
      
      if (conclusion) {
        formattedPost += `## Conclusion\n\n${conclusion}`;
      }
      
      return formattedPost;
    }
    
    // Fallback content
    return `# The Future of AI in Business: Transforming Operations and Enhancing Human Potential

In our latest Tech Talk Show episode, we explored how artificial intelligence is revolutionizing business operations across industries. Featuring insights from Dr. Sarah Johnson of Stanford University and Mark Thompson, CTO of InnovateTech Solutions, this discussion reveals the three critical areas where AI is making the biggest impact.

## The Three Pillars of AI Transformation

### 1. Intelligent Automation Beyond Manufacturing

Gone are the days when automation was limited to factory floors. Today's AI-powered automation is transforming:

- **Customer Service**: Advanced chatbots and virtual assistants handle complex queries
- **Data Analysis**: Automated insights from vast datasets in real-time
- **Content Creation**: AI assists in generating reports, summaries, and creative content
- **Decision Making**: Predictive models guide strategic business decisions

### 2. Predictive Analytics Revolution

Businesses are moving from reactive to proactive strategies through:

- **Market Forecasting**: Anticipating trends before they become obvious
- **Customer Behavior**: Understanding purchase patterns and preferences
- **Risk Management**: Identifying potential issues before they impact operations
- **Resource Optimization**: Predicting demand to optimize inventory and staffing

### 3. Personalization at Enterprise Scale

AI enables mass customization across:

- **Marketing Campaigns**: Tailored messaging for individual customers
- **Product Recommendations**: Dynamic suggestions based on behavior
- **User Experiences**: Adaptive interfaces that learn from interactions
- **Service Delivery**: Customized support based on customer history

## Implementation Insights from InnovateTech

Mark Thompson shared valuable lessons from InnovateTech's AI transformation:

> "The key is starting small and scaling based on proven results. We began with one department, measured success rigorously, and then expanded to other areas."

### Key Success Factors:

1. **Data Quality First**: Clean, organized data is essential
2. **Human-AI Collaboration**: Technology augments rather than replaces human expertise
3. **Continuous Learning**: AI systems improve with feedback and new data
4. **Change Management**: Employee training and buy-in are crucial

## Looking Forward

The future of AI in business isn't about replacement—it's about enhancement. Organizations that successfully integrate AI will:

- Operate more efficiently while maintaining human creativity
- Make data-driven decisions with confidence
- Deliver personalized experiences at scale
- Adapt quickly to market changes

## Key Takeaways

- AI transformation spans automation, prediction, and personalization
- Data quality is crucial for successful implementation
- Human-AI Collaboration outperforms pure automation
- Start small and scale based on proven results

**Listen to the full episode** to dive deeper into these insights and discover specific strategies for implementing AI in your organization.`;
  };

  const blogPost = formatBlogPost(podcast.seo_content?.blog_post);

  const showNotes = podcast.seo_content?.show_notes || `# Episode 45: The Future of AI in Business

## Episode Overview

In this comprehensive discussion, we explore the transformative impact of artificial intelligence on modern business operations. Our expert guests share real-world insights from their experiences implementing AI solutions across various industries.

## Featured Guests

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

  // Helper function to format social media content
  const formatSocialMedia = (socialMediaData: any) => {
    const defaultContent = {
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
      linkedin: `New episode of Tech Talk Show is live! 🎙️

"The Future of AI in Business: Transforming Operations and Enhancing Human Potential"

Featuring insights from:
• Dr. Sarah Johnson - AI Researcher at Stanford University
• Mark Thompson - CTO at InnovateTech Solutions

Key takeaways:
→ AI transformation spans automation, prediction, and personalization
→ Data quality is crucial for successful implementation
→ Human-AI collaboration outperforms pure automation
→ Start small and scale based on proven results

Listen now: [link]

#AI #BusinessTransformation #TechPodcast #Innovation #Leadership`,
      facebook: `🎧 New Tech Talk Show Episode!

"The Future of AI in Business" explores how artificial intelligence is revolutionizing business operations across industries.

Our expert guests share real-world insights:
• Dr. Sarah Johnson (Stanford University)
• Mark Thompson (InnovateTech Solutions)

Discover the three critical areas where AI is making the biggest impact and learn practical strategies for implementation.

Listen now: [link]

#TechTalkShow #AI #Business #Innovation #Podcast`
    };

    if (!socialMediaData || typeof socialMediaData !== 'object') {
      return defaultContent;
    }

    return {
      twitter: socialMediaData.twitter || defaultContent.twitter,
      instagram: socialMediaData.instagram || defaultContent.instagram,
      linkedin: socialMediaData.linkedin || defaultContent.linkedin,
      facebook: socialMediaData.facebook || defaultContent.facebook
    };
  };

  const socialCaptions = formatSocialMedia(podcast.seo_content?.social_media);

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedContent(type);
    setTimeout(() => setCopiedContent(null), 2000);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to={episode.workspaceId ? `/workspace/${episode.workspaceId}` : "/dashboard"} className="mt-1">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        
        <div className="flex-1">
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
                    <p className="text-sm">
                      {getEpisodeTitle(podcast) !== 'Untitled Episode' ? getEpisodeTitle(podcast) : 'No SEO title generated'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Meta Description</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      {podcast.gemini_seo_content?.blog_post?.meta_description || 
                       podcast.seo_content?.blog_post?.meta_description ||
                       podcast.gemini_seo_content?.metadata?.meta_description ||
                       podcast.seo_content?.metadata?.meta_description ||
                       'No meta description generated'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Keywords</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {(() => {
                      const keywords = podcast.gemini_seo_content?.metadata?.keywords || 
                                     podcast.seo_content?.metadata?.keywords ||
                                     podcast.gemini_seo_content?.keywords ||
                                     podcast.seo_content?.keywords ||
                                     [];
                      
                      const keywordArray = Array.isArray(keywords) ? keywords : 
                                         typeof keywords === 'string' ? keywords.split(',').map(k => k.trim()) : 
                                         [];
                      
                      return keywordArray.length > 0 ? 
                        keywordArray.map((keyword, index) => (
                          <Badge key={index} variant="outline">{keyword}</Badge>
                        )) : 
                        <span className="text-sm text-gray-500 italic">No keywords generated</span>;
                    })()}
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
