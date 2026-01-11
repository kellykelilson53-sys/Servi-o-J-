// src/pages/AuthCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // ajuste o caminho conforme seu projeto

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuth() {
      try {
        // Captura a sessão do link de confirmação do Supabase
        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

        if (error) {
          console.error("Erro ao autenticar:", error.message);
          return;
        }

        if (data?.session) {
          // Login bem-sucedido → redireciona para /services
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

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <p>Autenticando...</p>
    </div>
  );
}
