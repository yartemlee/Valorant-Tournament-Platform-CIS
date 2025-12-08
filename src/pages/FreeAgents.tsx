import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { User, Plus, Sparkles, UserX } from "lucide-react";
import { FreeAgentCard } from "@/components/free-agents/FreeAgentCard";
import { FreeAgentFiltersPanel, FreeAgentFilters, ViewMode } from "@/components/free-agents/FreeAgentFilters";
import { CreateFreeAgentCardDialog } from "@/components/free-agents/CreateFreeAgentCardDialog";
import { FreeAgentCardWithProfile, PlayerRole, PlayerAgent } from "@/types/common.types";
import { toast } from "sonner";

// Rank order for filtering
const rankOrder = [
    "iron", "bronze", "silver", "gold", "platinum", "diamond", "ascendant", "immortal", "radiant"
];

const FreeAgents = () => {
    const { session } = useAuth();
    const queryClient = useQueryClient();

    const [filters, setFilters] = useState<FreeAgentFilters>({
        search: "",
        roles: [],
        minRank: "",
    });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    // Get current user profile
    const { data: profile } = useQuery({
        queryKey: ["profile", session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return null;
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();
            return data;
        },
        enabled: !!session?.user?.id,
    });

    // Check if user has a team
    const hasTeam = !!profile?.current_team_id;

    // Get current user's free agent card
    const { data: myCard, refetch: refetchMyCard } = useQuery({
        queryKey: ["my-free-agent-card", session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return null;
            const { data } = await supabase
                .from("free_agent_cards")
                .select("*")
                .eq("user_id", session.user.id)
                .maybeSingle();
            return data;
        },
        enabled: !!session?.user?.id,
    });

    // Fetch all active free agent cards with profile data
    const { data: cards = [], isLoading, refetch } = useQuery({
        queryKey: ["free-agent-cards"],
        queryFn: async () => {
            const { data: cardsData, error } = await supabase
                .from("free_agent_cards")
                .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            rank,
            country
          )
        `)
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Fetch player_roles and player_agents for each card
            const cardsWithDetails = await Promise.all(
                (cardsData || []).map(async (card) => {
                    const [rolesResult, agentsResult] = await Promise.all([
                        supabase
                            .from("player_roles")
                            .select("*")
                            .eq("user_id", card.user_id),
                        supabase
                            .from("player_agents")
                            .select("*")
                            .eq("user_id", card.user_id),
                    ]);

                    return {
                        ...card,
                        player_roles: (rolesResult.data as PlayerRole[]) || [],
                        player_agents: (agentsResult.data as PlayerAgent[]) || [],
                    } as FreeAgentCardWithProfile;
                })
            );

            return cardsWithDetails;
        },
    });

    // Filter cards based on current filters
    const filteredCards = useMemo(() => {
        console.log("Cards from query:", cards);

        return cards.filter((card) => {
            // Skip cards without valid profiles
            if (!card.profiles) {
                console.warn("Card without profiles:", card);
                return false;
            }

            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const username = card.profiles.username || "";
                if (!username.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            // Role filter
            if (filters.roles.length > 0) {
                const cardRoles = card.player_roles
                    ?.filter(r => r.comfort_level !== "not_played")
                    .map(r => r.role) || [];
                const hasMatchingRole = filters.roles.some(role => cardRoles.includes(role));
                if (!hasMatchingRole) return false;
            }

            // Rank filter
            if (filters.minRank) {
                const cardRank = card.profiles.rank;
                if (!cardRank) return false;
                const cardRankTier = cardRank.split("_")[0];
                const cardRankIndex = rankOrder.indexOf(cardRankTier);
                const minRankIndex = rankOrder.indexOf(filters.minRank);
                if (cardRankIndex < minRankIndex) return false;
            }

            return true;
        });
    }, [cards, filters]);

    // Create or update card
    const handleSaveCard = async (data: { intro: string; preferred_roles: string[] }) => {
        if (!session?.user?.id) return;

        try {
            if (myCard) {
                // Update existing card
                const { error } = await supabase
                    .from("free_agent_cards")
                    .update({
                        intro: data.intro,
                        preferred_roles: data.preferred_roles,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", myCard.id);

                if (error) throw error;
                toast.success("Карточка обновлена");
            } else {
                // Create new card
                const { error } = await supabase
                    .from("free_agent_cards")
                    .insert({
                        user_id: session.user.id,
                        intro: data.intro,
                        preferred_roles: data.preferred_roles,
                        is_active: true,
                    });

                if (error) throw error;
                toast.success("Карточка создана");
            }

            refetchMyCard();
            refetch();
        } catch (error) {
            console.error("Error saving card:", error);
            toast.error("Ошибка сохранения карточки");
            throw error;
        }
    };

    // Delete card
    const handleDeleteCard = async () => {
        if (!myCard) return;

        if (!window.confirm("Вы уверены, что хотите удалить карточку?")) return;

        try {
            const { error } = await supabase
                .from("free_agent_cards")
                .delete()
                .eq("id", myCard.id);

            if (error) throw error;
            toast.success("Карточка удалена");
            refetchMyCard();
            refetch();
        } catch (error) {
            console.error("Error deleting card:", error);
            toast.error("Ошибка удаления карточки");
        }
    };

    // Open dialog for creating/editing
    const openCreateDialog = () => {
        setIsEditing(false);
        setDialogOpen(true);
    };

    const openEditDialog = () => {
        setIsEditing(true);
        setDialogOpen(true);
    };

    return (
        <div className="flex min-h-screen w-full bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <main className="flex-1 p-8 gradient-mesh">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between animate-fade-in-up">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-display font-bold tracking-tight">
                                        Свободные агенты
                                    </h1>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        Найдите игроков для вашей команды
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* User CTA Block */}
                        {session && !hasTeam && (
                            <div
                                className="p-5 rounded-xl border bg-gradient-to-br from-primary/5 via-background to-primary/5 animate-fade-in-up"
                                style={{ animationDelay: "0.1s" }}
                            >
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        <div>
                                            {myCard ? (
                                                <p className="font-medium">Ваша карточка активна</p>
                                            ) : (
                                                <p className="font-medium">Ищете команду?</p>
                                            )}
                                            <p className="text-sm text-muted-foreground">
                                                {myCard
                                                    ? "Команды могут найти вас и пригласить"
                                                    : "Создайте карточку и станьте видимым для команд"}
                                            </p>
                                        </div>
                                    </div>

                                    {myCard ? (
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={openEditDialog}>
                                                Редактировать
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={handleDeleteCard}
                                            >
                                                Удалить
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button onClick={openCreateDialog}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Создать карточку
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                            <FreeAgentFiltersPanel
                                filters={filters}
                                onFiltersChange={setFilters}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                            />
                        </div>

                        {/* Cards Grid */}
                        {isLoading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Загрузка...
                            </div>
                        ) : filteredCards.length === 0 ? (
                            <div className="text-center py-12 space-y-4 animate-fade-in-up">
                                <UserX className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                                <h3 className="text-xl font-semibold">
                                    {cards.length === 0
                                        ? "Свободных агентов пока нет"
                                        : "Нет результатов"}
                                </h3>
                                <p className="text-muted-foreground">
                                    {cards.length === 0
                                        ? "Станьте первым — создайте карточку!"
                                        : "Попробуйте изменить параметры поиска"}
                                </p>
                                {cards.length > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setFilters({ search: "", roles: [], minRank: "" })}
                                    >
                                        Сбросить фильтры
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className={viewMode === "grid"
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                : "flex flex-col gap-4"
                            }>
                                {filteredCards.map((card, index) => (
                                    <div
                                        key={card.id}
                                        className="animate-fade-in-up"
                                        style={{ animationDelay: `${0.2 + index * 0.03}s` }}
                                    >
                                        <FreeAgentCard
                                            card={card}
                                            viewMode={viewMode}
                                            isOwnCard={card.user_id === session?.user?.id}
                                            onEdit={openEditDialog}
                                            onDelete={handleDeleteCard}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Create/Edit Dialog */}
            <CreateFreeAgentCardDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSaveCard}
                initialData={myCard ? {
                    intro: myCard.intro,
                    preferred_roles: myCard.preferred_roles || [],
                } : undefined}
                isEditing={isEditing}
            />
        </div>
    );
};

export default FreeAgents;
