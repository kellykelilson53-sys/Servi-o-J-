import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuth() {
      try {
        // Captura o token do link de confirmação
        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

        if (error) {
          console.error("Erro ao autenticar:", error.message);
          return;
        }

        if (data?.session) {
          // Login bem-sucedido, redireciona para /services
          navigate("/services");
        } else {
          console.log("Nenhuma sessão encontrada.");
        }
      } catch (err) {
        console.error("Erro inesperado:", err);
      }
    }

    handleAuth();
  }, [navigate]);

  return <p>Autenticando...</p>;
}
