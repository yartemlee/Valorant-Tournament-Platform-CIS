
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { MatchRequest, MatchRequestStatus, MatchRequestType } from "@/types/common.types";
import { toast } from "sonner";

export default function MatchRequestsList() {
    const { tournamentId } = useParams<{ tournamentId: string }>();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tournamentId) {
            fetchRequests();
        }
    }, [tournamentId]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Join with matches to filter by tournament_id
            const { data, error } = await supabase
                .from('match_requests')
                .select(`
                    *,
                    match:matches!inner (
                        id,
                        tournament_id,
                        round_number,
                        match_number
                    ),
                    reporter:profiles (
                        username,
                        avatar_url
                    )
                `)
                .eq('match.tournament_id', tournamentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch {
            toast.error("Ошибка загрузки жалоб");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: MatchRequestStatus) => {
        switch (status) {
            case 'open': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getTypeLabel = (type: MatchRequestType) => {
        switch (type) {
            case 'score_dispute': return 'Спор по счету';
            case 'tech_issue': return 'Тех. проблема';
            case 'cheating': return 'Подозрение в читах';
            case 'other': return 'Другое';
            default: return type;
        }
    };

    const getStatusLabel = (status: MatchRequestStatus) => {
        switch (status) {
            case 'open': return 'Открыто';
            case 'in_progress': return 'В работе';
            case 'resolved': return 'Решено';
            case 'rejected': return 'Отклонено';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 container mx-auto py-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/admin/tournaments">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Жалобы и запросы</h1>
                    <p className="text-muted-foreground">Управление спорами внутри турнира</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Список запросов</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Тип</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead>Матч</TableHead>
                                <TableHead>Сообщил</TableHead>
                                <TableHead>Дата</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        Активных жалоб нет
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-mono text-xs">
                                            {request.id.slice(0, 8)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {getTypeLabel(request.request_type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(request.status)} variant="outline">
                                                {getStatusLabel(request.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            R{request.match.round_number} M{request.match.match_number}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {request.reporter?.username || 'Unknown'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(request.created_at).toLocaleString('ru-RU')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" asChild>
                                                <Link to={`/admin/requests/${request.id}`}>
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    Чат
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
