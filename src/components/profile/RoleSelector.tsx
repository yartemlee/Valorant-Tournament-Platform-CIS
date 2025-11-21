import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Slider } from "@/components/ui/slider";
import { Sword, Shield, Zap, Target } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RoleSelectorProps {
  userId: string;
  roles: any[];
  onUpdate: (roles: any[]) => void;
  isEditable: boolean;
}

const roleIcons = {
  duelist: Sword,
  initiator: Zap,
  controller: Target,
  sentinel: Shield,
};

const roleNames = {
  duelist: "Дуэлянт",
  initiator: "Инициатор",
  controller: "Контроллер",
  sentinel: "Сентинел",
};

const comfortLevels = [
  { value: 0, label: "Не играл", db: "not_played" },
  { value: 1, label: "Осваиваю", db: "learning" },
  { value: 2, label: "Средне", db: "average" },
  { value: 3, label: "Хорошо", db: "good" },
  { value: 4, label: "Мейн", db: "perfect" },
];

const agentsByRole = {
  duelist: ["Jett", "Phoenix", "Reyna", "Raze", "Yoru", "Neon", "Iso"],
  initiator: ["Sova", "Breach", "Skye", "KAY/O", "Fade", "Gekko"],
  controller: ["Viper", "Omen", "Brimstone", "Astra", "Harbor", "Clove"],
  sentinel: ["Sage", "Cypher", "Killjoy", "Chamber", "Deadlock", "Vyse"],
};

const agentStatusMap = {
  not_played: 0,
  learning: 1,
  average: 2,
};

export function RoleSelector({ userId, roles, onUpdate, isEditable }: RoleSelectorProps) {
  const [updating, setUpdating] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    loadAgents();
  }, [userId]);

  const loadAgents = async () => {
    const { data } = await supabase
      .from("player_agents")
      .select("*")
      .eq("user_id", userId);
    setAgents(data || []);
  };

  const getRoleComfort = (role: string) => {
    const roleData = roles.find(r => r.role === role);
    if (!roleData) return 0;
    return comfortLevels.findIndex(l => l.db === roleData.comfort_level);
  };

  const getAgentStatus = (agentName: string) => {
    const agentData = agents.find(a => a.agent_name === agentName);
    if (!agentData) return 0;
    return agentStatusMap[agentData.skill_level as keyof typeof agentStatusMap] || 0;
  };

  const handleRoleChange = async (role: string, value: number[]) => {
    if (!isEditable) return;
    
    try {
      setUpdating(true);
      const comfort = comfortLevels[value[0]].db as "not_played" | "learning" | "average" | "good" | "perfect";

      const existingRole = roles.find(r => r.role === role);

      if (existingRole) {
        const { error } = await supabase
          .from("player_roles")
          .update({ comfort_level: comfort })
          .eq("id", existingRole.id);

        if (error) throw error;

        onUpdate(roles.map(r => 
          r.id === existingRole.id ? { ...r, comfort_level: comfort } : r
        ));
      } else {
        const { data, error } = await supabase
          .from("player_roles")
          .insert({ 
            user_id: userId, 
            role: role as "duelist" | "initiator" | "controller" | "sentinel", 
            comfort_level: comfort 
          })
          .select()
          .single();

        if (error) throw error;
        onUpdate([...roles, data]);
      }
    } catch (error: any) {
      // Silent error - user will see no update
    } finally {
      setUpdating(false);
    }
  };

  const handleAgentClick = async (agentName: string) => {
    if (!isEditable) return;

    try {
      setUpdating(true);
      const currentStatus = getAgentStatus(agentName);
      const nextStatus = (currentStatus + 1) % 3;
      
      const statusToSkillLevel = ["not_played", "learning", "average"] as const;
      const newSkillLevel = statusToSkillLevel[nextStatus];

      const existingAgent = agents.find(a => a.agent_name === agentName);

      if (nextStatus === 0) {
        // Remove agent
        if (existingAgent) {
          const { error } = await supabase
            .from("player_agents")
            .delete()
            .eq("id", existingAgent.id);

          if (error) throw error;
          setAgents(agents.filter(a => a.id !== existingAgent.id));
        }
      } else {
        if (existingAgent) {
          // Update existing
          const { error } = await supabase
            .from("player_agents")
            .update({ skill_level: newSkillLevel })
            .eq("id", existingAgent.id);

          if (error) throw error;
          setAgents(agents.map(a => 
            a.id === existingAgent.id ? { ...a, skill_level: newSkillLevel } : a
          ));
        } else {
          // Create new
          const { data, error } = await supabase
            .from("player_agents")
            .insert({ 
              user_id: userId, 
              agent_name: agentName, 
              skill_level: newSkillLevel 
            })
            .select()
            .single();

          if (error) throw error;
          setAgents([...agents, data]);
        }
      }
    } catch (error: any) {
      // Silent error - user will see no update
    } finally {
      setUpdating(false);
    }
  };

  const getAgentBorderColor = (status: number) => {
    if (status === 1) return "border-yellow-500";
    if (status === 2) return "border-green-500";
    return "border-muted";
  };

  const getAgentOpacity = (status: number) => {
    return status === 0 ? "opacity-40" : "opacity-100";
  };

  const getAgentTooltip = (status: number) => {
    if (status === 1) return "Норм";
    if (status === 2) return "Мейн";
    return "";
  };

  return (
    <div className="space-y-8">
      {Object.entries(roleIcons).map(([role, Icon]) => {
        const comfortValue = getRoleComfort(role);
        const roleAgents = agentsByRole[role as keyof typeof agentsByRole];

        return (
          <div key={role} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{roleNames[role as keyof typeof roleNames]}</span>
              </div>
              <div className="space-y-2 pl-8">
                <Slider
                  value={[comfortValue]}
                  onValueChange={(value) => handleRoleChange(role, value)}
                  max={4}
                  step={1}
                  disabled={!isEditable || updating}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground text-center">
                  {comfortLevels[comfortValue].label}
                </div>
              </div>
            </div>

            {/* Agent icons */}
            <TooltipProvider>
              <div className="flex flex-wrap gap-2 pl-8">
                {roleAgents.map((agentName) => {
                  const status = getAgentStatus(agentName);
                  
                  // Don't show unselected agents on other profiles
                  if (!isEditable && status === 0) return null;

                  return (
                    <Tooltip key={agentName}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleAgentClick(agentName)}
                          disabled={!isEditable || updating}
                          className={`
                            w-12 h-12 rounded-full border-2 
                            bg-card/50 hover:bg-card
                            flex items-center justify-center
                            text-xs font-medium
                            transition-all duration-200
                            ${getAgentBorderColor(status)}
                            ${getAgentOpacity(status)}
                            ${isEditable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                            ${status > 0 ? 'shadow-lg' : ''}
                          `}
                        >
                          {agentName.slice(0, 2).toUpperCase()}
                        </button>
                      </TooltipTrigger>
                      {status > 0 && (
                        <TooltipContent side="bottom">
                          <p className="text-xs">{agentName} - {getAgentTooltip(status)}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>
        );
      })}
    </div>
  );
}
