
import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Send, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { MatchRequestWithDetails, MatchRequestMessage } from "@/types/common.types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MatchRequestDetails() {
    const { requestId } = useParams<{ requestId: string }>();
    const [request, setRequest] = useState<MatchRequestWithDetails | null>(null);
    const [messages, setMessages] = useState<MatchRequestMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
        getCurrentUser();

        // Subscribe to messages
        const channel = supabase
            .channel(`request-${requestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'match_request_messages',
                    filter: `request_id=eq.${requestId}`
                },
                (payload) => {
                    const newMsg = payload.new as MatchRequestMessage;
                    setMessages((prev) => [...prev, newMsg]);
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [requestId]);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUser(user);
    };

    const fetchData = async () => {
        if (!requestId) return;
        setLoading(true);
        try {
            // Fetch request details
            const { data: requestData, error: requestError } = await supabase
                .from('match_requests')
                .select(`
                    *,
                    match:matches (
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
                .eq('id', requestId)
                .single();

            if (requestError) throw requestError;
            setRequest(requestData as any);

            // Fetch messages
            const { data: messagesData, error: messagesError } = await supabase
                .from('match_request_messages')
                .select('*')
                .eq('request_id', requestId)
                .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;
            setMessages(messagesData || []);
            scrollToBottom();
        } catch {
            toast.error("Ошибка загрузки данных");
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !requestId) return;

        try {
            const { error } = await supabase
                .from('match_request_messages')
                .insert({
                    request_id: requestId,
                    sender_id: currentUser.id,
                    message: newMessage.trim()
                });

            if (error) throw error;
            setNewMessage("");
            // Optimistic update is handled by subscription, but for safety:
            // fetchMessages(); 
        } catch {
            toast.error("Ошибка отправки сообщения");
        }
    };

    const handleStatusUpdate = async (newStatus: 'resolved' | 'rejected') => {
        if (!window.confirm(`Вы уверены, что хотите изменить статус на "${newStatus}"?`)) return;

        try {
            const { error } = await supabase
                .from('match_requests')
                .update({
                    status: newStatus,
                    resolved_by: currentUser?.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) throw error;
            toast.success("Статус обновлен");
            fetchData();
        } catch {
            toast.error("Ошибка обновления статуса");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!request) {
        return <div className="p-8 text-center">Запрос не найден</div>;
    }

    return (
        <div className="container mx-auto py-6 max-w-4xl h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/tournaments/${request.match?.tournament_id}/requests`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            Запрос #{request.id.slice(0, 8)}
                            <Badge variant="outline" className="text-sm">
                                {request.match ? `R${request.match.round_number} M${request.match.match_number}` : 'Unknown Match'}
                            </Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {request.request_type} • От: {request.reporter?.username}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {request.status !== 'resolved' && request.status !== 'rejected' && (
                        <>
                            <Button variant="outline" className="text-red-500 hover:text-red-600" onClick={() => handleStatusUpdate('rejected')}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Отклонить
                            </Button>
                            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate('resolved')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Решить
                            </Button>
                        </>
                    )}
                    <Badge variant="secondary" className="uppercase">
                        {request.status}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Details Column */}
                <div className="md:col-span-1 space-y-4 overflow-y-auto pr-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Детали</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Описание проблемы</label>
                                <p className="text-sm mt-1 whitespace-pre-wrap">{request.description}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Дата создания</label>
                                <p className="text-sm mt-1">{new Date(request.created_at).toLocaleString()}</p>
                            </div>
                            {request.resolved_by && (
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Решено кем</label>
                                    <p className="text-sm mt-1 text-muted-foreground font-mono">{request.resolved_by}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Chat Column */}
                <div className="md:col-span-2 flex flex-col h-full min-h-0">
                    <Card className="flex flex-col h-full border-0 shadow-none md:border md:shadow-sm">
                        <CardHeader className="py-3 px-4 border-b shrink-0">
                            <CardTitle className="text-base">Чат с организатором</CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-hidden p-0 relative bg-muted/30">
                            <ScrollArea className="h-full p-4">
                                <div className="space-y-4 flex flex-col">
                                    {messages.length === 0 && (
                                        <div className="text-center text-muted-foreground text-sm py-10">
                                            Нет сообщений. Напишите первое сообщение.
                                        </div>
                                    )}
                                    {messages.map((msg) => {
                                        const isMe = msg.sender_id === currentUser?.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div
                                                    className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${isMe
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-background border'
                                                        }`}
                                                >
                                                    <p>{msg.message}</p>
                                                    <span className={`text-[10px] block text-right mt-1 opacity-70`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>
                            </ScrollArea>
                        </CardContent>

                        <CardFooter className="p-3 border-t bg-background shrink-0">
                            <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Напишите сообщение..."
                                    className="flex-1"
                                    disabled={request.status === 'resolved' || request.status === 'rejected'}
                                />
                                <Button type="submit" size="icon" disabled={!newMessage.trim() || request.status === 'resolved' || request.status === 'rejected'}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
