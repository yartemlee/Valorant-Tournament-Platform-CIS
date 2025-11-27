import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { getSortedCountries, getCountryFlag } from "@/lib/countries";

interface ProfileSectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export function ProfileSection({ formData, onChange }: ProfileSectionProps) {
  const sortedCountries = getSortedCountries();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Личная информация</CardTitle>
        <CardDescription>Основные данные профиля</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country">Страна</Label>
          <Select value={formData.country} onValueChange={(value) => onChange("country", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите страну" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {sortedCountries.map(c => (
                <SelectItem key={c.code} value={c.code}>
                  <div className="flex items-center gap-2">
                    <span>{getCountryFlag(c.code)}</span>
                    <span>{c.nameRu}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <PhoneInput
          value={formData.phone_number}
          onChange={(value) => onChange("phone_number", value)}
          defaultCountryCode={formData.country || "RU"}
        />

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
