import { Layout } from '@/components/layout/Layout';
import { ChevronLeft, Users, Shield, MapPin, Star, Target, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function About() {
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

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Sobre o ServiçoJá
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Somos a plataforma que está a transformar a forma como os angolanos 
              encontram e contratam serviços profissionais.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Target className="h-4 w-4" />
                Nossa Missão
              </div>
              <h2 className="text-3xl font-bold mb-6">
                Conectar Angola através de serviços de qualidade
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O ServiçoJá nasceu da necessidade de criar uma ponte de confiança entre 
                profissionais talentosos e clientes que precisam de serviços de qualidade 
                em Angola.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Acreditamos que todos os angolanos merecem acesso a serviços profissionais 
                de confiança, e que os profissionais merecem uma plataforma justa para 
                mostrar o seu trabalho e crescer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border/50 p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">18</div>
                <p className="text-sm text-muted-foreground">Províncias de Angola</p>
              </div>
              <div className="bg-card rounded-2xl border border-border/50 p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">12</div>
                <p className="text-sm text-muted-foreground">Categorias de Serviço</p>
              </div>
              <div className="bg-card rounded-2xl border border-border/50 p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <p className="text-sm text-muted-foreground">Verificação de Identidade</p>
              </div>
              <div className="bg-card rounded-2xl border border-border/50 p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <p className="text-sm text-muted-foreground">Suporte Disponível</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-secondary/5">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nossos Valores</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Os princípios que guiam tudo o que fazemos no ServiçoJá
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl border border-border/50 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Confiança</h3>
              <p className="text-muted-foreground">
                Verificamos a identidade de todos os profissionais para garantir 
                a segurança dos nossos utilizadores.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-success/10 flex items-center justify-center">
                <Star className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Qualidade</h3>
              <p className="text-muted-foreground">
                Promovemos serviços de excelência através de avaliações 
                transparentes e feedback contínuo.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-warning/10 flex items-center justify-center">
                <Heart className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Comunidade</h3>
              <p className="text-muted-foreground">
                Construímos uma comunidade de profissionais e clientes 
                que se apoiam mutuamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">A Nossa Equipa</h2>
            <p className="text-muted-foreground mb-8">
              Somos uma equipa apaixonada por tecnologia e pelo desenvolvimento de Angola. 
              Trabalhamos todos os dias para melhorar a plataforma e criar valor para 
              os nossos utilizadores.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
              <MapPin className="h-4 w-4" />
              <span>Luanda, Angola</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Junte-se a nós</h2>
            <p className="text-muted-foreground mb-8">
              Seja você um cliente à procura de serviços ou um profissional que quer 
              crescer o seu negócio, o ServiçoJá é para si.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" onClick={() => navigate('/register')}>
                Criar Conta
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/register?role=worker')}>
                Seja um Profissional
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
