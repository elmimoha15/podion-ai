
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
  Clock
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
    { icon: FileText, name: "SEO Blog Post", description: "Search-optimized article" },
    { icon: Share2, name: "Social Captions", description: "Multi-platform ready" },
    { icon: Clock, name: "Show Notes", description: "Timestamped highlights" },
    { icon: Mic, name: "SEO Metadata", description: "Titles & descriptions" }
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
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your episode has been successfully processed and all content has been generated.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {contentTypes.map((type, index) => (
                <div key={index} className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
                  <type.icon className="h-6 w-6 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-green-800">{type.name}</span>
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 justify-center">
              <Link to="/episode/new">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  View Generated Content
                </Button>
              </Link>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Upload Another Episode
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload New Episode</h1>
        <p className="text-gray-600 mt-1">
          Transform your podcast episode into SEO content in minutes
        </p>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <span className="font-medium text-blue-900">
                {processingStep === "uploading" && "Uploading file..."}
                {processingStep === "transcribing" && "Transcribing audio..."}
                {processingStep === "generating" && "Generating content..."}
              </span>
            </div>
            
            {processingStep === "uploading" && (
              <Progress value={uploadProgress} className="mb-4" />
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {contentTypes.map((type, index) => (
                <div key={index} className="flex flex-col items-center p-3 bg-white rounded-lg border">
                  <type.icon className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-700">{type.name}</span>
                  {processingStep === "generating" ? (
                    <Loader2 className="h-4 w-4 text-blue-500 mt-1 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 mt-1" />
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
          <Card>
            <CardHeader>
              <CardTitle>Choose Upload Method</CardTitle>
              <CardDescription>
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
                    <Label htmlFor="file">Audio File</Label>
                    <div className="mt-1">
                      <input
                        id="file"
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="file"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        {file ? (
                          <div className="flex items-center gap-3">
                            <FileAudio className="h-8 w-8 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <UploadIcon className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500">MP3, WAV, M4A up to 500MB</p>
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
                  <Label htmlFor="url">Episode URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/episode.mp3"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports YouTube, Spotify, Apple Podcasts, and direct audio links
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Episode Details */}
          <Card>
            <CardHeader>
              <CardTitle>Episode Details</CardTitle>
              <CardDescription>
                Provide information about your episode for better content generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workspace">Workspace</Label>
                <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                  <SelectTrigger className="mt-1">
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
                <Label htmlFor="title">Episode Title</Label>
                <Input
                  id="title"
                  value={episodeTitle}
                  onChange={(e) => setEpisodeTitle(e.target.value)}
                  placeholder="Enter episode title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={episodeDescription}
                  onChange={(e) => setEpisodeDescription(e.target.value)}
                  placeholder="Brief description of the episode content..."
                  className="mt-1"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Types Preview */}
      {!isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle>Content to Generate</CardTitle>
            <CardDescription>
              We'll automatically create all of these content types from your episode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {contentTypes.map((type, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <type.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {!isProcessing && (
        <div className="flex justify-center">
          <form onSubmit={handleSubmit}>
            <Button
              type="submit"
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8"
              disabled={!selectedWorkspace || (!file && !url) || !episodeTitle}
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Processing
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Upload;
