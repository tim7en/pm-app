"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { useAuth } from "@/contexts/AuthContext"
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  Upload,
  Download,
  Trash2,
  Plus,
  Github,
  Linkedin,
  Building,
  Briefcase,
  Clock
} from "lucide-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useUIScale } from "@/contexts/UIScaleContext"
import { useTheme } from "@/contexts/ThemeContext"
import { useToast } from "@/hooks/use-toast"
import { 
  getAppearanceSettings, 
  saveAppearanceSettings, 
  applyAllSettings,
  DEFAULT_SETTINGS,
  type AppearanceSettings 
} from "@/lib/settings-storage"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().min(1, "Language is required"),
})

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  taskAssignments: z.boolean(),
  dueDateReminders: z.boolean(),
  projectUpdates: z.boolean(),
  teamMessages: z.boolean(),
  weeklyReports: z.boolean(),
  marketingEmails: z.boolean(),
})

const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system", "auto"]),
  fontSize: z.enum(["small", "medium", "large"]),
  density: z.enum(["compact", "comfortable", "spacious"]),
  colorScheme: z.string(),
  uiScale: z.enum(["xs", "small", "medium", "large", "xl"]),
})

type ProfileFormData = z.infer<typeof profileSchema>
type NotificationFormData = z.infer<typeof notificationSchema>
type AppearanceFormData = z.infer<typeof appearanceSchema>

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const { scale, setScale } = useUIScale()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { user } = useAuth()

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      company: "",
      position: "",
      phone: "",
      location: "",
      bio: "",
      timezone: "America/Los_Angeles",
      language: "en",
    },
  })

  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      taskAssignments: true,
      dueDateReminders: true,
      projectUpdates: true,
      teamMessages: true,
      weeklyReports: true,
      marketingEmails: false,
    },
  })

  const appearanceForm = useForm<AppearanceFormData>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: theme,
      fontSize: "medium",
      density: "comfortable",
      colorScheme: "blue",
      uiScale: scale,
    },
  })

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        email: user.email || "",
        company: user.company || "",
        position: user.position || "",
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
        timezone: user.timezone || "America/Los_Angeles",
        language: user.language || "en",
      })
    }
  }, [user, profileForm])

  // Load saved preferences on mount and when scale/theme changes
  useEffect(() => {
    const loadSavedPreferences = () => {
      const savedSettings = getAppearanceSettings()
      
      appearanceForm.reset({
        theme: theme, // Use theme from context
        fontSize: savedSettings.fontSize,
        density: savedSettings.density,
        colorScheme: savedSettings.colorScheme,
        uiScale: scale, // Use scale from context
      })
    }
    
    loadSavedPreferences()
  }, [scale, theme, appearanceForm])

  // Update the form fields when context values change
  useEffect(() => {
    appearanceForm.setValue('uiScale', scale)
    appearanceForm.setValue('theme', theme)
  }, [scale, theme, appearanceForm])

  // Apply appearance settings on mount
  useEffect(() => {
    applyAllSettings()
  }, [])

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update profile. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNotificationSubmit = async (data: NotificationFormData) => {
    setIsSubmitting(true)
    try {
      console.log('Notifications updated:', data)
      // Here you would save to your backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been saved successfully.",
      })
    } catch (error) {
      console.error('Error updating notifications:', error)
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAppearanceSubmit = async (data: AppearanceFormData) => {
    setIsSubmitting(true)
    try {
      console.log('Appearance updated:', data)
      
      // Update contexts immediately
      setScale(data.uiScale)
      setTheme(data.theme)
      
      // Save all settings using centralized storage
      saveAppearanceSettings({
        theme: data.theme,
        uiScale: data.uiScale,
        fontSize: data.fontSize,
        density: data.density,
        colorScheme: data.colorScheme,
      })
      
      // Apply settings to DOM
      applyAllSettings({
        fontSize: data.fontSize,
        density: data.density,
        colorScheme: data.colorScheme,
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Appearance updated",
        description: "Your appearance preferences have been saved successfully.",
      })
    } catch (error) {
      console.error('Error updating appearance:', error)
      toast({
        title: "Error",
        description: "Failed to update appearance settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal information and how others see you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src="/avatars/01.png" alt="Profile" />
                            <AvatarFallback>JD</AvatarFallback>
                          </Avatar>
                          <div className="space-y-2">
                            <Button type="button" variant="outline" size="sm" disabled>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Photo
                              <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                            </Button>
                            <Button type="button" variant="ghost" size="sm" disabled>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                              <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  Company
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your company name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" />
                                  Position
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your job title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  Phone
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Location
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your location" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="timezone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Timezone</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Language</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="ru">Русский</SelectItem>
                                    <SelectItem value="uz">Ўзбекча</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={profileForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us about yourself"
                                  className="resize-none"
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end">
                          <Button type="submit" disabled={isSubmitting}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Choose how you want to be notified about updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationForm}>
                      <form onSubmit={notificationForm.handleSubmit(handleNotificationSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <FormField
                            control={notificationForm.control}
                            name="emailNotifications"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Email Notifications</FormLabel>
                                  <FormDescription>
                                    Receive notifications via email
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={notificationForm.control}
                            name="pushNotifications"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Push Notifications</FormLabel>
                                  <FormDescription>
                                    Receive push notifications in your browser
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={notificationForm.control}
                            name="taskAssignments"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Task Assignments</FormLabel>
                                  <FormDescription>
                                    Get notified when you're assigned to a task
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={notificationForm.control}
                            name="dueDateReminders"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Due Date Reminders</FormLabel>
                                  <FormDescription>
                                    Receive reminders before tasks are due
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={notificationForm.control}
                            name="projectUpdates"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Project Updates</FormLabel>
                                  <FormDescription>
                                    Stay updated on project progress
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={notificationForm.control}
                            name="teamMessages"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Team Messages</FormLabel>
                                  <FormDescription>
                                    Get notified about new team messages
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={notificationForm.control}
                            name="weeklyReports"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Weekly Reports</FormLabel>
                                  <FormDescription>
                                    Receive weekly activity reports
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={notificationForm.control}
                            name="marketingEmails"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Marketing Emails</FormLabel>
                                  <FormDescription>
                                    Receive product updates and marketing emails
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button type="submit" disabled={isSubmitting}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? "Saving..." : "Save Preferences"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Appearance Settings
                    </CardTitle>
                    <CardDescription>
                      Customize the look and feel of your workspace
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...appearanceForm}>
                      <form onSubmit={appearanceForm.handleSubmit(handleAppearanceSubmit)} className="space-y-6">
                        <FormField
                          control={appearanceForm.control}
                          name="theme"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Theme</FormLabel>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  type="button"
                                  variant={field.value === "light" ? "default" : "outline"}
                                  className="flex flex-col gap-2 h-auto p-4"
                                  onClick={() => field.onChange("light")}
                                >
                                  <Sun className="h-6 w-6" />
                                  <span className="text-sm">Light</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant={field.value === "dark" ? "default" : "outline"}
                                  className="flex flex-col gap-2 h-auto p-4"
                                  onClick={() => field.onChange("dark")}
                                >
                                  <Moon className="h-6 w-6" />
                                  <span className="text-sm">Dark</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant={field.value === "system" ? "default" : "outline"}
                                  className="flex flex-col gap-2 h-auto p-4"
                                  onClick={() => field.onChange("system")}
                                >
                                  <Monitor className="h-6 w-6" />
                                  <span className="text-sm">System</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant={field.value === "auto" ? "default" : "outline"}
                                  className="flex flex-col gap-2 h-auto p-4"
                                  onClick={() => field.onChange("auto")}
                                >
                                  <Clock className="h-6 w-6" />
                                  <span className="text-sm">Auto</span>
                                </Button>
                              </div>
                              <FormDescription className="text-sm text-muted-foreground">
                                Auto mode switches between light (6AM-6PM) and dark (6PM-6AM) based on time
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={appearanceForm.control}
                          name="fontSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Font Size</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select font size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="small">Small</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="large">Large</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={appearanceForm.control}
                          name="density"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Interface Density</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select density" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="compact">Compact</SelectItem>
                                  <SelectItem value="comfortable">Comfortable</SelectItem>
                                  <SelectItem value="spacious">Spacious</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={appearanceForm.control}
                          name="uiScale"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>UI Scale</FormLabel>
                              <FormDescription>
                                Scale the entire interface up or down for better visibility
                              </FormDescription>
                              <div className="grid grid-cols-5 gap-2">
                                {[
                                  { value: "xs", label: "Extra Small", description: "75% scale - Very compact", icon: "📱" },
                                  { value: "small", label: "Small", description: "85% scale - Compact", icon: "📱" },
                                  { value: "medium", label: "Medium", description: "100% scale - Default", icon: "💻" },
                                  { value: "large", label: "Large", description: "115% scale - Larger", icon: "🖥️" },
                                  { value: "xl", label: "Extra Large", description: "130% scale - Very large", icon: "🖥️" }
                                ].map((option) => (
                                  <Button
                                    key={option.value}
                                    type="button"
                                    variant={field.value === option.value ? "default" : "outline"}
                                    className={`flex flex-col gap-1 h-auto p-3 transition-all ${
                                      field.value === option.value ? 'ring-2 ring-primary ring-offset-2' : ''
                                    }`}
                                    onClick={() => {
                                      field.onChange(option.value)
                                      setScale(option.value as "xs" | "small" | "medium" | "large" | "xl")
                                      
                                      // Show immediate feedback
                                      toast({
                                        title: "UI Scale Updated",
                                        description: `Interface scaled to ${option.label.toLowerCase()}`,
                                        duration: 2000,
                                      })
                                    }}
                                  >
                                    <span className={`text-lg ${
                                      option.value === 'xs' ? 'text-xs' : 
                                      option.value === 'small' ? 'text-sm' : 
                                      option.value === 'large' ? 'text-xl' : 
                                      option.value === 'xl' ? 'text-2xl' : ''
                                    }`}>
                                      {option.icon}
                                    </span>
                                    <span className="font-medium text-xs">{option.label}</span>
                                    <span className="text-xs text-muted-foreground text-center leading-tight">
                                      {option.description}
                                    </span>
                                  </Button>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={appearanceForm.control}
                          name="colorScheme"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color Scheme</FormLabel>
                              <div className="grid grid-cols-4 gap-2">
                                {["blue", "green", "purple", "orange"].map((color) => (
                                  <Button
                                    key={color}
                                    type="button"
                                    variant={field.value === color ? "default" : "outline"}
                                    className="h-10 p-0"
                                    onClick={() => field.onChange(color)}
                                  >
                                    <div
                                      className={`w-full h-full rounded ${
                                        color === "blue" ? "bg-blue-500" :
                                        color === "green" ? "bg-green-500" :
                                        color === "purple" ? "bg-purple-500" :
                                        "bg-orange-500"
                                      }`}
                                    />
                                  </Button>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="border-t pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-medium">Settings Management</h4>
                              <p className="text-sm text-muted-foreground">
                                Reset, export, or import your appearance preferences
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const settings = getAppearanceSettings()
                                  const dataStr = JSON.stringify(settings, null, 2)
                                  const dataBlob = new Blob([dataStr], { type: 'application/json' })
                                  const url = URL.createObjectURL(dataBlob)
                                  const link = document.createElement('a')
                                  link.href = url
                                  link.download = 'appearance-settings.json'
                                  link.click()
                                  URL.revokeObjectURL(url)
                                  toast({
                                    title: "Settings exported",
                                    description: "Your appearance settings have been exported successfully.",
                                  })
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const input = document.createElement('input')
                                  input.type = 'file'
                                  input.accept = '.json'
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0]
                                    if (file) {
                                      const reader = new FileReader()
                                      reader.onload = (e) => {
                                        try {
                                          const settings = JSON.parse(e.target?.result as string)
                                          saveAppearanceSettings(settings)
                                          applyAllSettings(settings)
                                          setScale(settings.uiScale || DEFAULT_SETTINGS.uiScale)
                                          setTheme(settings.theme || DEFAULT_SETTINGS.theme)
                                          appearanceForm.reset(settings)
                                          toast({
                                            title: "Settings imported",
                                            description: "Your appearance settings have been imported successfully.",
                                          })
                                        } catch (error) {
                                          toast({
                                            title: "Import failed",
                                            description: "Failed to import settings. Please check the file format.",
                                            variant: "destructive",
                                          })
                                        }
                                      }
                                      reader.readAsText(file)
                                    }
                                  }
                                  input.click()
                                }}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Import
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  saveAppearanceSettings(DEFAULT_SETTINGS)
                                  applyAllSettings(DEFAULT_SETTINGS)
                                  setScale(DEFAULT_SETTINGS.uiScale)
                                  setTheme(DEFAULT_SETTINGS.theme)
                                  appearanceForm.reset(DEFAULT_SETTINGS)
                                  toast({
                                    title: "Settings reset",
                                    description: "Your appearance settings have been reset to defaults.",
                                  })
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Reset
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button type="submit" disabled={isSubmitting}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Account Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your account security and data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Change Password</h4>
                          <p className="text-sm text-muted-foreground">
                            Update your account password
                          </p>
                        </div>
                        <Button variant="outline">Change Password</Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Two-Factor Authentication</h4>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Button variant="outline" disabled>
                          Enable 2FA
                          <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Export Data</h4>
                          <p className="text-sm text-muted-foreground">
                            Download all your account data
                          </p>
                        </div>
                        <Button variant="outline" disabled>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                          <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Delete Account</h4>
                          <p className="text-sm text-muted-foreground">
                            Permanently delete your account and all data
                          </p>
                        </div>
                        <Button variant="destructive" disabled>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                          <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Connected Accounts
                    </CardTitle>
                    <CardDescription>
                      Manage your connected third-party accounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium">Google</h4>
                          <p className="text-sm text-muted-foreground">Connected</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Connected</Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                          <Github className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium">GitHub</h4>
                          <p className="text-sm text-muted-foreground">Not connected</p>
                        </div>
                      </div>
                      <Button variant="outline">Connect</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <Linkedin className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium">LinkedIn</h4>
                          <p className="text-sm text-muted-foreground">Not connected</p>
                        </div>
                      </div>
                      <Button variant="outline">Connect</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}