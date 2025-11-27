import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LinkedAccountsSectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export function LinkedAccountsSection({ formData, onChange }: LinkedAccountsSectionProps) {
  const socialAccounts = [
    { field: "discord_username", label: "Discord", placeholder: "username" },
    { field: "twitch_username", label: "Twitch", placeholder: "username" },
    { field: "youtube_username", label: "YouTube", placeholder: "@username" },
    { field: "tiktok_username", label: "TikTok", placeholder: "@username" },
    { field: "instagram_username", label: "Instagram", placeholder: "username" },
    { field: "twitter_username", label: "Twitter/X", placeholder: "@username" },
  ];

  const hasRiotId = !!(formData.riot_id && formData.riot_tag);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Социальные сети</CardTitle>
        <CardDescription>Привяжите ваши социальные сети</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
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
        </div>

        <div className="flex items-center justify-between space-x-2 pt-4 border-t">
          <div className="space-y-1">
            <Label htmlFor="show_tracker">Показывать Tracker.gg</Label>
            <p className="text-sm text-muted-foreground">
              {hasRiotId
                ? "Отображать ссылку на статистику Tracker.gg в профиле"
                : "Привяжите Riot ID, чтобы включить отображение статистики"}
            </p>
          </div>
          <Switch
            id="show_tracker"
            checked={formData.show_tracker}
            onCheckedChange={(checked) => onChange("show_tracker", checked)}
            disabled={!hasRiotId}
          />
        </div>
      </CardContent>
    </Card>
  );
}
