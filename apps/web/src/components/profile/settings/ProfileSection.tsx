import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { getSortedCountries, getCountryFlag } from "@/lib/countries";

interface ProfileSectionProps {
  formData: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
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
          <Select value={(formData.country as string) || undefined} onValueChange={(value) => onChange("country", value)}>
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
          value={formData.phone_number as string}
          onChange={(value) => onChange("phone_number", value)}
          defaultCountryCode={(formData.country as string) || "RU"}
        />

        <div className="space-y-2">
          <Label htmlFor="username">Имя пользователя</Label>
          <Input
            id="username"
            value={(formData.username as string) || ""}
            onChange={(e) => onChange("username", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">О себе</Label>
          <Textarea
            id="bio"
            value={(formData.about_me as string) || ""}
            onChange={(e) => onChange("about_me", e.target.value)}
            placeholder="Расскажите немного о себе..."
            maxLength={300}
            rows={4}
          />
          <div className="text-xs text-muted-foreground text-right">
            {(formData.about_me as string || "").length}/300
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
