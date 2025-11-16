import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RiotIDSectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export function RiotIDSection({ formData, onChange }: RiotIDSectionProps) {
  const { toast } = useToast();

  const handleLinkRiotId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Auto-save riot_linked status
    const { error } = await supabase
      .from("profiles")
      .update({ riot_linked: true })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    onChange("riot_linked", true);
    toast({
      title: "Riot ID привязан",
      description: "Теперь вы можете участвовать в турнирах",
    });
  };

  const handleRiotIdChange = async (field: string, value: string) => {
    onChange(field, value);

    if (!formData.riot_linked) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Auto-save changes
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Ошибка сохранения",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riot ID</CardTitle>
        <CardDescription>Привяжите ваш аккаунт Valorant</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {formData.riot_linked ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-semibold">Riot ID привязан ✅</span>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Для участия в турнирах и создания команд необходимо привязать Riot ID
            </p>
            <Button onClick={handleLinkRiotId} className="w-full">
              Привязать Riot ID
            </Button>
          </div>
        )}

        {formData.riot_linked && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="riot_id">Riot ID</Label>
              <Input
                id="riot_id"
                value={formData.riot_id}
                onChange={(e) => handleRiotIdChange("riot_id", e.target.value)}
                placeholder="YourName"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="riot_tag">Tag</Label>
              <Input
                id="riot_tag"
                placeholder="0000"
                value={formData.riot_tag}
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