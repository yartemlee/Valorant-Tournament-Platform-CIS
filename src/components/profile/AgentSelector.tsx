import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface AgentSelectorProps {
  userId: string;
  agents: any[];
  onUpdate: (agents: any[]) => void;
  isEditable: boolean;
}

const valorantAgents = [
  "Jett", "Phoenix", "Sage", "Sova", "Viper", "Cypher", "Reyna", "Killjoy",
  "Breach", "Omen", "Brimstone", "Raze", "Skye", "Yoru", "Astra", "KAY/O",
  "Chamber", "Neon", "Fade", "Harbor", "Gekko", "Deadlock", "Iso", "Clove", "Vyse"
];

const comfortLevels = [
  { value: 0, label: "Не играл", db: "not_played" },
  { value: 1, label: "Осваиваю", db: "learning" },
  { value: 2, label: "Средне", db: "average" },
  { value: 3, label: "Хорошо", db: "good" },
  { value: 4, label: "Идеально", db: "perfect" },
];

export function AgentSelector({ userId, agents, onUpdate, isEditable }: AgentSelectorProps) {
  const [updating, setUpdating] = useState(false);

  const isAgentSelected = (agent: string) => {
    return agents.some(a => a.agent_name === agent);
  };

  const getAgentSkill = (agent: string) => {
    const agentData = agents.find(a => a.agent_name === agent);
    if (!agentData) return 0;
    return comfortLevels.findIndex(l => l.db === agentData.skill_level);
  };

  const handleAgentToggle = async (agent: string, checked: boolean) => {
    if (!isEditable) return;

    try {
      setUpdating(true);

      if (checked) {
        const { data, error } = await supabase
          .from("player_agents")
          .insert({ user_id: userId, agent_name: agent, skill_level: "not_played" })
          .select()
          .single();

        if (error) throw error;
        onUpdate([...agents, data]);
        toast.success(`Агент ${agent} добавлен`);
      } else {
        const agentData = agents.find(a => a.agent_name === agent);
        if (!agentData) return;

        const { error } = await supabase
          .from("player_agents")
          .delete()
          .eq("id", agentData.id);

        if (error) throw error;
        onUpdate(agents.filter(a => a.id !== agentData.id));
        toast.success(`Агент ${agent} удален`);
      }
    } catch (error: any) {
      console.error("Error toggling agent:", error);
      toast.error("Ошибка обновления агента");
    } finally {
      setUpdating(false);
    }
  };

  const handleSkillChange = async (agent: string, value: number[]) => {
    if (!isEditable) return;

    try {
      setUpdating(true);
      const skill = comfortLevels[value[0]].db as "not_played" | "learning" | "average" | "good" | "perfect";
      const agentData = agents.find(a => a.agent_name === agent);
      if (!agentData) return;

      const { error } = await supabase
        .from("player_agents")
        .update({ skill_level: skill })
        .eq("id", agentData.id);

      if (error) throw error;

      onUpdate(agents.map(a => 
        a.id === agentData.id ? { ...a, skill_level: skill } : a
      ));
    } catch (error: any) {
      console.error("Error updating skill:", error);
      toast.error("Ошибка обновления уровня");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {valorantAgents.map(agent => {
        const isSelected = isAgentSelected(agent);
        const skillValue = getAgentSkill(agent);

        return (
          <div key={agent} className="space-y-2 p-3 rounded-lg border bg-card/50">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleAgentToggle(agent, checked as boolean)}
                disabled={!isEditable || updating}
              />
              <span className="font-medium">{agent}</span>
            </div>
            
            {isSelected && (
              <div className="space-y-1 pl-6">
                <Slider
                  value={[skillValue]}
                  onValueChange={(value) => handleSkillChange(agent, value)}
                  max={4}
                  step={1}
                  disabled={!isEditable || updating}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  {comfortLevels[skillValue].label}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}