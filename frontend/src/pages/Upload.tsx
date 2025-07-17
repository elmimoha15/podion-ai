
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
import { useState } from "react";
import { Link } from "react-router-dom";

const Upload = () => {
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<"idle" | "uploading" | "transcribing" | "generating" | "complete">("idle");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeDescription, setEpisodeDescription] = useState("");

  const workspaces = [
    { id: "1", name: "Tech Talk Show" },
    { id: "2", name: "Business Insights" },
    { id: "3", name: "Creative Minds" },
    { id: "4", name: "Health & Wellness" }
  ];

  const contentTypes = [
    { icon: FileText, name: "SEO Blog Post", description: "Search-optimized article", color: "bg-emerald-500" },
    { icon: Share2, name: "Social Captions", description: "Multi-platform ready", color: "bg-blue-500" },
    { icon: Clock, name: "Show Notes", description: "Timestamped highlights", color: "bg-purple-500" },
    { icon: Mic, name: "SEO Metadata", description: "Titles & descriptions", color: "bg-orange-500" }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!episodeTitle) {
        setEpisodeTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const simulateProcessing = async () => {
    setProcessingStep("uploading");
    setUploadProgress(0);
    
    // Simulate upload
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setProcessingStep("transcribing");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProcessingStep("generating");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setProcessingStep("complete");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((uploadMethod === "file" && file) || (uploadMethod === "url" && url)) {
      simulateProcessing();
    }
  };

  const isProcessing = processingStep !== "idle" && processingStep !== "complete";

  if (processingStep === "complete") {
    return (
      <div className="min-h-screen blue-gradient-soft flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl mx-auto glass-effect border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="relative mb-6">
              <CheckCircle className="h-20 w-20 text-emerald-500 mx-auto" />
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-2 -right-2" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Processing Complete!</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Your episode has been successfully processed and all content has been generated.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {contentTypes.map((type, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center p-4 bg-white/80 rounded-xl shadow-lg backdrop-blur-sm"
                >
                  <div className={`p-3 rounded-lg ${type.color} mb-3`}>
                    <type.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 mb-2">{type.name}</span>
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
              ))}
            </div>
            
            <div className="flex gap-4 justify-center">
              <Link to="/episode/new">
                <Button className="blue-gradient-intense text-white shadow-xl px-8 py-3 text-lg font-semibold">
                  <Zap className="h-5 w-5 mr-2" />
                  View Generated Content
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 px-6 py-3"
              >
                Upload Another Episode
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen blue-gradient-soft">
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload New Episode</h1>
          <p className="text-gray-600 text-lg">
            Transform your podcast episode into SEO content in minutes
          </p>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <Card className="border-0 glass-effect shadow-2xl">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                  <Loader2 className="h-12 w-12 text-blue-600" />
                  <div className="absolute inset-0 rounded-full bg-blue-200 opacity-20"></div>
                </div>
                <h3 className="text-2xl font-bold text-blue-900 mb-2">
                  {processingStep === "uploading" && "Uploading your episode..."}
                  {processingStep === "transcribing" && "Transcribing audio content..."}
                  {processingStep === "generating" && "Generating amazing content..."}
                </h3>
                <p className="text-blue-700 text-lg">
                  {processingStep === "uploading" && "Securely uploading your file to our servers"}
                  {processingStep === "transcribing" && "AI is converting speech to text with high accuracy"}
                  {processingStep === "generating" && "Creating SEO-optimized content from your episode"}
                </p>
              </div>
              
              {processingStep === "uploading" && (
                <div className="mb-8">
                  <Progress value={uploadProgress} className="h-3 mb-2" />
                  <p className="text-center text-sm text-blue-600 font-medium">{uploadProgress}% uploaded</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {contentTypes.map((type, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col items-center p-4 bg-white/90 rounded-xl border-2 border-blue-100"
                  >
                    <div className={`p-3 rounded-lg ${type.color} mb-3`}>
                      <type.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 mb-2">{type.name}</span>
                    {processingStep === "generating" ? (
                      <Loader2 className="h-5 w-5 text-blue-500" />
                    ) : (
                      <div className="h-5 w-5" />
                    )}
                  </div>
                ))}
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
                    onClick={() => setUploadMethod("file")}
                    className="flex-1"
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  <Button
                    variant={uploadMethod === "url" ? "default" : "outline"}
                    onClick={() => setUploadMethod("url")}
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
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="file"
                          className={`flex flex-col items-center justify-center w-full h-40 border-3 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                            file 
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-700' 
                              : 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-600'
                          }`}
                        >
                          {file ? (
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-emerald-500 rounded-full">
                                <FileAudio className="h-8 w-8 text-white" />
                              </div>
                              <div className="text-left">
                                <p className="text-lg font-semibold text-emerald-800">{file.name}</p>
                                <p className="text-sm text-emerald-600">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                <CheckCircle className="h-5 w-5 text-emerald-500 mt-1" />
                              </div>
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
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
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
                  <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
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
                    onChange={(e) => setEpisodeTitle(e.target.value)}
                    placeholder="Enter episode title"
                    className="mt-2 h-12 text-base border-2 focus:border-blue-400"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-semibold">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={episodeDescription}
                    onChange={(e) => setEpisodeDescription(e.target.value)}
                    placeholder="Brief description of the episode content..."
                    className="mt-2 text-base border-2 focus:border-blue-400"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Submit Button */}
        {!isProcessing && (
          <div className="flex justify-center">
            <form onSubmit={handleSubmit}>
              <Button
                type="submit"
                size="lg"
                className="blue-gradient-intense text-white shadow-2xl px-12 py-4 text-xl font-bold"
                disabled={!selectedWorkspace || (!file && !url) || !episodeTitle}
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
