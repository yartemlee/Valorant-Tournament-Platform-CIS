import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    Trophy,
    Shield,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { toast } from "sonner";

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/login");
                return;
            }

            const { data: roles } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .eq("role", "admin")
                .single();

            if (!roles) {
                toast.error("Доступ запрещен");
                navigate("/");
                return;
            }

            setLoading(false);
        } catch (error) {
            console.error("Auth check error:", error);
            navigate("/");
        }
    };

    const handleExitAdmin = () => {
        navigate("/");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const menuItems = [
        { path: "/admin", icon: LayoutDashboard, label: "Дашборд" },
        { path: "/admin/users", icon: Users, label: "Пользователи" },
        { path: "/admin/teams", icon: Shield, label: "Команды" },
        { path: "/admin/tournaments", icon: Trophy, label: "Турниры" },
    ];

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:relative lg:translate-x-0`}
            >
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <div className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                            Admin Panel
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-accent hover:text-accent-foreground"
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-border">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={handleExitAdmin}
                        >
                            <LogOut className="h-5 w-5 mr-3" />
                            Выйти
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 lg:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                    <span className="font-semibold">Admin Panel</span>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
