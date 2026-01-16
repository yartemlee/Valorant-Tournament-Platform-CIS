import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Check, X, ArrowRight } from "lucide-react";

interface SubstitutionRequestsListProps {
    tournamentId: string;
}

interface Request {
    id: string;
    team_id: string | null;
    requester_id: string | null;
    player_out_id: string | null;
    player_in_id: string | null;
    status: 'pending' | 'approved' | 'rejected' | null;
    created_at: string;
    team: { name: string } | null;
    player_out: { username: string } | null;
    player_in: { username: string } | null;
    requester: { username: string } | null;
}

export function SubstitutionRequestsList({ tournamentId }: SubstitutionRequestsListProps) {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("substitution_requests")
                .select(`
          *,
          team:team_id(name),
          player_out:player_out_id(username),
          player_in:player_in_id(username),
          requester:requester_id(username)
        `)
                .eq("tournament_id", tournamentId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (error) throw error;
            setRequests((data as unknown as Request[]) || []);
        } catch {
            toast.error("Ошибка загрузки запросов на замену");
        } finally {
            setLoading(false);
        }
    }, [tournamentId]);

    useEffect(() => {
        fetchRequests();

        // Subscribe to changes
        const channel = supabase
            .channel(`substitution_requests_${tournamentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'substitution_requests',
                    filter: `tournament_id=eq.${tournamentId}`
                },
                () => {
                    fetchRequests();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tournamentId, fetchRequests]);

    const handleProcess = async (requestId: string, status: 'approved' | 'rejected') => {
        setProcessingId(requestId);
        try {
            const { data, error } = await supabase.rpc("process_substitution", {
                p_request_id: requestId,
                p_status: status,
            });

            if (error) throw error;

            const result = data as unknown as { success: boolean; message?: string };

            if (result && !result.success) {
                toast.error(result.message || "Ошибка обработки запроса");
                return;
            }

            toast.success(status === 'approved' ? "Замена одобрена" : "Замена отклонена");
            fetchRequests();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Произошла ошибка";
            toast.error("Ошибка: " + errorMessage);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading && requests.length === 0) {
        return <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
    }

    if (requests.length === 0) {
        return null; // Don't show anything if no requests
    }

    return (
        <Card className="mt-6 border-orange-500/20 bg-orange-500/5">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    🔄 Запросы на замену
                    <Badge variant="secondary">{requests.filter(r => r.status === 'pending').length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {requests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border">
                        <div className="space-y-1">
                            <div className="font-medium flex items-center gap-2">
                                {req.team?.name || "Unknown Team"}
                                <Badge variant={req.status === 'pending' ? 'outline' : (req.status === 'approved' ? 'default' : 'destructive')}>
                                    {req.status === 'pending' ? 'Ожидает' : (req.status === 'approved' ? 'Одобрено' : 'Отклонено')}
                                </Badge>
                            </div>
                            <div className="text-sm flex items-center gap-2 text-muted-foreground">
                                <span className="text-destructive">{req.player_out?.username || "Unknown"}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span className="text-green-500">{req.player_in?.username || "Unknown"}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Запросил: {req.requester?.username} • {new Date(req.created_at).toLocaleString()}
                            </div>
                        </div>

                        {req.status === 'pending' && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                    onClick={() => handleProcess(req.id, 'approved')}
                                    disabled={!!processingId}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleProcess(req.id, 'rejected')}
                                    disabled={!!processingId}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
