import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workerId } = await req.json();
    
    if (!workerId) {
      return new Response(
        JSON.stringify({ error: 'Worker ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing verification for worker:', workerId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get verification document
    const { data: doc, error: docError } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('worker_id', workerId)
      .single();

    if (docError || !doc) {
      console.error('Document not found:', docError);
      return new Response(
        JSON.stringify({ error: 'Verification document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Document found:', doc.id);

    // Prepare the AI verification prompt (multimodal)
    const verificationPrompt = `Você é um sistema de verificação de documentos para uma plataforma de serviços em Angola.

Tarefa:
- Verificar se as fotos (selfie, BI frente, BI verso) estão legíveis, nítidas e completas (sem cortes).
- Verificar se os dados textuais parecem plausíveis.
- Sugerir ao ADMINISTRADOR uma decisão (aprovar/reprovar/revisão manual). IMPORTANTE: a decisão FINAL é sempre do administrador.

Critérios de qualidade (legibilidade):
- Texto visível e sem desfoque.
- Documento inteiro dentro da imagem.
- Sem reflexos fortes.
- Selfie com rosto bem visível.

Dados do candidato:
- Nome: ${doc.full_name}
- Número BI: ${doc.bi_number}
- Data Nascimento: ${doc.birth_date}
- Endereço: ${doc.address}

Responda APENAS com JSON válido no formato:
{
  "confidence_score": 0.0,
  "recommendation": "approve" | "reject" | "manual_review",
  "reasons": ["..."],
  "checks": {
    "selfie_legible": true,
    "bi_front_legible": true,
    "bi_back_legible": true
  }
}`;

    type AiOut = {
      confidence_score: number;
      recommendation: 'approve' | 'reject' | 'manual_review';
      reasons: string[];
      checks: {
        selfie_legible: boolean;
        bi_front_legible: boolean;
        bi_back_legible: boolean;
      };
    };

    let aiResult: AiOut = {
      confidence_score: 0.5,
      recommendation: 'manual_review',
      reasons: ['Aguardando análise'],
      checks: {
        selfie_legible: false,
        bi_front_legible: false,
        bi_back_legible: false,
      },
    };

    const hasAllImages = !!doc.selfie_url && !!doc.bi_front_url && !!doc.bi_back_url;

    // Try to use Lovable AI if available
    if (lovableApiKey && hasAllImages) {
      try {
        console.log('Calling Lovable AI for document verification (multimodal)...');

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content:
                  'Você é um verificador rigoroso. Responda sempre e somente com JSON válido, sem texto extra.',
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: verificationPrompt },
                  { type: 'image_url', image_url: { url: doc.selfie_url } },
                  { type: 'image_url', image_url: { url: doc.bi_front_url } },
                  { type: 'image_url', image_url: { url: doc.bi_back_url } },
                ],
              },
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI gateway error:', aiResponse.status, errorText);
        } else {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content as string | undefined;

          if (content) {
            console.log('AI raw response:', content);
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                aiResult = JSON.parse(jsonMatch[0]);
              } catch (parseError) {
                console.error('Failed to parse AI JSON:', parseError);
                aiResult = {
                  confidence_score: 0.3,
                  recommendation: 'manual_review',
                  reasons: ['Falha ao interpretar a resposta da IA, necessário revisão manual.'],
                  checks: {
                    selfie_legible: false,
                    bi_front_legible: false,
                    bi_back_legible: false,
                  },
                };
              }
            }
          }
        }
      } catch (aiError) {
        console.error('AI verification error:', aiError);
        aiResult = {
          confidence_score: 0.3,
          recommendation: 'manual_review',
          reasons: ['Falha na análise IA, necessário revisão manual.'],
          checks: {
            selfie_legible: false,
            bi_front_legible: false,
            bi_back_legible: false,
          },
        };
      }
    } else {
      console.log('Skipping AI analysis: missing LOVABLE_API_KEY or missing images');
      aiResult = {
        confidence_score: 0.4,
        recommendation: 'manual_review',
        reasons: [
          !lovableApiKey ? 'IA indisponível no momento.' : 'Faltam imagens para análise (selfie/BI).',
        ],
        checks: {
          selfie_legible: !!doc.selfie_url,
          bi_front_legible: !!doc.bi_front_url,
          bi_back_legible: !!doc.bi_back_url,
        },
      };
    }

    // Update the verification document with AI result (admin will decide the final status)
    const { error: updateDocError } = await supabase
      .from('verification_documents')
      .update({
        ai_verification_result: aiResult,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', doc.id);

    if (updateDocError) {
      console.error('Failed to update verification_documents:', updateDocError);
      return new Response(
        JSON.stringify({ error: 'Failed to update verification document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('AI analysis completed. Admin review required.');

    return new Response(
      JSON.stringify({
        success: true,
        status: 'pending',
        result: aiResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    console.error('Verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
