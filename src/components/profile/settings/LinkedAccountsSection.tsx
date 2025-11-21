import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LinkedAccountsSectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export function LinkedAccountsSection({ formData, onChange }: LinkedAccountsSectionProps) {
  const socialAccounts = [
    { field: "discord_username", label: "Discord", placeholder: "username#0000" },
    { field: "twitch_username", label: "Twitch", placeholder: "username" },
    { field: "youtube_username", label: "YouTube", placeholder: "@username" },
    { field: "tiktok_username", label: "TikTok", placeholder: "@username" },
    { field: "tracker_gg_username", label: "Tracker.gg", placeholder: "RiotID#TAG" },
    { field: "twitter_username", label: "Twitter/X", placeholder: "@username" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Социальные сети</CardTitle>
        <CardDescription>Привяжите ваши социальные сети</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {socialAccounts.map(({ field, label, placeholder }) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={field}>{label}</Label>
            <Input
              id={field}
              placeholder={placeholder}
              value={formData[field as keyof typeof formData] as string}
              onChange={(e) => onChange(field, e.target.value)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
