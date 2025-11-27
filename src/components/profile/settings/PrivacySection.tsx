import { Profile } from '@/types/common.types';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PrivacySectionProps {
  formData: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

export function PrivacySection({ formData, onChange }: PrivacySectionProps) {
  const privacySettings = [
    { field: "show_statistics", label: "Показывать статистику", desc: "Другие пользователи смогут видеть вашу статистику" },
    { field: "show_country", label: "Показывать страну", desc: "Страна будет видна в профиле" },
    { field: "show_social_links", label: "Показывать социальные сети", desc: "Ссылки на соцсети будут видны другим" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Приватность</CardTitle>
        <CardDescription>Управление видимостью данных</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {privacySettings.map(({ field, label, desc }) => (
          <div key={field} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{label}</Label>
              <div className="text-sm text-muted-foreground">{desc}</div>
            </div>
            <Switch
              checked={formData[field as keyof typeof formData] as boolean}
              onCheckedChange={(checked) => onChange(field, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
