import { PlayerRole, PlayerAgent } from '@/types/common.types';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { RoleMasterySlider } from "./RoleMasterySlider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { valorantApi, ValorantAgent } from "@/services/valorantApi";
import {
  ProficiencyLevel,
  roleProficiencyLevels,
  agentProficiencyLevels,
  AgentProficiencyLevel
} from "@/constants/proficiency";
import { cn } from "@/lib/utils";

interface RoleSelectorProps {
  userId: string;
  roles: PlayerRole[];
  onUpdate: (roles: PlayerRole[]) => void;
  isEditable: boolean;
}

const roleNames = {
  duelist: "Дуэлянт",
  initiator: "Инициатор",
  controller: "Специалист",
  sentinel: "Страж",
};

// Map internal role keys to API role display names (Russian)
const apiRoleMap: Record<string, string> = {
  duelist: "Дуэлянт",
  initiator: "Зачинщик", // API uses "Зачинщик" for Initiator
  controller: "Специалист",
  sentinel: "Страж"
};


export function RoleSelector({ userId, roles, onUpdate, isEditable }: RoleSelectorProps) {
  const [updating, setUpdating] = useState(false);
  const [agents, setAgents] = useState<PlayerAgent[]>([]);
  const [apiAgents, setApiAgents] = useState<ValorantAgent[]>([]);
  const [roleIcons, setRoleIcons] = useState<Record<string, string>>({});

  // Local state for sliders to ensure smooth dragging
  const [localComfortLevels, setLocalComfortLevels] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      // Load user's agents
      const { data } = await supabase
        .from("player_agents")
        .select("*")
        .eq("user_id", userId);
      setAgents((data as unknown as PlayerAgent[]) || []);

      // Load API agents
      const fetchedAgents = await valorantApi.getAgents();
      setApiAgents(fetchedAgents);

      // Extract role icons
      const icons: Record<string, string> = {};
      Object.entries(apiRoleMap).forEach(([key, apiName]) => {
        const agent = fetchedAgents.find(a => a.role?.displayName === apiName);
        if (agent?.role?.displayIcon) {
          icons[key] = agent.role.displayIcon;
        }
      });
      setRoleIcons(icons);
    };

    loadData();
    loadData();
  }, [userId]);

  // Sync local state with props when roles change
  useEffect(() => {
    const newComfortLevels: Record<string, number> = {};

    Object.keys(roleNames).forEach(roleKey => {
      const roleData = roles.find(r => r.role === roleKey);
      if (roleData) {
        const index = roleProficiencyLevels.findIndex(l => l.value === roleData.comfort_level);
        newComfortLevels[roleKey] = index !== -1 ? index : 0;
      } else {
        newComfortLevels[roleKey] = 0;
      }
    });

    setLocalComfortLevels(newComfortLevels);
  }, [roles]);

  const _getRoleComfort = (role: string) => {
    const roleData = roles.find(r => r.role === role);
    if (!roleData) return "not_played";
    return roleData.comfort_level as ProficiencyLevel;
  };

  const getAgentStatus = (agentName: string): AgentProficiencyLevel => {
    const agentData = agents.find(a => a.agent_name === agentName);
    if (!agentData) return "not_played";
    return agentData.skill_level as AgentProficiencyLevel;
  };

  const handleSliderChange = (role: string, value: number[]) => {
    if (!isEditable) return;
    setLocalComfortLevels(prev => ({ ...prev, [role]: value[0] }));
  };

  const handleSliderCommit = async (role: string, value: number[]) => {
    if (!isEditable) return;

    try {
      setUpdating(true);
      // Map slider value 0-4 to proficiency level
      const comfort = roleProficiencyLevels[value[0]].value;

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
    } catch {
      // Revert local state on error
      const roleData = roles.find(r => r.role === role);
      const level = roleData ? roleData.comfort_level : "not_played";
      const index = roleProficiencyLevels.findIndex(l => l.value === level);
      setLocalComfortLevels(prev => ({ ...prev, [role]: index !== -1 ? index : 0 }));
    } finally {
      setUpdating(false);
    }
  };

  const handleAgentClick = async (agentName: string) => {
    if (!isEditable) return;

    try {
      setUpdating(true);
      const currentStatus = getAgentStatus(agentName);

      const currentIndex = agentProficiencyLevels.findIndex(l => l.value === currentStatus);
      const nextIndex = (currentIndex + 1) % agentProficiencyLevels.length;
      const nextLevel = agentProficiencyLevels[nextIndex].value;

      await updateAgentSkill(agentName, nextLevel);
    } catch {
    } finally {
      setUpdating(false);
    }
  };

  const updateAgentSkill = async (agentName: string, skill: AgentProficiencyLevel) => {
    const existingAgent = agents.find(a => a.agent_name === agentName);

    if (skill === "not_played") {
      if (existingAgent) {
        const { error } = await supabase
          .from("player_agents")
          .delete()
          .eq("id", existingAgent.id);

        if (error) throw error;
        setAgents(prev => prev.filter(a => a.id !== existingAgent.id));
      }
    } else {
      if (existingAgent) {
        const { error } = await supabase
          .from("player_agents")
          .update({ skill_level: skill })
          .eq("id", existingAgent.id);

        if (error) throw error;
        setAgents(prev => prev.map(a =>
          a.id === existingAgent.id ? { ...a, skill_level: skill } : a
        ));
      } else {
        const { data, error } = await supabase
          .from("player_agents")
          .insert({
            user_id: userId,
            agent_name: agentName,
            skill_level: skill
          })
          .select()
          .single();

        if (error) throw error;
        setAgents(prev => [...prev, data]);
      }
    }
  };

  const getAgentBorderColor = (status: AgentProficiencyLevel) => {
    if (status === "not_played") return "border-border/30";
    if (status === "comfortable") return "border-green-500";
    if (status === "main") return "border-purple-500";
    return "border-border/30";
  };

  const getAgentOpacity = (status: AgentProficiencyLevel) => {
    return status === "not_played" ? "opacity-40" : "opacity-100";
  };

  const getAgentGlow = (status: AgentProficiencyLevel) => {
    if (status === "main") return "shadow-lg shadow-purple-500/50 ring-2 ring-purple-500/30";
    if (status === "comfortable") return "shadow-md shadow-green-500/30 ring-1 ring-green-500/20";
    return "";
  };

  return (
    <div className="space-y-8">
      {Object.entries(roleNames).map(([roleKey, roleName]) => {
        const comfortIndex = localComfortLevels[roleKey] ?? 0;

        // Filter agents for this role
        const roleAgents = apiAgents.filter(a => a.role?.displayName === apiRoleMap[roleKey]);
        const IconUrl = roleIcons[roleKey];

        return (
          <div key={roleKey} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {IconUrl ? (
                  <img src={IconUrl} alt={roleName} className="h-5 w-5 object-contain" />
                ) : (
                  <div className="h-5 w-5 bg-muted rounded-full" />
                )}
                <span className="font-medium">{roleName}</span>
              </div>
              <RoleMasterySlider
                value={comfortIndex}
                onValueChange={(value) => handleSliderChange(roleKey, [value])}
                onValueCommit={(value) => handleSliderCommit(roleKey, [value])}
                disabled={!isEditable || updating}
                className="w-full"
              />
            </div>

            {/* Agent icons */}
            <TooltipProvider delayDuration={0}>
              <div className="flex flex-wrap gap-2 pl-8">
                {(isEditable
                  ? roleAgents // No sorting for own profile
                  : roleAgents.slice().sort((a, b) => {
                    // Sort by proficiency only for other users' profiles
                    const statusA = getAgentStatus(a.displayName);
                    const statusB = getAgentStatus(b.displayName);
                    const order = { main: 0, comfortable: 1, not_played: 2 };
                    return (order[statusA as keyof typeof order] ?? 2) - (order[statusB as keyof typeof order] ?? 2);
                  })
                ).map((agent) => {
                  const status = getAgentStatus(agent.displayName);

                  // Don't show unselected agents on other profiles
                  if (!isEditable && status === "not_played") return null;

                  return (
                    <Tooltip key={agent.uuid}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleAgentClick(agent.displayName)}
                          disabled={!isEditable || updating}
                          className={cn(
                            "w-12 h-12 rounded-lg border-2",
                            "bg-card/50 hover:bg-card/80",
                            "flex items-center justify-center overflow-hidden",
                            "transition-all duration-300 ease-out",
                            getAgentBorderColor(status),
                            getAgentOpacity(status),
                            getAgentGlow(status),
                            isEditable ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                          )}
                        >
                          <img src={agent.displayIcon} alt={agent.displayName} className="w-full h-full object-cover" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs font-medium">
                          {agent.displayName}
                          {status !== "not_played" && (
                            <span className={agentProficiencyLevels.find(l => l.value === status)?.color}>
                              {" - "}{agentProficiencyLevels.find(l => l.value === status)?.label}
                            </span>
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>
        );
      })}
    </div >
  );
}
