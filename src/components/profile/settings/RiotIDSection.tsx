import { Profile } from '@/types/common.types';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface RiotIDSectionProps {
  formData: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

export function RiotIDSection({ formData, onChange }: RiotIDSectionProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Determine if linked based on presence of riot_id (Name#Tag or just Name)
  // We assume formData.riot_id holds the Name part and formData.riot_tag holds the Tag part
  // If combined, we check length.
  const isLinked = !!(formData.riot_id && formData.riot_tag);

  const handleLinkRiotId = () => {
    setIsEditing(true);
  };

  const handleRiotIdChange = (field: string, value: string) => {
    onChange(field, value);
  };

  const showForm = isEditing || isLinked;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riot ID</CardTitle>
        <CardDescription>Привяжите ваш аккаунт Valorant</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLinked ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-semibold">Riot ID привязан ✅</span>
          </div>
        ) : (
          !showForm && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Для участия в турнирах и создания команд необходимо привязать Riot ID
              </p>
              <Button onClick={handleLinkRiotId} className="w-full">
                Привязать Riot ID
              </Button>
            </div>
          )
        )}

        {showForm && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="riot_id">Riot ID</Label>
              <Input
                id="riot_id"
                value={(formData.riot_id as string) || ""}
                onChange={(e) => handleRiotIdChange("riot_id", e.target.value)}
                placeholder="YourName"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="riot_tag">Tag</Label>
              <Input
                id="riot_tag"
                placeholder="0000"
                value={(formData.riot_tag as string) || ""}
                onChange={(e) => handleRiotIdChange("riot_tag", e.target.value)}
                maxLength={5}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
