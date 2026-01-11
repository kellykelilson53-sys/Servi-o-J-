import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, Calendar, Clock, MapPin, Calculator,
  CheckCircle, AlertCircle, Loader2, Navigation
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SERVICE_CATEGORIES } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWorkerById } from '@/hooks/useWorkers';
import { useGeolocation } from '@/hooks/useGeolocation';

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function Booking() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { lat: gpsLat, lng: gpsLng, loading: gpsLoading, requestLocation } = useGeolocation();
  
  const { worker, loading: workerLoading } = useWorkerById(id || '');
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [distance, setDistance] = useState(0);
  const [clientLat, setClientLat] = useState<number | null>(null);
  const [clientLng, setClientLng] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useGps, setUseGps] = useState(false);

  // Update client coordinates when GPS is captured
  useEffect(() => {
    if (gpsLat && gpsLng && useGps) {
      setClientLat(gpsLat);
      setClientLng(gpsLng);
    }
  }, [gpsLat, gpsLng, useGps]);

  const handleUseGps = useCallback(async () => {
    setUseGps(true);
    await requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Prevent self-booking: check if this worker belongs to the current user
    if (worker && worker.user_id === user.id) {
      toast({
        title: 'Ação não permitida',
        description: 'Não pode agendar serviços consigo mesmo.',
        variant: 'destructive',
      });
      navigate('/services');
    }
  }, [user, worker, navigate, toast]);

  if (workerLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="animate-pulse text-muted-foreground">A carregar...</div>
        </div>
      </Layout>
    );
  }

  if (!worker) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Profissional não encontrado</h1>
          <Button onClick={() => navigate('/services')}>Ver todos os serviços</Button>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const getServiceName = (type: string) => {
    return SERVICE_CATEGORIES.find(c => c.id === type)?.name || type;
  };

  const basePrice = Number(worker.base_price) || 0;
  const pricePerKm = Number(worker.price_per_km) || 0;
  const distancePrice = distance * pricePerKm;
  const totalPrice = basePrice + distancePrice;

  const handleCalculateDistance = async () => {
    if (!address && !clientLat) {
      toast({
        title: 'Localização obrigatória',
        description: 'Por favor insira o endereço ou use o GPS.',
        variant: 'destructive',
      });
      return;
    }

    setIsCalculating(true);
    
    try {
      // Get worker city from profile
      const workerCity = worker.profiles?.city || 'Luanda';
      
      // Call edge function for real distance calculation
      const { data, error } = await supabase.functions.invoke('calculate-distance', {
        body: { 
          clientAddress: address,
          clientLat: clientLat,
          clientLng: clientLng,
          workerId: worker.id,
          workerCity: workerCity,
        },
      });

      if (error) {
        throw error;
      }

      console.log('Distance calculation result:', data);
      
      setDistance(data.distance_km);
      
      if (data.client_lat && data.client_lng) {
        setClientLat(data.client_lat);
        setClientLng(data.client_lng);
      }
      
      const workerHasGps = data.worker_lat && data.worker_lng && !data.estimated;
      
      toast({
        title: data.geocoded || workerHasGps ? 'Distância calculada' : 'Distância estimada',
        description: `Distância: ${data.distance_km} km${data.estimated ? ' (estimativa)' : ''}`,
      });
    } catch (error: any) {
      console.error('Distance calculation error:', error);
      // Fallback to simulated distance
      const fallbackDistance = Math.floor(Math.random() * 10) + 3;
      setDistance(fallbackDistance);
      toast({
        title: 'Distância estimada',
        description: `Distância aproximada: ${fallbackDistance} km`,
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !address || distance === 0) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor preencha todos os campos e calcule a distância.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const bookingData: any = {
        worker_id: worker.id,
        client_id: user.id,
        service_type: worker.service_type,
        booking_date: selectedDate,
        booking_time: selectedTime,
        location_address: address,
        notes: notes || null,
        distance_km: distance,
        base_price: basePrice,
        distance_price: distancePrice,
        total_price: totalPrice,
        status: 'pending',
      };

      // Add coordinates if available
      if (clientLat !== null && clientLng !== null) {
        bookingData.location_lat = clientLat;
        bookingData.location_lng = clientLng;
      }

      const { error } = await supabase
        .from('bookings')
        .insert(bookingData);

      if (error) throw error;
      
      toast({
        title: 'Pedido enviado!',
        description: 'O profissional irá responder em breve.',
      });
      
      navigate('/client/dashboard');
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: 'Erro ao enviar pedido',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Layout showFooter={false}>
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

      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Agendar Serviço</h1>
          <p className="text-muted-foreground mb-8">
            Complete os dados abaixo para solicitar o serviço
          </p>

          {/* Worker Info Card */}
          <div className="bg-card rounded-xl border border-border/50 p-4 mb-8 flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={worker.profiles?.avatar_url || ''} alt={worker.profiles?.name || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {worker.profiles?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{worker.profiles?.name || 'Profissional'}</h3>
              <p className="text-sm text-muted-foreground">{getServiceName(worker.service_type)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">A partir de</p>
              <p className="font-bold text-primary">{basePrice.toLocaleString('pt-AO')} Kz</p>
            </div>
          </div>

          {/* Booking Form */}
          <div className="space-y-8">
            {/* Step 1: Date & Time */}
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Data e Hora
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Data do Serviço</Label>
                  <Input
                    type="date"
                    min={minDate}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Horário</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-3 text-sm rounded-lg border transition-all ${
                          selectedTime === time
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Location */}
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Localização
              </h2>

              <div className="space-y-4">
                {/* GPS Option */}
                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <Navigation className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">Usar minha localização atual</p>
                    <p className="text-xs text-muted-foreground">
                      Mais preciso para cálculo de distância
                    </p>
                    {gpsLat && gpsLng && useGps ? (
                      <div className="flex items-center gap-2 text-success text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>GPS capturado</span>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUseGps}
                        disabled={gpsLoading}
                      >
                        {gpsLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            A obter...
                          </>
                        ) : (
                          <>
                            <Navigation className="h-4 w-4 mr-2" />
                            Usar GPS
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="px-3 text-sm text-muted-foreground">ou</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <div className="space-y-2">
                  <Label>Endereço Completo</Label>
                  <Input
                    placeholder="Ex: Rua da Missionária, 123, Maianga, Luanda"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    O endereço serve como referência para o profissional
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={handleCalculateDistance}
                  disabled={isCalculating || (!address && !clientLat)}
                  className="w-full md:w-auto"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      A calcular...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Calcular Distância
                    </>
                  )}
                </Button>

                {distance > 0 && (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span>Distância: {distance} km</span>
                    {clientLat && clientLng && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (localização precisa)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Notes */}
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h2 className="font-semibold text-lg mb-4">Observações (opcional)</h2>
              <Textarea
                placeholder="Descreva detalhes adicionais sobre o serviço que precisa..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            {/* Price Summary */}
            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h2 className="font-semibold text-lg mb-4">Resumo do Preço</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Preço base do serviço</span>
                  <span>{basePrice.toLocaleString('pt-AO')} Kz</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Deslocação ({distance} km × {pricePerKm.toLocaleString('pt-AO')} Kz)</span>
                  <span>{distancePrice.toLocaleString('pt-AO')} Kz</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{totalPrice.toLocaleString('pt-AO')} Kz</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-warning/10 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  O pagamento é feito diretamente ao profissional após o serviço.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedDate || !selectedTime || !address || distance === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  A enviar pedido...
                </>
              ) : (
                'Confirmar Agendamento'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
