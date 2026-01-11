import { useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Phone, MapPin, Briefcase, ArrowRight, ArrowLeft, Mail, Lock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SERVICE_CATEGORIES, ServiceType } from '@/types';
import { getServiceIcon } from '@/lib/serviceIcons';
import { PROVINCES, getMunicipalitiesByProvince } from '@/data/angolaData';
import { LocationCapture } from '@/components/location/LocationCapture';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DbCity = Database['public']['Enums']['city'];
type DbServiceType = Database['public']['Enums']['service_type'];
type DbUserType = Database['public']['Enums']['user_type'];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const initialRole = searchParams.get('role') || 'client';
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'client' | 'worker'>(initialRole === 'worker' ? 'worker' : 'client');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [workerLat, setWorkerLat] = useState<number | null>(null);
  const [workerLng, setWorkerLng] = useState<number | null>(null);

  const municipalities = province ? getMunicipalitiesByProvince(province) : [];

  const handleLocationCaptured = useCallback((lat: number, lng: number) => {
    setWorkerLat(lat);
    setWorkerLng(lng);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !phone || !province || (role === 'worker' && !serviceType)) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Senha fraca',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    // Workers should have GPS location (but not blocking)
    if (role === 'worker' && (!workerLat || !workerLng)) {
      toast({
        title: 'Localização recomendada',
        description: 'A localização GPS ajuda clientes a encontrá-lo mais facilmente. Pode continuar sem ela.',
      });
    }

    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password, {
        name,
        phone,
        city: province as DbCity,
        user_type: role as DbUserType,
        service_type: role === 'worker' ? serviceType as DbServiceType : undefined,
      });
      
      if (error) {
        toast({
          title: 'Erro no cadastro',
          description: error.message === 'User already registered' 
            ? 'Este email já está registrado. Tente fazer login.'
            : error.message,
          variant: 'destructive',
        });
        return;
      }
      
      // If worker and has GPS, update worker location
      if (role === 'worker' && workerLat && workerLng) {
        // Get the worker record that was just created
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          const { data: workerData } = await supabase
            .from('workers')
            .select('id')
            .eq('user_id', newUser.id)
            .single();
          
          if (workerData) {
            await supabase
              .from('workers')
              .update({
                location_lat: workerLat,
                location_lng: workerLng,
              })
              .eq('id', workerData.id);
          }
        }
      }

      toast({
        title: 'Conta criada!',
        description: 'Bem-vindo ao ServiçoJá.',
      });
      
      if (role === 'worker') {
        navigate('/worker/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Criar Conta</h1>
            <p className="text-muted-foreground">
              {step === 1 ? 'Como pretende usar o ServiçoJá?' : 'Preencha os seus dados'}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 shadow-lg">
            {step === 1 ? (
              <div className="space-y-4">
                <button
                  onClick={() => { setRole('client'); setStep(2); }}
                  className={`w-full p-6 rounded-xl border-2 text-left transition-all hover:border-primary ${
                    role === 'client' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Sou Cliente</h3>
                      <p className="text-sm text-muted-foreground">
                        Quero contratar profissionais para serviços
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { setRole('worker'); setStep(2); }}
                  className={`w-full p-6 rounded-xl border-2 text-left transition-all hover:border-primary ${
                    role === 'worker' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Sou Profissional</h3>
                      <p className="text-sm text-muted-foreground">
                        Quero oferecer os meus serviços e receber clientes
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Número de Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="923 456 789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Província</Label>
                  <Select value={province} onValueChange={(v) => { setProvince(v); setMunicipality(''); }}>
                    <SelectTrigger className="h-12">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <SelectValue placeholder="Selecione sua província" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((p) => (
                        <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {province && municipalities.length > 0 && (
                  <div className="space-y-2">
                    <Label>Município (opcional)</Label>
                    <Select value={municipality} onValueChange={setMunicipality}>
                      <SelectTrigger className="h-12">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <SelectValue placeholder="Selecione seu município" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {municipalities.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {role === 'worker' && (
                  <>
                    <div className="space-y-2">
                      <Label>Tipo de Serviço</Label>
                      <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)}>
                        <SelectTrigger className="h-12">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-muted-foreground" />
                            <SelectValue placeholder="Que serviço oferece?" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_CATEGORIES.map((cat) => {
                            const Icon = getServiceIcon(cat.id);
                            return (
                              <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {cat.name}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* GPS Location Capture for Workers */}
                    <div className="space-y-2">
                      <Label>Sua Localização GPS</Label>
                      <LocationCapture 
                        onLocationCaptured={handleLocationCaptured}
                        required={false}
                        showAddress={true}
                      />
                    </div>
                  </>
                )}

                <div className="text-sm text-muted-foreground">
                  Ao criar conta, você concorda com os nossos{' '}
                  <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link>
                  {' '}e{' '}
                  <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading || authLoading}>
                  {isLoading ? 'A criar...' : 'Criar Conta'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Já tem conta? </span>
              <Link to="/login" className="text-primary font-medium hover:underline">
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
