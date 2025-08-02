import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  episodeTitle: string;
  isDeleting: boolean;
}

export const DeleteEpisodeModal: React.FC<DeleteEpisodeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  episodeTitle,
  isDeleting
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Delete Episode
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-700">
            Are you sure you want to delete <span className="font-semibold">"{episodeTitle}"</span>? 
            This will permanently remove the episode and all its associated content including:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-600 ml-4">
            <li>• Audio file and transcript</li>
            <li>• Generated SEO content</li>
            <li>• Show notes and blog posts</li>
            <li>• Social media content</li>
          </ul>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Episode'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
