import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User, Shield, Link, Gamepad2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ProfileSection } from "./settings/ProfileSection";
import { RiotIDSection } from "./settings/RiotIDSection";
import { LinkedAccountsSection } from "./settings/LinkedAccountsSection";
import { PrivacySection } from "./settings/PrivacySection";
import { NotificationsSection } from "./settings/NotificationsSection";

interface SettingsTabProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "riot-id", label: "Riot ID", icon: Gamepad2 },
  { id: "linked-accounts", label: "Linked Accounts", icon: Link },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export function SettingsTab({ profile, onProfileUpdate }: SettingsTabProps) {
  const [activeSection, setActiveSection] = useState("profile");
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    country: profile.country || "",
    phone_number: profile.phone_number || "",
    status: profile.status || "",
    riot_id: profile.riot_id || "",
    riot_tag: profile.riot_tag || "",
    about_me: profile.about_me || "",
    discord_username: profile.discord_username || "",
    twitch_username: profile.twitch_username || "",
    youtube_username: profile.youtube_username || "",
    tiktok_username: profile.tiktok_username || "",
    tracker_gg_username: profile.tracker_gg_username || "",
    twitter_username: profile.twitter_username || "",
    show_statistics: profile.show_statistics ?? true,
    show_country: profile.show_country ?? true,
    show_social_links: profile.show_social_links ?? true,
    email_notifications: profile.email_notifications ?? true,
    discord_notifications: profile.discord_notifications ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { data, error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;

      onProfileUpdate(data);
      toast.success("Настройки сохранены");
    } catch (error: any) {
      toast.error("Ошибка сохранения настроек");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Left Navigation Menu */}
      <div className="w-64 flex-shrink-0">
        <div className="space-y-1 sticky top-6">
          {settingsSections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                activeSection === section.id
                  ? "bg-secondary text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <section.icon className="h-5 w-5 flex-shrink-0" />
              <span>{section.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 min-w-0">
        {activeSection === "profile" && (
          <ProfileSection formData={formData} onChange={handleChange} />
        )}
        {activeSection === "riot-id" && (
          <RiotIDSection formData={formData} onChange={handleChange} />
        )}
        {activeSection === "linked-accounts" && (
          <LinkedAccountsSection formData={formData} onChange={handleChange} />
        )}
        {activeSection === "privacy" && (
          <PrivacySection formData={formData} onChange={handleChange} />
        )}
        {activeSection === "notifications" && (
          <NotificationsSection formData={formData} onChange={handleChange} />
        )}

        {/* Sticky Save Button */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t mt-6">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full"
          >
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </div>
      </div>
    </div>
  );
}
