import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Banknote, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 gradient-trust text-secondary-foreground">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Quer Oferecer os Seus Serviços?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Junte-se a milhares de profissionais verificados e comece a receber 
              clientes na sua cidade. Cadastro simples e rápido.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <span>Verificação de identidade gratuita</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Banknote className="h-5 w-5" />
                </div>
                <span>Defina seus próprios preços</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <span>Acesso a milhares de clientes</span>
              </div>
            </div>

            <Button 
              variant="hero" 
              size="xl" 
              onClick={() => navigate('/register?role=worker')}
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl md:text-7xl font-bold mb-2">1000+</div>
                <p className="text-xl opacity-90">Profissionais Verificados</p>
              </div>
            </div>
            
            {/* Floating stats */}
            <div className="absolute -bottom-4 -left-4 bg-card text-card-foreground rounded-2xl p-4 shadow-xl">
              <div className="text-2xl font-bold text-primary">98%</div>
              <p className="text-sm text-muted-foreground">Satisfação</p>
            </div>
            <div className="absolute -top-4 -right-4 bg-card text-card-foreground rounded-2xl p-4 shadow-xl">
              <div className="text-2xl font-bold text-success">10k+</div>
              <p className="text-sm text-muted-foreground">Serviços</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
