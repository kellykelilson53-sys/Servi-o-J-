import { Layout } from '@/components/layout/Layout';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="bg-secondary/5 border-b border-border">
        <div className="container py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </button>
        </div>
      </div>

      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Política de Privacidade</h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-AO')}
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
              <p className="text-muted-foreground leading-relaxed">
                A ServiçoJá está comprometida em proteger a sua privacidade. Esta política explica como 
                recolhemos, utilizamos, armazenamos e protegemos as suas informações pessoais quando 
                utiliza a nossa plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Informações que Recolhemos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Recolhemos as seguintes informações:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li><strong>Dados de registo:</strong> Nome, email, telefone, cidade</li>
                <li><strong>Dados de verificação:</strong> Documento de identidade (BI), selfie</li>
                <li><strong>Dados de uso:</strong> Histórico de serviços, avaliações, mensagens</li>
                <li><strong>Dados de localização:</strong> Endereços de serviço fornecidos</li>
                <li><strong>Dados financeiros:</strong> Histórico de transacções (valores acordados)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Como Utilizamos as Informações</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos as suas informações para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li>Fornecer e melhorar os nossos serviços</li>
                <li>Verificar a identidade dos profissionais</li>
                <li>Facilitar a comunicação entre clientes e profissionais</li>
                <li>Processar pagamentos e transacções</li>
                <li>Enviar notificações importantes sobre a sua conta</li>
                <li>Garantir a segurança da plataforma</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Partilha de Informações</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos partilhar as suas informações com:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li><strong>Outros utilizadores:</strong> Informações de perfil público para facilitar serviços</li>
                <li><strong>Prestadores de serviços:</strong> Empresas que nos ajudam a operar a plataforma</li>
                <li><strong>Autoridades:</strong> Quando exigido por lei ou para proteger direitos</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Nunca vendemos as suas informações pessoais a terceiros.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Segurança dos Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas de segurança para proteger as suas informações, incluindo:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li>Encriptação de dados sensíveis</li>
                <li>Acesso restrito a informações pessoais</li>
                <li>Monitorização contínua de segurança</li>
                <li>Actualizações regulares de segurança</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Retenção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Mantemos as suas informações enquanto a sua conta estiver activa ou conforme necessário 
                para fornecer serviços. Após o encerramento da conta, podemos reter alguns dados para 
                cumprir obrigações legais ou resolver disputas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Os Seus Direitos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Você tem direito a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li>Aceder às suas informações pessoais</li>
                <li>Corrigir dados incorrectos</li>
                <li>Solicitar a eliminação dos seus dados</li>
                <li>Exportar os seus dados</li>
                <li>Retirar consentimento para processamento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cookies e Tecnologias</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies e tecnologias similares para melhorar a experiência do utilizador, 
                analisar o uso da plataforma e personalizar conteúdo. Pode gerir as preferências de 
                cookies através das configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Alterações à Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos actualizar esta política periodicamente. Notificaremos sobre alterações 
                significativas através da plataforma ou por email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para questões sobre privacidade ou para exercer os seus direitos, contacte-nos:
              </p>
              <ul className="list-none text-muted-foreground space-y-2 mt-4">
                <li><strong>Email:</strong> kellykelilson53@gmail.com</li>
                <li><strong>Telefone:</strong> +244 929 939 469</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
