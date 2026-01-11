import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/5">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                <span className="text-xl font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">ServiçoJá</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              A plataforma que conecta você aos melhores profissionais de Angola.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Luanda, Angola</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Serviços</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/services/barber" className="hover:text-foreground transition-colors">Barbeiro</Link></li>
              <li><Link to="/services/cleaning" className="hover:text-foreground transition-colors">Limpeza</Link></li>
              <li><Link to="/services/electrician" className="hover:text-foreground transition-colors">Electricista</Link></li>
              <li><Link to="/services/plumber" className="hover:text-foreground transition-colors">Canalizador</Link></li>
              <li><Link to="/services" className="hover:text-foreground transition-colors">Ver todos →</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">Sobre Nós</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">Como Funciona</Link></li>
              <li><Link to="/become-worker" className="hover:text-foreground transition-colors">Seja um Profissional</Link></li>
              <li><Link to="/help" className="hover:text-foreground transition-colors">Ajuda</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
          <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+244 929 939 469</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>kellykelilson53@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025–{new Date().getFullYear()} ServiçoJá. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Termos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
