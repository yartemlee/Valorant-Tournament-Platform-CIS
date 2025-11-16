import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationsSectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export function NotificationsSection({ formData, onChange }: NotificationsSectionProps) {
  const notificationSettings = [
    { field: "email_notifications", label: "Уведомления на почту", desc: "Получать уведомления о турнирах и событиях" },
    { field: "discord_notifications", label: "Уведомления в Discord", desc: "Получать уведомления через Discord бота" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Уведомления</CardTitle>
        <CardDescription>Настройка уведомлений</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notificationSettings.map(({ field, label, desc }) => (
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
