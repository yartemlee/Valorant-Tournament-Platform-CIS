import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const isNewUser = searchParams.get("new_user") === "true";
    const riotName = searchParams.get("riot_name") || "";

    const verifyAndRedirect = async () => {
      if (!tokenHash || !type) {
        toast.error("Некорректная ссылка авторизации");
        navigate("/login");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "magiclink",
      });

      if (error) {
        console.error("OTP verification error:", error);
        toast.error("Ошибка авторизации: " + error.message);
        navigate("/login");
        return;
      }

      if (isNewUser) {
        const params = riotName
          ? `?riot_name=${encodeURIComponent(riotName)}`
          : "";
        navigate(`/signup${params}`);
      } else {
        toast.success("Добро пожаловать!");
        navigate("/");
      }
    };

    verifyAndRedirect();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Выполняется вход...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
