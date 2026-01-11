import { Layout } from '@/components/layout/Layout';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Termos de Uso</h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-AO')}
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao aceder e utilizar a plataforma ServiçoJá, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                Se não concordar com qualquer parte destes termos, não deverá utilizar os nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground leading-relaxed">
                O ServiçoJá é uma plataforma que conecta clientes a profissionais de serviços em Angola. 
                Actuamos como intermediários, facilitando a contratação de serviços como barbeiros, electricistas, 
                canalizadores, limpeza doméstica, entre outros.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Elegibilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para utilizar o ServiçoJá, você deve:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li>Ter pelo menos 18 anos de idade</li>
                <li>Ser residente em Angola</li>
                <li>Fornecer informações verdadeiras e actualizadas</li>
                <li>Ter um número de telefone válido</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Responsabilidades do Utilizador</h2>
              <p className="text-muted-foreground leading-relaxed">
                Como utilizador da plataforma, você compromete-se a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li>Utilizar a plataforma de forma legal e ética</li>
                <li>Manter a segurança das suas credenciais de acesso</li>
                <li>Não publicar conteúdo ofensivo, ilegal ou fraudulento</li>
                <li>Respeitar os outros utilizadores e profissionais</li>
                <li>Efectuar pagamentos acordados pelos serviços prestados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Responsabilidades dos Profissionais</h2>
              <p className="text-muted-foreground leading-relaxed">
                Os profissionais registados na plataforma devem:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li>Possuir as qualificações necessárias para os serviços oferecidos</li>
                <li>Cumprir com a verificação de identidade obrigatória</li>
                <li>Prestar serviços de qualidade conforme acordado</li>
                <li>Respeitar os horários e compromissos agendados</li>
                <li>Manter preços transparentes e justos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Pagamentos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Os pagamentos são efectuados directamente entre o cliente e o profissional. 
                O ServiçoJá não é responsável por disputas relacionadas com pagamentos. 
                Recomendamos que todos os valores sejam acordados antes do início do serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Cancelamentos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Tanto clientes como profissionais podem cancelar agendamentos através da plataforma. 
                Cancelamentos frequentes ou de última hora podem resultar em penalizações na conta, 
                incluindo suspensão temporária ou permanente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                O ServiçoJá actua apenas como intermediário e não é responsável por:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li>Qualidade dos serviços prestados pelos profissionais</li>
                <li>Danos ou prejuízos resultantes dos serviços</li>
                <li>Disputas entre clientes e profissionais</li>
                <li>Informações incorrectas fornecidas pelos utilizadores</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Alterações aos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                As alterações entram em vigor imediatamente após a publicação. 
                O uso continuado da plataforma constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para questões sobre estes termos, entre em contacto connosco:
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
