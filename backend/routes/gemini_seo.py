from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import logging
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Pydantic models
class SpeakerChunk(BaseModel):
    speaker: int
    text: str
    start_time: float
    end_time: float

class SEOGenerationRequest(BaseModel):
    transcript: str = Field(..., description="Full podcast transcript text")
    speaker_chunks: Optional[List[SpeakerChunk]] = Field(None, description="Optional timestamped speaker segments")
    podcast_title: Optional[str] = Field(None, description="Optional podcast episode title")
    host_names: Optional[List[str]] = Field(None, description="Optional host names")
    guest_names: Optional[List[str]] = Field(None, description="Optional guest names")

class ShowNote(BaseModel):
    timestamp: str
    topic: str
    summary: str

class BlogPost(BaseModel):
    title: str
    meta_description: str
    intro: str
    body: str
    conclusion: str
    tags: List[str]

class SocialMediaPosts(BaseModel):
    twitter: str
    instagram: str
    tiktok: str
    linkedin: str

class SEOGenerationResponse(BaseModel):
    success: bool
    seo_title: Optional[str] = None
    show_notes: Optional[List[ShowNote]] = None
    blog_post: Optional[BlogPost] = None
    social_media: Optional[SocialMediaPosts] = None
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

def get_gemini_api_key() -> str:
    """Get Gemini API key from environment variables"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your-gemini-api-key-here":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key not configured. Please set GEMINI_API_KEY environment variable."
        )
    return api_key

def configure_gemini():
    """Configure Gemini AI with API key"""
    api_key = get_gemini_api_key()
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-pro')

def format_speaker_chunks(speaker_chunks: List[SpeakerChunk]) -> str:
    """Format speaker chunks into a readable format for the prompt"""
    if not speaker_chunks:
        return ""
    
    formatted = "\n\nSPEAKER BREAKDOWN:\n"
    for chunk in speaker_chunks:
        minutes = int(chunk.start_time // 60)
        seconds = int(chunk.start_time % 60)
        formatted += f"[{minutes:02d}:{seconds:02d}] Speaker {chunk.speaker}: {chunk.text}\n"
    
    return formatted

def create_seo_prompt(request: SEOGenerationRequest) -> str:
    """Create a comprehensive prompt for Gemini to generate SEO content"""
    
    speaker_info = format_speaker_chunks(request.speaker_chunks) if request.speaker_chunks else ""
    
    # Build context information
    context = ""
    if request.podcast_title:
        context += f"Podcast Episode: {request.podcast_title}\n"
    if request.host_names:
        context += f"Host(s): {', '.join(request.host_names)}\n"
    if request.guest_names:
        context += f"Guest(s): {', '.join(request.guest_names)}\n"
    
    prompt = f"""
You are an expert SEO content creator and podcast marketing specialist. Your task is to analyze the following podcast transcript and generate comprehensive, discoverable, and viral SEO content.

{context}

PODCAST TRANSCRIPT:
{request.transcript}

{speaker_info}

Please generate the following content in JSON format:

1. **SEO-Friendly Title**: Create a compelling, keyword-rich title (50-60 characters) that would rank well in search engines and attract clicks.

2. **Show Notes**: Generate 5-8 show notes with timestamps. Each should include:
   - timestamp (MM:SS format)
   - topic (concise topic name)
   - summary (1-2 sentence description)

3. **SEO Blog Post**: Create a full blog post with:
   - title: SEO-optimized title (different from main title)
   - meta_description: 150-160 characters for search results
   - intro: Engaging 2-3 paragraph introduction
   - body: Comprehensive content with H2/H3 headings, naturally incorporating keywords
   - conclusion: Strong closing with call-to-action
   - tags: 8-12 relevant SEO tags/keywords

4. **Social Media Posts**:
   - twitter: Hook-style tweet (280 chars max) with relevant hashtags
   - instagram: Engaging caption with 10-15 hashtags and emoji
   - tiktok: Trending-style caption with viral hooks and hashtags
   - linkedin: Professional post focusing on insights and value

**Content Guidelines:**
- Focus on discoverability and viral potential
- Use trending keywords and phrases
- Make content actionable and valuable
- Include relevant industry terminology
- Optimize for different platform algorithms
- Ensure content is engaging and shareable

**Output Format:**
Return ONLY a JSON object with this exact structure:
```json
{{
  "seo_title": "...",
  "show_notes": [
    {{"timestamp": "MM:SS", "topic": "...", "summary": "..."}},
    ...
  ],
  "blog_post": {{
    "title": "...",
    "meta_description": "...",
    "intro": "...",
    "body": "...",
    "conclusion": "...",
    "tags": ["tag1", "tag2", ...]
  }},
  "social_media": {{
    "twitter": "...",
    "instagram": "...",
    "tiktok": "...",
    "linkedin": "..."
  }}
}}
```

