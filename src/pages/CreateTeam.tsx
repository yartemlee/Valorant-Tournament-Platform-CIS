import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { z } from "zod";

const teamSchema = z.object({
  name: z.string().min(3, "Минимум 3 символа").max(24, "Максимум 24 символа"),
  tag: z.string().min(2, "Минимум 2 символа").max(5, "Максимум 5 символов").regex(/^[a-zA-Z0-9]+$/, "Только латиница и цифры"),
  description: z.string().max(400, "Максимум 400 символов").optional(),
  logo_url: z.string().url("Неверный URL").optional().or(z.literal("")),
});

const CreateTeam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    description: "",
    logo_url: "",
    is_recruiting: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      teamSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Требуется авторизация",
          description: "Войдите, чтобы создать команду",
          variant: "destructive",
        });
        return;
      }

      // Create team using RPC
      const { data: teamId, error: rpcError } = await supabase.rpc(
        'create_team_with_captain',
        {
          name_input: formData.name,
          tag_input: formData.tag.toUpperCase(),
          description_input: formData.description || null,
          logo_url_input: formData.logo_url || null,
          is_recruiting_input: formData.is_recruiting,
        }
      );

      if (rpcError) throw rpcError;

      toast({
        title: "Команда создана",
        description: "Вы можете пригласить участников",
      });

      navigate(`/teams/${teamId}`);
    } catch (error: any) {
      let errorMessage = error.message;
      
      // Handle duplicate name/tag errors
      if (error.message?.includes("teams_name_key")) {
        errorMessage = "Команда с таким названием уже существует";
      } else if (error.message?.includes("teams_tag_key")) {
        errorMessage = "Команда с таким тегом уже существует";
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/teams")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Создание команды</h1>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Информация о команде</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Название команды *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Введите название (3-24 символа)"
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tag">Тег команды *</Label>
                    <Input
                      id="tag"
                      value={formData.tag}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
                      placeholder="TAG (2-5 символов, латиница)"
                      maxLength={5}
                    />
                    {errors.tag && <p className="text-sm text-destructive">{errors.tag}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo_url">URL логотипа (опционально)</Label>
                    <Input
                      id="logo_url"
                      type="url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                    {errors.logo_url && <p className="text-sm text-destructive">{errors.logo_url}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Описание команды</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Расскажите о своей команде (до 400 символов)"
                      rows={4}
                      maxLength={400}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.description.length}/400
                    </p>
                    {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="is_recruiting">Открыть набор</Label>
                      <p className="text-sm text-muted-foreground">
                        Другие игроки смогут подавать заявки
                      </p>
                    </div>
                    <Switch
                      id="is_recruiting"
                      checked={formData.is_recruiting}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_recruiting: checked })}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/teams")}>
                      Отмена
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? "Создание..." : "Создать команду"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateTeam;
