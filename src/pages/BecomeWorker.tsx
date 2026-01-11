import { Layout } from '@/components/layout/Layout';
import { ChevronLeft, CheckCircle, TrendingUp, Clock, Users, Shield, Star, Wallet, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SERVICE_CATEGORIES } from '@/types';
import { getServiceIcon } from '@/lib/serviceIcons';

export default function BecomeWorker() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Users,
      title: 'Acesso a Clientes',
      description: 'Conecte-se com clientes da sua cidade que precisam dos seus serviços.'
    },
    {
      icon: Calendar,
      title: 'Agenda Flexível',
      description: 'Defina seus próprios horários e disponibilidade. Trabalhe quando quiser.'
    },
    {
      icon: Wallet,
      title: 'Receba Directamente',
      description: 'Sem taxas ou comissões. Receba o pagamento directo do cliente.'
    },
    {
      icon: TrendingUp,
      title: 'Cresça seu Negócio',
      description: 'Aumente sua visibilidade e conquiste mais clientes através de boas avaliações.'
    },
    {
      icon: Shield,
      title: 'Perfil Verificado',
      description: 'Ganhe a confiança dos clientes com o selo de profissional verificado.'
    },
    {
      icon: Star,
      title: 'Destaque-se',
      description: 'Mostre seu portfólio e deixe seu trabalho falar por si.'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Crie sua Conta',
      description: 'Registe-se gratuitamente em poucos minutos. Escolha sua categoria de serviço.'
    },
    {
      number: '2',
      title: 'Verifique sua Identidade',
      description: 'Envie seu BI e uma selfie para verificação. Processo rápido e seguro.'
    },
    {
      number: '3',
      title: 'Configure seu Perfil',
      description: 'Adicione descrição, defina preços, monte seu portfólio e configure sua agenda.'
    },
    {
      number: '4',
      title: 'Comece a Receber Clientes',
      description: 'Após aprovação, seu perfil ficará visível para clientes da sua cidade.'
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
              Seja um Profissional no ServiçoJá
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              Aumente sua renda oferecendo seus serviços para milhares de clientes em Angola. 
              Cadastro gratuito e sem comissões.
            </p>
            <Button variant="hero" size="xl" onClick={() => navigate('/register?role=worker')}>
              Começar Agora - É Grátis
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Por que juntar-se ao ServiçoJá?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Vantagens exclusivas para profissionais que fazem parte da nossa comunidade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="bg-card rounded-2xl border border-border/50 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-secondary/5">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Categorias Disponíveis</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Oferecemos diversas categorias de serviços. Escolha a que melhor representa o seu trabalho.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {SERVICE_CATEGORIES.map((category) => {
              const Icon = getServiceIcon(category.id);
              return (
                <div 
                  key={category.id}
                  className="bg-card rounded-xl border border-border/50 p-4 text-center hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to Start */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Como Começar</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Em 4 passos simples você já pode começar a receber clientes
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-2xl border border-border/50 p-6 relative"
                >
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                    {step.number}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-secondary/5">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Requisitos</h2>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-8">
              <ul className="space-y-4">
                {[
                  'Ter pelo menos 18 anos de idade',
                  'Residir em Angola',
                  'Possuir Bilhete de Identidade válido',
                  'Ter um número de telefone activo',
                  'Experiência comprovável na área de actuação'
                ].map((req, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-muted-foreground mb-8">
              Junte-se a milhares de profissionais que já estão a crescer com o ServiçoJá
            </p>
            <Button variant="hero" size="xl" onClick={() => navigate('/register?role=worker')}>
              Criar Conta de Profissional
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