Generate viral, discoverable, keyword-rich content that will perform well across all platforms and search engines.
"""
    
    return prompt

async def generate_seo_content_with_gemini(request: SEOGenerationRequest) -> dict:
    """Generate SEO content using Gemini 1.5 Pro"""
    
    try:
        model = configure_gemini()
        prompt = create_seo_prompt(request)
        
        logger.info(f"Generating SEO content with Gemini 1.5 Pro")
        logger.info(f"Transcript length: {len(request.transcript)} characters")
        
        # Generate content with Gemini
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,  # Creative but consistent
                top_p=0.8,
                top_k=40,
                max_output_tokens=8192,  # Large output for comprehensive content
            )
        )
        
        # Extract JSON from response
        content = response.text.strip()
        
        # Remove code block markers if present
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        
        # Parse JSON response
        try:
            result = json.loads(content)
            logger.info("Successfully generated SEO content")
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response: {e}")
            logger.error(f"Raw response: {content[:500]}...")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to parse Gemini response as JSON"
            )
    
    except Exception as e:
        logger.error(f"Error generating content with Gemini: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate SEO content: {str(e)}"
        )

@router.post("/generate-seo", response_model=SEOGenerationResponse)
async def generate_seo_content(request: SEOGenerationRequest):
    """
    Generate comprehensive SEO content from podcast transcript using Gemini 1.5 Pro
    
    Creates:
    - SEO-friendly title
    - Timestamped show notes
    - Full SEO blog post with meta description
    - Social media posts for Twitter, Instagram, TikTok, LinkedIn
    
    Perfect for podcasters who want to:
    - Improve discoverability through SEO
    - Create viral social media content
    - Generate comprehensive show notes
    - Repurpose content across platforms
    """
    
    try:
        # Validate input
        if not request.transcript or len(request.transcript.strip()) < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transcript must be at least 100 characters long"
            )
        
        logger.info(f"Starting SEO content generation")
        logger.info(f"Transcript length: {len(request.transcript)} characters")
        logger.info(f"Speaker chunks: {len(request.speaker_chunks) if request.speaker_chunks else 0}")
        
        # Generate content with Gemini
        gemini_result = await generate_seo_content_with_gemini(request)
        
        # Parse and structure the response
        show_notes = []
        if gemini_result.get("show_notes"):
            for note in gemini_result["show_notes"]:
                show_notes.append(ShowNote(
                    timestamp=note.get("timestamp", "00:00"),
                    topic=note.get("topic", ""),
                    summary=note.get("summary", "")
                ))
        
        blog_post = None
        if gemini_result.get("blog_post"):
            bp = gemini_result["blog_post"]
            blog_post = BlogPost(
                title=bp.get("title", ""),
                meta_description=bp.get("meta_description", ""),
                intro=bp.get("intro", ""),
                body=bp.get("body", ""),
                conclusion=bp.get("conclusion", ""),
                tags=bp.get("tags", [])
            )
        
        social_media = None
        if gemini_result.get("social_media"):
            sm = gemini_result["social_media"]
            social_media = SocialMediaPosts(
                twitter=sm.get("twitter", ""),
                instagram=sm.get("instagram", ""),
                tiktok=sm.get("tiktok", ""),
                linkedin=sm.get("linkedin", "")
            )
        
        # Prepare metadata
        metadata = {
            "transcript_length": len(request.transcript),
            "show_notes_count": len(show_notes),
            "speaker_chunks_provided": len(request.speaker_chunks) if request.speaker_chunks else 0,
            "blog_post_word_count": len(blog_post.body.split()) if blog_post else 0,
            "model": "gemini-1.5-pro",
            "generation_type": "seo_content_suite"
        }
        
        logger.info(f"Generated SEO content successfully")
        logger.info(f"Show notes: {len(show_notes)} entries")
        logger.info(f"Blog post: {len(blog_post.body.split()) if blog_post else 0} words")
        
        return SEOGenerationResponse(
            success=True,
            seo_title=gemini_result.get("seo_title", ""),
            show_notes=show_notes,
            blog_post=blog_post,
            social_media=social_media,
            metadata=metadata
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"SEO generation failed: {str(e)}")
        
        return SEOGenerationResponse(
            success=False,
            error=f"SEO content generation failed: {str(e)}"
        )

@router.get("/generate-seo")
async def seo_generation_info():
    """Get information about the SEO content generation service"""
    return {
        "message": "Gemini 1.5 Pro SEO content generation service for podcasters",
        "model": "gemini-1.5-pro",
        "capabilities": [
            "SEO-friendly titles",
            "Timestamped show notes",
            "Full blog posts with meta descriptions",
            "Multi-platform social media content",
            "Keyword optimization",
            "Viral content hooks"
        ],
        "social_platforms": ["Twitter", "Instagram", "TikTok", "LinkedIn"],
        "content_types": {
            "seo_title": "50-60 character optimized title",
            "show_notes": "5-8 timestamped topic summaries",
            "blog_post": "Full post with headings and SEO tags",
            "social_media": "Platform-specific optimized posts"
        },
        "input_requirements": {
            "transcript": "Required - minimum 100 characters",
            "speaker_chunks": "Optional - timestamped speaker segments",
            "podcast_title": "Optional - episode title",
            "host_names": "Optional - host names",
            "guest_names": "Optional - guest names"
        },
        "optimization_focus": [
            "Search engine discoverability",
            "Social media virality", 
            "Keyword richness",
            "Platform algorithm compatibility",
            "Engagement optimization"
        ]
    } 