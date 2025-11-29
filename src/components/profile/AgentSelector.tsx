import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { valorantApi, ValorantAgent } from "@/services/valorantApi";
import { ProficiencyLevel, roleProficiencyLevels } from "@/constants/proficiency";
import { ProficiencySelector } from "./ProficiencySelector";
import { cn } from "@/lib/utils";
import { PlayerAgent } from "@/types/common.types";

interface AgentSelectorProps {
  userId: string;
  agents: PlayerAgent[];
  onUpdate: (agents: PlayerAgent[]) => void;
  isEditable: boolean;
}

export function AgentSelector({ userId, agents, onUpdate, isEditable }: AgentSelectorProps) {
  const [updating, setUpdating] = useState(false);
  const [apiAgents, setApiAgents] = useState<ValorantAgent[]>([]);

  useEffect(() => {
    loadApiAgents();
  }, []);

  const loadApiAgents = async () => {
    const data = await valorantApi.getAgents();
    setApiAgents(data);
  };

  const isAgentSelected = (agentName: string) => {
    return agents.some(a => a.agent_name === agentName);
  };

  const getAgentSkill = (agentName: string): ProficiencyLevel => {
    const agentData = agents.find(a => a.agent_name === agentName);
    if (!agentData) return "not_played";
    return agentData.skill_level as ProficiencyLevel;
  };

  const handleAgentToggle = async (agentName: string, checked: boolean) => {
    if (!isEditable) return;

    try {
      setUpdating(true);

      if (checked) {
        const { data, error } = await supabase
          .from("player_agents")
          .insert({ user_id: userId, agent_name: agentName, skill_level: "not_played" })
          .select()
          .single();

        if (error) throw error;
        onUpdate([...agents, data as unknown as PlayerAgent]);
        toast.success(`Агент ${agentName} добавлен`);
      } else {
        const agentData = agents.find(a => a.agent_name === agentName);
        if (!agentData) return;

        const { error } = await supabase
          .from("player_agents")
          .delete()
          .eq("id", agentData.id);

        if (error) throw error;
        onUpdate(agents.filter(a => a.id !== agentData.id));
        toast.success(`Агент ${agentName} удален`);
      }
    } catch (error) {
      console.error("Error toggling agent:", error);
      toast.error("Ошибка обновления агента");
    } finally {
      setUpdating(false);
    }
  };

  const handleSkillChange = async (agentName: string, skill: ProficiencyLevel) => {
    if (!isEditable) return;

    try {
      setUpdating(true);
      const agentData = agents.find(a => a.agent_name === agentName);
      if (!agentData) return;

      const { error } = await supabase
        .from("player_agents")
        .update({ skill_level: skill })
        .eq("id", agentData.id);

      if (error) throw error;

      onUpdate(agents.map(a =>
        a.id === agentData.id ? { ...a, skill_level: skill } : a
      ));
    } catch (error) {
      console.error("Error updating skill:", error);
      toast.error("Ошибка обновления уровня");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {apiAgents.map(agent => {
        const isSelected = isAgentSelected(agent.displayName);
        const skillValue = getAgentSkill(agent.displayName);

        return (
          <div key={agent.uuid} className="space-y-2 p-3 rounded-lg border bg-card/50 flex items-start gap-3">
            <img
              src={agent.displayIcon}
              alt={agent.displayName}
              className="w-10 h-10 rounded-md object-cover bg-muted"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{agent.displayName}</span>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleAgentToggle(agent.displayName, checked as boolean)}
                  disabled={!isEditable || updating}
                />
              </div>

              {isSelected && (
                <div className="pt-1">
                  <ProficiencySelector
                    value={skillValue}
                    onChange={(value) => handleSkillChange(agent.displayName, value)}
                    disabled={!isEditable || updating}
                    className="w-full h-8 text-xs"
                    variant="agent"
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
