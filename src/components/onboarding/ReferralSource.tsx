
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Users, Search, MessageCircle, Tv, Share, Globe } from "lucide-react";

interface ReferralSourceProps {
  onSourceSelected: (source: string, details?: string) => void;
}

const sources = [
  { id: "search", label: "Google Search", icon: Search },
  { id: "social", label: "Social Media", icon: Share },
  { id: "podcast", label: "Podcast/YouTube", icon: Tv },
  { id: "friend", label: "Friend/Colleague", icon: Users },
  { id: "community", label: "Online Community", icon: MessageCircle },
  { id: "other", label: "Other", icon: Globe }
];

const ReferralSource = ({ onSourceSelected }: ReferralSourceProps) => {
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [otherDetails, setOtherDetails] = useState("");

  const handleContinue = () => {
    console.log("Referral source:", selectedSource, otherDetails);
    onSourceSelected(selectedSource, otherDetails);
  };

  return (
    <Card className="w-full max-w-lg mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">How did you hear about us?</CardTitle>
        <p className="text-gray-600">Help us understand how podcasters discover Podion AI</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <RadioGroup value={selectedSource} onValueChange={setSelectedSource}>
          <div className="space-y-3">
            {sources.map((source) => {
              const Icon = source.icon;
              return (
                <div key={source.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value={source.id} id={source.id} />
                  <Icon className="h-5 w-5 text-gray-500" />
                  <Label htmlFor={source.id} className="flex-1 cursor-pointer text-sm font-medium">
                    {source.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>

        {selectedSource === "other" && (
          <div className="space-y-2">
            <Label htmlFor="other-details">Please specify</Label>
            <Input
              id="other-details"
              placeholder="Tell us where you heard about us..."
              value={otherDetails}
              onChange={(e) => setOtherDetails(e.target.value)}
              className="h-11"
            />
          </div>
        )}

        <Button 
          onClick={handleContinue}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          disabled={!selectedSource || (selectedSource === "other" && !otherDetails.trim())}
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReferralSource;
