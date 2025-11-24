import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfileSectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const countries = [
  { code: "RU", name: "Россия" },
  { code: "KZ", name: "Казахстан" },
  { code: "BY", name: "Беларусь" },
  { code: "UA", name: "Украина" },
  { code: "UZ", name: "Узбекистан" },
  { code: "AM", name: "Армения" },
  { code: "AZ", name: "Азербайджан" },
  { code: "GE", name: "Грузия" },
  { code: "KG", name: "Кыргызстан" },
  { code: "MD", name: "Молдова" },
  { code: "TJ", name: "Таджикистан" },
  { code: "TM", name: "Туркменистан" },
];

export function ProfileSection({ formData, onChange }: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Личная информация</CardTitle>
        <CardDescription>Основные данные профиля</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Имя и фамилия</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => onChange("full_name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Страна</Label>
          <Select value={formData.country} onValueChange={(value) => onChange("country", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите страну" />
            </SelectTrigger>
            <SelectContent>
              {countries.map(c => (
                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone_number">Телефон</Label>
          <Input
            id="phone_number"
            value={formData.phone_number}
            onChange={(e) => onChange("phone_number", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Статус</Label>
          <Input
            id="status"
            placeholder="Соревнуюсь с 2021 года"
            value={formData.status}
            onChange={(e) => onChange("status", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="about_me">О себе (до 300 символов)</Label>
          <Textarea
            id="about_me"
            value={formData.about_me}
            onChange={(e) => onChange("about_me", e.target.value)}
            maxLength={300}
            rows={4}
          />
          <div className="text-xs text-muted-foreground text-right">
            {formData.about_me.length}/300
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
