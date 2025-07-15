
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Save,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { useState } from "react";

const Settings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    // Profile
    name: "John Doe",
    email: "john@example.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    
    // Preferences  
    defaultWorkspace: "1",
    language: "en",
    timezone: "America/New_York",
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    processingUpdates: true,
    
    // Content
    autoGenerateBlogs: true,
    autoGenerateSocial: true,
    autoGenerateNotes: true,
    contentLanguage: "en",
    
    // Privacy
    profileVisibility: "private",
    dataSharing: false,
    analytics: true
  });

  const workspaces = [
    { id: "1", name: "Tech Talk Show" },
    { id: "2", name: "Business Insights" }, 
    { id: "3", name: "Creative Minds" },
    { id: "4", name: "Health & Wellness" }
  ];

  const handleSave = () => {
    console.log("Saving settings:", settings);
    // Simulate API call
  };

  const handlePasswordChange = () => {
    console.log("Changing password");
    // Simulate password change
  };

  const handleDeleteAccount = () => {
    console.log("Delete account requested");
    // Show confirmation dialog
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and application preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => setSettings({...settings, name: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
                className="mt-1"
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Change Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={settings.currentPassword}
                    onChange={(e) => setSettings({...settings, currentPassword: e.target.value})}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={settings.newPassword}
                  onChange={(e) => setSettings({...settings, newPassword: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={settings.confirmPassword}
                  onChange={(e) => setSettings({...settings, confirmPassword: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
            <Button variant="outline" onClick={handlePasswordChange}>
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Customize your application experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="defaultWorkspace">Default Workspace</Label>
              <Select value={settings.defaultWorkspace} onValueChange={(value) => setSettings({...settings, defaultWorkspace: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
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
              <Label htmlFor="language">Language</Label>
              <Select value={settings.language} onValueChange={(value) => setSettings({...settings, language: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={(value) => setSettings({...settings, timezone: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive updates and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-600">Browser and mobile notifications</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Reports</p>
                <p className="text-sm text-gray-600">Summary of your content generation</p>
              </div>
              <Switch
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => setSettings({...settings, weeklyReports: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Processing Updates</p>
                <p className="text-sm text-gray-600">Real-time processing notifications</p>
              </div>
              <Switch
                checked={settings.processingUpdates}
                onCheckedChange={(checked) => setSettings({...settings, processingUpdates: checked})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Content Generation
          </CardTitle>
          <CardDescription>
            Configure automatic content generation preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-generate Blog Posts</p>
                <p className="text-sm text-gray-600">Automatically create SEO blog content</p>
              </div>
              <Switch
                checked={settings.autoGenerateBlogs}
                onCheckedChange={(checked) => setSettings({...settings, autoGenerateBlogs: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-generate Social Media</p>
                <p className="text-sm text-gray-600">Create social media captions automatically</p>
              </div>
              <Switch
                checked={settings.autoGenerateSocial}
                onCheckedChange={(checked) => setSettings({...settings, autoGenerateSocial: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-generate Show Notes</p>
                <p className="text-sm text-gray-600">Create timestamped show notes</p>
              </div>
              <Switch
                checked={settings.autoGenerateNotes}
                onCheckedChange={(checked) => setSettings({...settings, autoGenerateNotes: checked})}
              />
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label htmlFor="contentLanguage">Content Language</Label>
            <Select value={settings.contentLanguage} onValueChange={(value) => setSettings({...settings, contentLanguage: value})}>
              <SelectTrigger className="mt-1 max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Manage your privacy settings and data preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="profileVisibility">Profile Visibility</Label>
              <Select value={settings.profileVisibility} onValueChange={(value) => setSettings({...settings, profileVisibility: value})}>
                <SelectTrigger className="mt-1 max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Data Sharing for Improvements</p>
                <p className="text-sm text-gray-600">Help improve our AI models (anonymized)</p>
              </div>
              <Switch
                checked={settings.dataSharing}
                onCheckedChange={(checked) => setSettings({...settings, dataSharing: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Analytics & Usage Data</p>
                <p className="text-sm text-gray-600">Collect usage data for product improvements</p>
              </div>
              <Switch
                checked={settings.analytics}
                onCheckedChange={(checked) => setSettings({...settings, analytics: checked})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Management */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <p className="font-medium text-red-800">Delete Account</p>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default Settings;
