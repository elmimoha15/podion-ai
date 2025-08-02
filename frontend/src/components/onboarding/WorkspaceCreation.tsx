import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Folder, Mic, CheckCircle } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";

interface WorkspaceCreationProps {
  onNext: () => void;
}

const WorkspaceCreation = ({ onNext }: WorkspaceCreationProps) => {
  const [workspaceName, setWorkspaceName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { createWorkspace } = useWorkspace();

  const handleCreate = async () => {
    if (!workspaceName.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setIsCreating(true);
    
    try {
      const workspace = await createWorkspace({
        name: workspaceName.trim(),
        description: description.trim() || undefined,
      });
      
      console.log("Workspace created:", workspace);
      // Note: toast.success is already handled in the WorkspaceContext
      
      // Move to next step
      onNext();
      
    } catch (error) {
      console.error("Failed to create workspace:", error);
      // Note: toast.error is already handled in the WorkspaceContext
    } finally {
      setIsCreating(false);
    }
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



        <Button 
          onClick={handleCreate}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          disabled={isCreating || !workspaceName.trim()}
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
