
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
  CreditCard, 
  Palette,
  Globe,
  Download,
  Trash2,
  Key,
  Mail,
  Phone,
  Lock
} from "lucide-react";

const Settings = () => {
  return (
    <div className="min-h-screen blue-gradient-soft">
      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600 text-lg">
            Manage your account preferences and application settings
          </p>
        </div>

        {/* Profile Settings */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>
              Update your personal information and profile details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue="Doe" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input id="email" type="email" defaultValue="john@example.com" className="flex-1" />
                <Badge variant="secondary" className="flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" defaultValue="Acme Inc." />
            </div>
            
            <Button className="blue-gradient text-white">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-600" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-gray-500">Receive updates via email</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Processing Complete</div>
                  <div className="text-sm text-gray-500">When your episode processing is finished</div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Weekly Summary</div>
                  <div className="text-sm text-gray-500">Weekly report of your content performance</div>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Marketing Updates</div>
                  <div className="text-sm text-gray-500">Product updates and feature announcements</div>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Manage your account security and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-500">Add an extra layer of security to your account</div>
                </div>
                <Button variant="outline" size="sm">
                  <Key className="h-4 w-4 mr-2" />
                  Enable
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Change Password</div>
                  <div className="text-sm text-gray-500">Update your account password</div>
                </div>
                <Button variant="outline" size="sm">
                  <Lock className="h-4 w-4 mr-2" />
                  Change
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Active Sessions</div>
                  <div className="text-sm text-gray-500">Manage your active login sessions</div>
                </div>
                <Button variant="outline" size="sm">
                  View Sessions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-blue-600" />
              <CardTitle>Preferences</CardTitle>
            </div>
            <CardDescription>
              Customize your application experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
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
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Time</SelectItem>
                    <SelectItem value="pst">Pacific Time</SelectItem>
                    <SelectItem value="cet">Central European Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Dark Mode</div>
                  <div className="text-sm text-gray-500">Toggle dark mode interface</div>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto-Save</div>
                  <div className="text-sm text-gray-500">Automatically save your work</div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-blue-600" />
              <CardTitle>Data & Privacy</CardTitle>
            </div>
            <CardDescription>
              Manage your data and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Export Data</div>
                  <div className="text-sm text-gray-500">Download all your account data</div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-red-600">Delete Account</div>
                  <div className="text-sm text-gray-500">Permanently delete your account and all data</div>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
