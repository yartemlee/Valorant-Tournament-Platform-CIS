import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import RiotLogo from "@/components/icons/RiotLogo";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);

    try {
      let loginEmail = username;

      if (!username.includes("@")) {
        const { data: emailData, error: emailError } = await supabase.rpc(
          "get_email_by_username",
          { username_input: username }
        );

        if (emailError || !emailData) {
          toast.error("Пользователь с таким никнеймом не найден");
          setLoading(false);
          return;
        }

        loginEmail = emailData;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Неверный username или пароль");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Добро пожаловать!");
      navigate("/");
    } catch {
      toast.error("Произошла ошибка при входе");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a1a] relative overflow-hidden">
      {/* Background artwork overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url('https://cdn1.epicgames.com/offer/cbd5b3d310a54b12bf3fe8c41994174f/EGS_VALORANT_RiotGames_S1_2560x1440-160462b4ecb874691fe9a89fecd391b0')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "grayscale(100%)",
        }}
      />

      {/* Riot Games logo — top left */}
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-2">
          <RiotLogo className="h-8 w-auto text-white" />
          <span className="text-white font-bold text-lg tracking-wider uppercase">
            Riot Games
          </span>
        </div>
      </div>

      {/* Simulation banner */}
      <div className="relative z-10 flex justify-center">
        <div className="bg-amber-500/90 text-black text-xs font-semibold px-4 py-1.5 rounded-b-lg tracking-wide uppercase">
          Имитация RSO — в production будет редирект на auth.riotgames.com
        </div>
      </div>

      {/* Center card */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4">
        <div className="w-full max-w-[460px] bg-white rounded-lg shadow-2xl py-10 px-12">
          <h1 className="text-center text-[#1a1a1a] text-2xl font-bold mb-8">
            Sign in
          </h1>

          <form onSubmit={handleLogin} className="space-y-0">
            {/* USERNAME field */}
            <div className="border-l-[3px] border-[#bcbcbc] focus-within:border-[#D32936] bg-[#f0f0f0] px-4 py-2.5 transition-colors">
              <label className="block text-[10px] font-bold text-[#8c8c8c] uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent text-[#1a1a1a] text-sm outline-none placeholder:text-[#bcbcbc]"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            {/* PASSWORD field */}
            <div className="border-l-[3px] border-[#bcbcbc] focus-within:border-[#D32936] bg-[#f0f0f0] px-4 py-2.5 mt-px transition-colors">
              <label className="block text-[10px] font-bold text-[#8c8c8c] uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-[#1a1a1a] text-sm outline-none placeholder:text-[#bcbcbc]"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {/* Social login buttons row */}
            <div className="flex justify-center gap-2 pt-5">
              {[
                { bg: "#1877F2", label: "Facebook", icon: "f" },
                { bg: "#ffffff", label: "Google", icon: "G", textColor: "#D32936", border: true },
                { bg: "#000000", label: "Apple", icon: "\uF8FF" },
                { bg: "#107C10", label: "Xbox", icon: "X" },
                { bg: "#003087", label: "PlayStation", icon: "P" },
              ].map((provider) => (
                <button
                  key={provider.label}
                  type="button"
                  disabled
                  className="w-16 h-9 rounded-sm text-xs font-bold flex items-center justify-center cursor-not-allowed opacity-50 transition-opacity"
                  style={{
                    backgroundColor: provider.bg,
                    color: provider.textColor || "#ffffff",
                    border: provider.border ? "1px solid #ddd" : "none",
                  }}
                  title={provider.label}
                >
                  {provider.icon}
                </button>
              ))}
            </div>

            {/* Stay signed in */}
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="staySignedIn"
                checked={staySignedIn}
                onChange={(e) => setStaySignedIn(e.target.checked)}
                className="w-4 h-4 accent-[#D32936]"
              />
              <label
                htmlFor="staySignedIn"
                className="text-xs text-[#8c8c8c] cursor-pointer select-none"
              >
                Stay signed in
              </label>
            </div>

            {/* Red circle submit button */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-14 h-14 rounded-full bg-[#D32936] hover:bg-[#b91c28] text-white flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105"
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <ArrowRight className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Links */}
            <div className="text-center pt-5 space-y-1">
              <p className="text-[11px] text-[#8c8c8c] uppercase tracking-wider font-semibold cursor-pointer hover:text-[#D32936] transition-colors">
                Can&apos;t sign in?
              </p>
              <p
                onClick={() => navigate("/signup")}
                className="text-[11px] text-[#8c8c8c] uppercase tracking-wider font-semibold cursor-pointer hover:text-[#D32936] transition-colors"
              >
                Create account
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-wider font-semibold text-[#666]">
          <span className="hover:text-white cursor-pointer transition-colors">
            Support
          </span>
          <span className="hover:text-white cursor-pointer transition-colors">
            Privacy Notice
          </span>
          <span className="hover:text-white cursor-pointer transition-colors">
            Terms of Service
          </span>
          <span className="hover:text-white cursor-pointer transition-colors">
            Cookie Preferences
          </span>
          <span className="flex items-center gap-1 text-[#999]">
            RU
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"
              />
            </svg>
          </span>
        </div>
        <p className="text-center text-[10px] text-[#555] mt-2 uppercase tracking-wide">
          &copy; 2020 Riot Games. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Login;
