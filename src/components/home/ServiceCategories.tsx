import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/types';
import { Button } from '@/components/ui/button';
import { getServiceIcon } from '@/lib/serviceIcons';

export function ServiceCategories() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Serviços Disponíveis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontre profissionais qualificados para todas as suas necessidades
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {SERVICE_CATEGORIES.map((category, index) => {
            const Icon = getServiceIcon(category.id);
            return (
              <button
                key={category.id}
                onClick={() => navigate(`/services/${category.id}`)}
                className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 text-left animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Button variant="outline" size="lg" onClick={() => navigate('/services')}>
            Ver Todos os Serviços
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
