
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload as UploadIcon, 
  FileAudio, 
  Link as LinkIcon, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Mic,
  FileText,
  Share2,
  Clock,
  Sparkles,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { podcastApi, PodcastUploadResponse } from "@/services/podcastApi";
import { toast } from "sonner";
import { getStoredUploadState, updateStoredUploadState, clearStoredUploadState, storeFileData, getStoredFile, hasStoredUploadState } from "@/utils/uploadStorage";

const Upload = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { workspaces, currentWorkspace } = useWorkspace();

  
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<"idle" | "uploading" | "transcribing" | "generating" | "saving" | "complete">("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [podcastUrl, setPodcastUrl] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeDescription, setEpisodeDescription] = useState("");
  const [isRestoringState, setIsRestoringState] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [completedEpisodeId, setCompletedEpisodeId] = useState<string | null>(null);

  // Restore upload state from localStorage on mount
  useEffect(() => {
    const restoreUploadState = async () => {
      if (hasStoredUploadState()) {
        setIsRestoringState(true);
        
        try {
          const storedState = getStoredUploadState();
          
          // Restore form fields
          setUploadMethod(storedState.uploadMethod);
          setSelectedWorkspace(storedState.selectedWorkspace);
          setEpisodeTitle(storedState.episodeTitle);
          setEpisodeDescription(storedState.episodeDescription);
          
          // Restore file if it exists
          if (storedState.fileData) {
            const restoredFile = getStoredFile();
            if (restoredFile) {
              setSelectedFile(restoredFile);
              toast.success(
                `📁 Restored uploaded file: ${restoredFile.name}`,
                { duration: 3000 }
              );
            }
          }
          
          // Restore URL if it exists
          if (storedState.urlData) {
            setPodcastUrl(storedState.urlData.url);
            toast.success(
              `🔗 Restored podcast URL`,
              { duration: 3000 }
            );
          }
          
          console.log('✅ Upload state restored from localStorage');
        } catch (error) {
          console.warn('Failed to restore upload state:', error);
          clearStoredUploadState();
        } finally {
          setIsRestoringState(false);
        }
      }
    };
    
    restoreUploadState();
  }, []);

  // Set default workspace when workspaces load
  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspace) {
      const defaultWorkspace = currentWorkspace || workspaces[0];
      setSelectedWorkspace(defaultWorkspace.id);
    }
  }, [workspaces, currentWorkspace, selectedWorkspace]);

  const contentTypes = [
    { icon: FileText, name: "SEO Blog Post", description: "Search-optimized article", color: "bg-emerald-500" },
    { icon: Share2, name: "Social Captions", description: "Multi-platform ready", color: "bg-blue-500" },
    { icon: Clock, name: "Show Notes", description: "Timestamped highlights", color: "bg-purple-500" },
    { icon: Mic, name: "SEO Metadata", description: "Titles & descriptions", color: "bg-orange-500" }
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setEpisodeTitle(file.name.replace(/\.[^/.]+$/, ""));
      
      // Store file in localStorage for persistence
      try {
        await storeFileData(file);
        // Also update other form state
        updateStoredUploadState({
          uploadMethod,
          selectedWorkspace,
          episodeTitle: file.name.replace(/\.[^/.]+$/, ""),
          episodeDescription,
        });
      } catch (error) {
        console.warn('Failed to store file data:', error);
      }
    }
  };

  const processWithBackend = async () => {
    if (!selectedFile || !currentUser) {
      toast.error("Please select a file and ensure you're logged in");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingStep("uploading");
    setUploadProgress(0);
    setProcessingProgress(0);

    try {
      // Step 1: Quick upload to get upload_id with animated progress
      setProcessingProgress(10);
      const uploadResponse: PodcastUploadResponse = await podcastApi.quickUploadAndProcess(
        selectedFile,
        currentUser.uid,
        selectedWorkspace || undefined
      );

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || "Upload failed");
      }

      setUploadId(uploadResponse.upload_id || null);
      setUploadProgress(100);
      setProcessingProgress(25);
      toast.success("File uploaded successfully! Processing started...");

      // Clear upload state since processing has started
      clearStoredUploadState();

      // Step 2: Transcription with animated progress
      setProcessingStep("transcribing");
      toast.info("Transcribing audio with Deepgram...");
      
      // Simulate realistic transcription progress
      for (let i = 25; i <= 50; i += 2) {
        setProcessingProgress(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setProcessingStep("generating");
      setProcessingProgress(60);
      toast.info("Generating SEO content with Gemini AI...");
      
      // Simulate SEO generation progress
      for (let i = 60; i <= 85; i += 3) {
        setProcessingProgress(i);
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      setProcessingStep("saving");
      setProcessingProgress(90);
      toast.info("Saving all content to your workspace...");
      
      // Final saving step
      for (let i = 90; i <= 100; i += 2) {
        setProcessingProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Final step - completing and preparing for navigation
      setProcessingStep("complete");
      setProcessingProgress(100);
      
      // Store the episode ID for navigation (using upload_id as proxy)
      setCompletedEpisodeId(uploadResponse.upload_id || null);
      toast.success("Episode processed successfully!");
      
      // Wait for backend processing to complete before navigating
      if (uploadResponse.upload_id) {
        setCompletedEpisodeId(uploadResponse.upload_id);
        
        // Poll for episode availability before auto-navigation
        const pollForEpisode = async () => {
          let attempts = 0;
          const maxAttempts = 60; // 60 seconds max wait (backend processing can take time)
          
          const checkEpisode = async () => {
            try {
              console.log(`Polling attempt ${attempts + 1}/${maxAttempts} for upload_id: ${uploadResponse.upload_id}`);
              await podcastApi.getPodcastByUploadId(uploadResponse.upload_id);
              
              console.log('Episode found! Navigating to episode detail page...');
              // Episode is ready, navigate immediately without extra delay
              navigate(`/episode/${uploadResponse.upload_id}`);
            } catch (error) {
              attempts++;
              if (attempts < maxAttempts) {
                // Try again in 2 seconds (increased interval to reduce server load)
                setTimeout(checkEpisode, 2000);
              } else {
                console.warn('Episode not ready after 2 minutes. Backend processing may still be in progress.');
                // Show a message to the user that they can manually navigate later
                toast.info('Processing is taking longer than expected. You can check your workspace for the completed episode.');
                // Reset processing state so user can try again or navigate manually
                setIsProcessing(false);
                setProcessingStep("idle");
                setProcessingProgress(0);
              }
            }
          };
          
          // Start polling after a 5-second delay to give backend time to start processing
          setTimeout(checkEpisode, 5000);
        };
        
        pollForEpisode();
      } else {
        // Fallback navigation if no upload_id
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
      
    } catch (error) {
      console.error("Processing error:", error);
      setError(error instanceof Error ? error.message : "An error occurred during processing");
      toast.error("Processing failed. Please try again.");
      setProcessingProgress(0);
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadMethod === "file" && !selectedFile) {
      toast.error("Please select a file");
      return;
    }
    
    if (uploadMethod === "url" && !podcastUrl) {
      toast.error("Please enter a podcast URL");
      return;
    }

    if (uploadMethod === "file" && selectedFile) {
      processWithBackend();
    } else if (uploadMethod === "url" && podcastUrl) {
      toast.error("URL upload not yet implemented");
    } else {
      toast.error("Please select a file or enter a URL");
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setEpisodeTitle(file.name.replace(/\.[^/.]+$/, ""));
      
      // Store file in localStorage for persistence
      try {
        await storeFileData(file);
        // Also update other form state
        updateStoredUploadState({
          uploadMethod,
          selectedWorkspace,
          episodeTitle: file.name.replace(/\.[^/.]+$/, ""),
          episodeDescription,
        });
      } catch (error) {
        console.warn('Failed to store file data:', error);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  // Update localStorage when form fields change
  const handleFormFieldChange = (field: string, value: string) => {
    updateStoredUploadState({
      uploadMethod,
      selectedWorkspace,
      episodeTitle,
      episodeDescription,
      [field]: value,
    });
  };

  const isCurrentlyProcessing = processingStep !== "idle";

  return (
    <div className="min-h-screen blue-gradient-soft">
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload New Episode</h1>
          <p className="text-gray-600 text-lg">
            Transform your podcast episode into SEO content in minutes
          </p>
          {isRestoringState && (
            <div className="mt-2 flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Restoring previous upload...</span>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <Card className="border-0 glass-effect shadow-2xl overflow-hidden">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <div className="relative inline-block mb-6">
                  {/* Animated pulse rings */}
                  <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping"></div>
                  <div className="absolute inset-0 rounded-full bg-blue-300 opacity-30 animate-pulse"></div>
                  <div className="relative">
                    <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                    <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                  </div>
                  {/* Floating sparkles */}
                  <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
                  <Sparkles className="h-3 w-3 text-blue-400 absolute -bottom-1 -left-1 animate-pulse" />
                </div>
                
                <h3 className="text-3xl font-bold text-blue-900 mb-3 animate-pulse">
                  {processingStep === "uploading" && "Uploading your episode..."}
                  {processingStep === "transcribing" && "Transcribing audio content..."}
                  {processingStep === "generating" && "Generating amazing content..."}
                  {processingStep === "saving" && "Saving to your workspace..."}
                  {processingStep === "complete" && "Processing complete!"}
                </h3>
                <p className="text-blue-700 text-lg mb-4">
                  {processingStep === "uploading" && "Securely uploading your file to our servers"}
                  {processingStep === "transcribing" && "AI is converting speech to text with high accuracy"}
                  {processingStep === "generating" && "Creating SEO-optimized content from your episode"}
                  {processingStep === "saving" && "Storing all generated content in your database"}
                  {processingStep === "complete" && "Finalizing your episode and preparing to redirect..."}
                </p>
                
                {/* Overall Progress Bar */}
                <div className="mb-8 max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-blue-600 mb-2">
                    <span>Progress</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="relative">
                    <Progress value={processingProgress} className="h-4 mb-2" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Form */}
        {!isProcessing && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Method */}
            <Card className="glass-effect border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Choose Upload Method</CardTitle>
                <CardDescription className="text-base">
                  Upload an audio file or provide a URL to your episode
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Method Selection */}
                <div className="flex gap-4">
                  <Button
                    variant={uploadMethod === "file" ? "default" : "outline"}
                    onClick={() => {
                      setUploadMethod("file");
                      handleFormFieldChange('uploadMethod', 'file');
                    }}
                    className="flex-1"
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  <Button
                    variant={uploadMethod === "url" ? "default" : "outline"}
                    onClick={() => {
                      setUploadMethod("url");
                      handleFormFieldChange('uploadMethod', 'url');
                    }}
                    className="flex-1"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Paste URL
                  </Button>
                </div>

                {/* File Upload */}
                {uploadMethod === "file" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file" className="text-base font-semibold">Audio File</Label>
                      <div className="mt-2">
                        <input
                          id="file"
                          type="file"
                          accept="audio/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="file"
                          className={`flex flex-col items-center justify-center w-full h-40 border-3 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                            selectedFile 
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-700' 
                              : 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-600'
                          }`}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                        >
                          {selectedFile ? (
                            <div className="text-center">
                              <FileAudio className="mx-auto h-12 w-12 text-blue-600 mb-2" />
                              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <CheckCircle className="h-5 w-5 text-emerald-500 mt-2 mx-auto" />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <UploadIcon className="h-12 w-12 text-blue-500 mb-3" />
                              <p className="text-lg font-semibold text-blue-700 mb-1">Click to upload or drag and drop</p>
                              <p className="text-sm text-blue-500">MP3, WAV, M4A up to 500MB</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* URL Input */}
                {uploadMethod === "url" && (
                  <div>
                    <Label htmlFor="url" className="text-base font-semibold">Episode URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/episode.mp3"
                      value={podcastUrl}
                      onChange={(e) => {
                        setPodcastUrl(e.target.value);
                        updateStoredUploadState({
                          uploadMethod,
                          selectedWorkspace,
                          episodeTitle,
                          episodeDescription,
                          urlData: { url: e.target.value }
                        });
                      }}
                      className="mt-2 h-12 text-base border-2 focus:border-blue-400"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Supports YouTube, Spotify, Apple Podcasts, and direct audio links
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Episode Details */}
            <Card className="glass-effect border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Episode Details</CardTitle>
                <CardDescription className="text-base">
                  Provide information about your episode for better content generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="workspace" className="text-base font-semibold">Workspace</Label>
                  <Select 
                    value={selectedWorkspace} 
                    onValueChange={(value) => {
                      setSelectedWorkspace(value);
                      handleFormFieldChange('selectedWorkspace', value);
                    }}
                  >
                    <SelectTrigger className="mt-2 h-12 border-2 focus:border-blue-400">
                      <SelectValue placeholder="Select a workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaces.map((workspace) => (
                        <SelectItem key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title" className="text-base font-semibold">Episode Title</Label>
                  <Input
                    id="title"
                    value={episodeTitle}
                    onChange={(e) => {
                      setEpisodeTitle(e.target.value);
                      handleFormFieldChange('episodeTitle', e.target.value);
                    }}
                    placeholder="Enter episode title"
                    className="mt-2 h-12 text-base border-2 focus:border-blue-400"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-semibold">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={episodeDescription}
                    onChange={(e) => {
                      setEpisodeDescription(e.target.value);
                      handleFormFieldChange('episodeDescription', e.target.value);
                    }}
                    placeholder="Brief description of the episode content..."
                    className="mt-2 text-base border-2 focus:border-blue-400"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex justify-center mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700 font-medium">Processing Error</p>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {!isCurrentlyProcessing && (
          <div className="flex justify-center">
            <form onSubmit={handleSubmit}>
              <Button
                type="submit"
                size="lg"
                className="blue-gradient-intense text-white shadow-2xl px-12 py-4 text-xl font-bold"
                disabled={!selectedWorkspace || (!selectedFile && !podcastUrl) || !episodeTitle || isProcessing}
              >
                <Mic className="h-6 w-6 mr-3" />
                Start Processing
                <Sparkles className="h-5 w-5 ml-2" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
