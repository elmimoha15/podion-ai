
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
  Lock,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { podcastApi } from "@/services/podcastApi";
import { toast } from "sonner";

const Settings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [profile, setProfile] = useState<any>({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    phone: ''
  });
  const [notifications, setNotifications] = useState<any>({
    email_notifications: true,
    processing_complete: true,
    weekly_summary: false,
    marketing_emails: false,
    security_alerts: true
  });
  const [emailServiceStatus, setEmailServiceStatus] = useState<any>(null);

  useEffect(() => {
    if (currentUser?.uid) {
      loadSettings();
    }
  }, [currentUser?.uid]);

  const loadSettings = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      
      // Load profile and notification preferences in parallel
      const [profileResponse, notificationsResponse, emailStatusResponse] = await Promise.all([
        podcastApi.getUserProfile(currentUser.uid),
        podcastApi.getNotificationPreferences(currentUser.uid),
        podcastApi.getEmailServiceStatus()
      ]);
      
      if (profileResponse.success) {
        setProfile(profileResponse.profile || {});
      }
      
      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.notifications || {});
      }
      
      setEmailServiceStatus(emailStatusResponse);
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setSaving(true);
      
      const response = await podcastApi.updateUserProfile(currentUser.uid, profile);
      
      if (response.success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile');
      }
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    if (!currentUser?.uid) return;
    
    const updatedNotifications = {
      ...notifications,
      [key]: value
    };
    
    setNotifications(updatedNotifications);
    
    try {
      const response = await podcastApi.updateNotificationPreferences(currentUser.uid, updatedNotifications);
      
      if (response.success) {
        toast.success('Notification preferences updated');
      } else {
        toast.error('Failed to update notifications');
      }
      
    } catch (error) {
      console.error('Failed to update notifications:', error);
      toast.error('Failed to update notifications');
    }
  };

  const handleTestEmail = async () => {
    if (!profile.email) {
      toast.error('Please enter an email address first');
      return;
    }
    
    try {
      setEmailTesting(true);
      
      const response = await podcastApi.sendTestEmail(
        profile.email, 
        `${profile.first_name} ${profile.last_name}`.trim() || 'Test User'
      );
      
      if (response.success) {
        toast.success(`Test email sent successfully to ${profile.email}!`);
      } else {
        toast.error('Failed to send test email');
      }
      
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setEmailTesting(false);
    }
  };

  const handleSendWelcomeEmail = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setEmailTesting(true);
      
      const response = await podcastApi.sendWelcomeEmail(currentUser.uid);
      
      if (response.success) {
        toast.success('Welcome email sent successfully!');
      } else {
        toast.error('Failed to send welcome email');
      }
      
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      toast.error('Failed to send welcome email');
    } finally {
      setEmailTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }
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
                <Input 
                  id="firstName" 
                  value={profile.first_name || ''}
                  onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={profile.last_name || ''}
                  onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input 
                  id="email" 
                  type="email" 
                  value={profile.email || ''}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  placeholder="Enter your email address"
                  className="flex-1" 
                />
                <Badge variant="secondary" className="flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {profile.email ? 'Verified' : 'Not Set'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input 
                id="company" 
                value={profile.company || ''}
                onChange={(e) => setProfile({...profile, company: e.target.value})}
                placeholder="Enter your company name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={profile.phone || ''}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                placeholder="Enter your phone number"
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleProfileSave}
                disabled={saving}
                className="blue-gradient text-white flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              
              <Button 
                onClick={handleTestEmail}
                disabled={emailTesting || !profile.email}
                variant="outline"
                className="flex items-center gap-2"
              >
                {emailTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Test Email
                  </>
                )}
              </Button>
            </div>
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
                <Switch 
                  checked={notifications.email_notifications || false}
                  onCheckedChange={(checked) => handleNotificationChange('email_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Processing Complete</div>
                  <div className="text-sm text-gray-500">When your episode processing is finished</div>
                </div>
                <Switch 
                  checked={notifications.processing_complete || false}
                  onCheckedChange={(checked) => handleNotificationChange('processing_complete', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Weekly Summary</div>
                  <div className="text-sm text-gray-500">Weekly report of your content performance</div>
                </div>
                <Switch 
                  checked={notifications.weekly_summary || false}
                  onCheckedChange={(checked) => handleNotificationChange('weekly_summary', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Marketing Emails</div>
                  <div className="text-sm text-gray-500">Product updates and promotional content</div>
                </div>
                <Switch 
                  checked={notifications.marketing_emails || false}
                  onCheckedChange={(checked) => handleNotificationChange('marketing_emails', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Security Alerts</div>
                  <div className="text-sm text-gray-500">Important account security notifications</div>
                </div>
                <Switch 
                  checked={notifications.security_alerts || false}
                  onCheckedChange={(checked) => handleNotificationChange('security_alerts', checked)}
                />
              </div>
            </div>
            
            {/* Email Service Status */}
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Service Status</div>
                  <div className="text-sm text-gray-500">Brevo (Sendinblue) integration status</div>
                </div>
                <Badge 
                  variant={emailServiceStatus?.success ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {emailServiceStatus?.success ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      Not Configured
                    </>
                  )}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSendWelcomeEmail}
                  disabled={emailTesting || !emailServiceStatus?.success}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {emailTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Welcome Email
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={loadSettings}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Status
                </Button>
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
