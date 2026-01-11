import { Layout } from '@/components/layout/Layout';
import { ChevronLeft, Search, Calendar, CheckCircle, Star, User, Briefcase, Shield, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function HowItWorks() {
  const navigate = useNavigate();

  const clientSteps = [
    {
      icon: Search,
      title: 'Encontre um Profissional',
      description: 'Pesquise profissionais na sua cidade por categoria de serviço. Veja avaliações, preços e portfólio.'
    },
    {
      icon: Calendar,
      title: 'Agende o Serviço',
      description: 'Escolha a data e hora que melhor lhe convém. Adicione o endereço e veja o preço total calculado.'
    },
    {
      icon: MessageSquare,
      title: 'Comunique-se',
      description: 'Converse directamente com o profissional para alinhar detalhes antes do serviço.'
    },
    {
      icon: CheckCircle,
      title: 'Serviço Realizado',
      description: 'O profissional realiza o serviço. Pague directamente ao profissional após a conclusão.'
    },
    {
      icon: Star,
      title: 'Avalie',
      description: 'Deixe uma avaliação para ajudar outros clientes e melhorar a comunidade.'
    }
  ];

  const workerSteps = [
    {
      icon: User,
      title: 'Crie sua Conta',
      description: 'Registe-se como profissional e escolha a categoria de serviço que oferece.'
    },
    {
      icon: Shield,
      title: 'Verifique sua Identidade',
      description: 'Complete a verificação de identidade com BI e selfie para ganhar a confiança dos clientes.'
    },
    {
      icon: Briefcase,
      title: 'Configure seu Perfil',
      description: 'Adicione descrição, portfólio, defina preços e configure sua agenda de disponibilidade.'
    },
    {
      icon: Calendar,
      title: 'Receba Pedidos',
      description: 'Clientes da sua cidade verão seu perfil e poderão agendar serviços consigo.'
    },
    {
      icon: Star,
      title: 'Cresça seu Negócio',
      description: 'Ofereça serviços de qualidade, ganhe boas avaliações e atraia mais clientes.'
    }
  ];

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

      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Como Funciona
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Contratar um profissional ou oferecer seus serviços nunca foi tão fácil. 
              Veja como o ServiçoJá funciona para si.
            </p>
          </div>
        </div>
      </section>

      {/* For Clients */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <User className="h-4 w-4" />
              Para Clientes
            </div>
            <h2 className="text-3xl font-bold">Encontre o profissional ideal</h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute left-[2.5rem] top-12 bottom-12 w-0.5 bg-border" />

              <div className="space-y-8">
                {clientSteps.map((step, index) => (
                  <div key={index} className="flex gap-6">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <step.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 text-center">
              <Button variant="hero" size="lg" onClick={() => navigate('/services')}>
                Encontrar Profissionais
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* For Workers */}
      <section className="py-16 bg-secondary/5">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
              <Briefcase className="h-4 w-4" />
              Para Profissionais
            </div>
            <h2 className="text-3xl font-bold">Cresça o seu negócio</h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute left-[2.5rem] top-12 bottom-12 w-0.5 bg-border" />

              <div className="space-y-8">
                {workerSteps.map((step, index) => (
                  <div key={index} className="flex gap-6">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center">
                        <step.icon className="h-8 w-8 text-success" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 text-center">
              <Button variant="outline" size="lg" onClick={() => navigate('/register?role=worker')}>
                Começar como Profissional
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Perguntas Frequentes</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border/50 p-6">
                <h3 className="font-semibold mb-2">Como é calculado o preço do serviço?</h3>
                <p className="text-muted-foreground text-sm">
                  O preço é calculado com base no preço base definido pelo profissional, 
                  mais um valor por quilómetro de deslocação até ao local do serviço.
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border/50 p-6">
                <h3 className="font-semibold mb-2">Como funciona a verificação de profissionais?</h3>
                <p className="text-muted-foreground text-sm">
                  Os profissionais devem enviar uma foto do BI (frente e verso) e uma selfie. 
                  Verificamos a autenticidade dos documentos para garantir segurança.
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border/50 p-6">
                <h3 className="font-semibold mb-2">Como faço o pagamento?</h3>
                <p className="text-muted-foreground text-sm">
                  O pagamento é feito directamente ao profissional após a conclusão do serviço. 
                  Pode pagar em dinheiro ou por transferência, conforme acordado.
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border/50 p-6">
                <h3 className="font-semibold mb-2">Posso cancelar um agendamento?</h3>
                <p className="text-muted-foreground text-sm">
                  Sim, pode cancelar um agendamento através da plataforma. 
                  Recomendamos cancelar com antecedência para não prejudicar o profissional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
