import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Shield, Activity } from "lucide-react";

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        users: 0,
        teams: 0,
        tournaments: 0,
        activeMatches: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [
                { count: usersCount },
                { count: teamsCount },
                { count: tournamentsCount },
                { count: matchesCount }
            ] = await Promise.all([
                supabase.from("profiles").select("*", { count: "exact", head: true }),
                supabase.from("teams").select("*", { count: "exact", head: true }),
                supabase.from("tournaments").select("*", { count: "exact", head: true }),
                supabase.from("matches").select("*", { count: "exact", head: true }).eq("status", "live")
            ]);

            setStats({
                users: usersCount || 0,
                teams: teamsCount || 0,
                tournaments: tournamentsCount || 0,
                activeMatches: matchesCount || 0
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: "Всего пользователей",
            value: stats.users,
            icon: Users,
            color: "text-blue-500"
        },
        {
            title: "Команд",
            value: stats.teams,
            icon: Shield,
            color: "text-purple-500"
        },
        {
            title: "Турниров",
            value: stats.tournaments,
            icon: Trophy,
            color: "text-yellow-500"
        },
        {
            title: "Активных матчей",
            value: stats.activeMatches,
            icon: Activity,
            color: "text-green-500"
        }
    ];

    if (loading) {
        return <div>Загрузка статистики...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Дашборд</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminDashboard;
