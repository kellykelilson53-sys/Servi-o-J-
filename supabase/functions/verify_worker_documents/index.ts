// supabase/functions/verify_worker_documents/index.ts

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Util: converter imagem URL → base64 (necessário para Gemini Vision)
async function imageUrlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workerId } = await req.json();

    if (!workerId) {
      return new Response(
        JSON.stringify({ error: "workerId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar documento
    const { data: doc, error: docError } = await supabase
      .from("verification_documents")
      .select("*")
      .eq("worker_id", workerId)
      .single();

    if (docError || !doc) {
      return new Response(
        JSON.stringify({ error: "Documento de verificação não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const hasAllImages =
      !!doc.selfie_url && !!doc.bi_front_url && !!doc.bi_back_url;

    type AiOut = {
      confidence_score: number;
      recommendation: "approve" | "reject" | "manual_review";
      reasons: string[];
      checks: {
        selfie_legible: boolean;
        bi_front_legible: boolean;
        bi_back_legible: boolean;
        bi_angola_format_ok: boolean;
      };
    };

    let aiResult: AiOut = {
      confidence_score: 0.4,
      recommendation: "manual_review",
      reasons: ["Aguardando análise"],
      checks: {
        selfie_legible: false,
        bi_front_legible: false,
        bi_back_legible: false,
        bi_angola_format_ok: false,
      },
    };

    if (!hasAllImages) {
      aiResult.reasons = ["Faltam imagens (selfie, BI frente ou BI verso)"];
    } else {
      // Prompt específico para BI de Angola
      const verificationPrompt = `
Você é um sistema de pré-verificação de documentos para Angola.

Documento esperado: Bilhete de Identidade (BI) da República de Angola.

Verificações obrigatórias:
- O documento deve mencionar Angola / República de Angola.
- BI normalmente contém: nome completo, número do BI, data de nascimento, filiação e fotografia.
- O formato do número do BI deve parecer plausível (alfanumérico, sem símbolos estranhos).
- Frente e verso devem estar completos e sem cortes.
- Selfie deve mostrar claramente o rosto da mesma pessoa do documento.

Dados fornecidos pelo sistema:
- Nome informado: ${doc.full_name}
- Número BI informado: ${doc.bi_number}
- Data de nascimento informada: ${doc.birth_date}
- Endereço informado: ${doc.address}

Tarefa:
1. Avaliar legibilidade das imagens.
2. Avaliar se o documento parece um BI angolano legítimo (apenas aparência).
3. Comparar se o nome no BI parece consistente com o nome informado.
4. Sugerir uma decisão para o administrador.

IMPORTANTE:
- Você NÃO decide a aprovação final.
- Você NÃO confirma autenticidade governamental.
- Apenas análise visual e textual.

Responda SOMENTE com JSON válido no formato:
{
  "confidence_score": 0.0,
  "recommendation": "approve" | "reject" | "manual_review",
  "reasons": ["..."],
  "checks": {
    "selfie_legible": true,
    "bi_front_legible": true,
    "bi_back_legible": true,
    "bi_angola_format_ok": true
  }
}
`;

      try {
        const selfieBase64 = await imageUrlToBase64(doc.selfie_url);
        const biFrontBase64 = await imageUrlToBase64(doc.bi_front_url);
        const biBackBase64 = await imageUrlToBase64(doc.bi_back_url);

        const aiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: verificationPrompt },
                    {
                      inline_data: {
                        mime_type: "image/jpeg",
                        data: selfieBase64,
                      },
                    },
                    {
                      inline_data: {
                        mime_type: "image/jpeg",
                        data: biFrontBase64,
                      },
                    },
                    {
                      inline_data: {
                        mime_type: "image/jpeg",
                        data: biBackBase64,
                      },
                    },
                  ],
                },
              ],
            }),
          },
        );

        const aiData = await aiResponse.json();
        const content =
          aiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (content) {
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            aiResult = JSON.parse(match[0]);
          } else {
            aiResult.reasons = ["Resposta da IA fora do formato esperado"];
          }
        }
      } catch (err) {
        aiResult = {
          confidence_score: 0.3,
          recommendation: "manual_review",
          reasons: ["Erro ao comunicar com a IA"],
          checks: {
            selfie_legible: false,
            bi_front_legible: false,
            bi_back_legible: false,
            bi_angola_format_ok: false,
          },
        };
      }
    }

    // Salvar resultado da IA (admin decide depois)
    const { error: updateError } = await supabase
      .from("verification_documents")
      .update({
        ai_verification_result: aiResult,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", doc.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Falha ao atualizar documento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: "pending_admin_review",
        result: aiResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
