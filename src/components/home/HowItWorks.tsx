import { Search, Calendar, MapPin, Star } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Pesquise',
    description: 'Encontre profissionais verificados na sua cidade pelo serviço que precisa.',
  },
  {
    icon: Calendar,
    title: 'Agende',
    description: 'Escolha o dia e hora que mais lhe convém. Veja preços antes de confirmar.',
  },
  {
    icon: MapPin,
    title: 'Receba',
    description: 'O profissional vai até si. Acompanhe a localização em tempo real.',
  },
  {
    icon: Star,
    title: 'Avalie',
    description: 'Após o serviço, avalie o profissional e ajude outros clientes.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-secondary/5">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Como Funciona
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Contratar um profissional nunca foi tão fácil e seguro
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-border" />
              )}

              {/* Step number */}
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-6 shadow-lg">
                <step.icon className="h-8 w-8 text-primary-foreground" />
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>

              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
