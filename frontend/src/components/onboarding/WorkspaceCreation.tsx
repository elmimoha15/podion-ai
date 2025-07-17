
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder, Mic, CheckCircle } from "lucide-react";

interface WorkspaceCreationProps {
  onWorkspaceCreated: () => void;
}

const categories = [
  "Business & Entrepreneurship",
  "Technology",
  "Health & Wellness",
  "Education",
  "Entertainment",
  "News & Politics",
  "Sports",
  "Arts & Culture",
  "True Crime",
  "Comedy",
  "Other"
];

const WorkspaceCreation = ({ onWorkspaceCreated }: WorkspaceCreationProps) => {
  const [workspaceName, setWorkspaceName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    // Simulate workspace creation
    setTimeout(() => {
      console.log("Workspace created:", { workspaceName, description, category });
      setIsCreating(false);
      onWorkspaceCreated();
    }, 2000);
  };

  return (
    <Card className="w-full max-w-lg mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto">
          <Folder className="h-6 w-6 text-white" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">Create your first workspace</CardTitle>
          <p className="text-gray-600 mt-2">
            Organize your podcast content in a dedicated workspace
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="workspace-name">Workspace name</Label>
          <div className="relative">
            <Mic className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="workspace-name"
              placeholder="My Awesome Podcast"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            placeholder="Tell us about your podcast..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleCreate}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          disabled={isCreating || !workspaceName.trim() || !category}
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Creating workspace...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Create Workspace
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkspaceCreation;
