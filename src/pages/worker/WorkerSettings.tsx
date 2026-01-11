import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Loader2, Plus, Trash2, Image as ImageIcon, MapPin, Navigation, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { Database } from '@/integrations/supabase/types';

type Worker = Database['public']['Tables']['workers']['Row'];
type PortfolioItem = Database['public']['Tables']['worker_portfolio']['Row'];

export default function WorkerSettings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { lat: gpsLat, lng: gpsLng, loading: gpsLoading, requestLocation } = useGeolocation();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [pricePerKm, setPricePerKm] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [offersHomeService, setOffersHomeService] = useState(false);
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchWorker() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data) {
        setWorker(data);
        setDescription(data.description || '');
        setBasePrice(String(data.base_price || 0));
        setPricePerKm(String(data.price_per_km || 0));
        setIsAvailable(data.is_available);
        setOffersHomeService(data.offers_home_service);
        setLocationLat(data.location_lat);
        setLocationLng(data.location_lng);

        // Fetch portfolio
        const { data: portfolioData } = await supabase
          .from('worker_portfolio')
          .select('*')
          .eq('worker_id', data.id)
          .order('created_at', { ascending: false });

        if (portfolioData) {
          setPortfolio(portfolioData);
        }
      }
      setLoading(false);
    }

    if (user) {
      fetchWorker();
    }
  }, [user]);

  const handleSave = async () => {
    if (!worker) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('workers')
        .update({
          description: description || null,
          base_price: Number(basePrice) || 0,
          price_per_km: Number(pricePerKm) || 0,
          is_available: isAvailable,
          offers_home_service: offersHomeService,
        })
        .eq('id', worker.id);

      if (error) throw error;

      toast({
        title: 'Configurações guardadas!',
        description: 'As suas definições foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível guardar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLocation = useCallback(async () => {
    if (!worker) return;
    
    const coords = await requestLocation();
    if (!coords) return;
    
    setSavingLocation(true);
    try {
      const { error } = await supabase
        .from('workers')
        .update({
          location_lat: coords.lat,
          location_lng: coords.lng,
        })
        .eq('id', worker.id);

      if (error) throw error;

      setLocationLat(coords.lat);
      setLocationLng(coords.lng);

      toast({
        title: 'Localização atualizada!',
        description: 'A sua localização GPS foi guardada com sucesso.',
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a localização.',
        variant: 'destructive',
      });
    } finally {
      setSavingLocation(false);
    }
  }, [worker, requestLocation, toast]);

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!worker || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${worker.id}/${Date.now()}.${fileExt}`;

    setUploading(true);
    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      // Save to portfolio
      const { data: portfolioItem, error: insertError } = await supabase
        .from('worker_portfolio')
        .insert({
          worker_id: worker.id,
          image_url: urlData.publicUrl,
          description: null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (portfolioItem) {
        setPortfolio(prev => [portfolioItem, ...prev]);
      }

      toast({
        title: 'Imagem adicionada!',
        description: 'A imagem foi adicionada ao seu portfólio.',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a imagem.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (item: PortfolioItem) => {
    try {
      const { error } = await supabase
        .from('worker_portfolio')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setPortfolio(prev => prev.filter(p => p.id !== item.id));

      toast({
        title: 'Imagem removida',
        description: 'A imagem foi removida do seu portfólio.',
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a imagem.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <Layout showFooter={false}>
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">A carregar...</div>
        </div>
      </Layout>
    );
  }

  if (!worker) {
    return (
      <Layout showFooter={false}>
        <div className="container py-8 text-center">
          <p>Não foi possível carregar as definições.</p>
          <Button onClick={() => navigate('/worker/dashboard')} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  const isVerified = worker.verification_status === 'verified';

  return (
    <Layout showFooter={false}>
      <div className="bg-secondary/5 border-b border-border">
        <div className="container py-4">
          <button
            onClick={() => navigate('/worker/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar ao Dashboard
          </button>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Definições</h1>

          {!isVerified && (
            <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <p className="text-sm text-warning">
                Complete a verificação de identidade para poder editar todas as definições.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Descrição do Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Descreva os seus serviços, experiência e especialidades..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  disabled={!isVerified}
                />
              </CardContent>
            </Card>

            {/* Portfolio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portfólio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Adicione fotos dos seus trabalhos para mostrar aos clientes.
                </p>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadImage}
                  accept="image/*"
                  className="hidden"
                />
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isVerified || uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      A carregar...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Imagem
                    </>
                  )}
                </Button>

                {portfolio.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {portfolio.map((item) => (
                      <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden">
                        <img
                          src={item.image_url}
                          alt="Portfolio"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteImage(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Nenhuma imagem no portfólio</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preços</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Preço Base (Kz)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    disabled={!isVerified}
                  />
                  <p className="text-xs text-muted-foreground">
                    O preço mínimo que cobra pelo serviço
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Preço por Km (Kz)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={pricePerKm}
                    onChange={(e) => setPricePerKm(e.target.value)}
                    disabled={!isVerified}
                  />
                  <p className="text-xs text-muted-foreground">
                    Taxa adicional por quilómetro de deslocação
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localização GPS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  A sua localização é usada para calcular a distância até os clientes de forma precisa.
                </p>

                {locationLat && locationLng ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Localização configurada</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Coordenadas: {locationLat.toFixed(6)}, {locationLng.toFixed(6)}
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleUpdateLocation}
                      disabled={gpsLoading || savingLocation || !isVerified}
                    >
                      {gpsLoading || savingLocation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          A atualizar...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2" />
                          Atualizar Localização
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                      <p className="text-sm text-warning">
                        Você ainda não configurou sua localização. Isso pode afetar a precisão do cálculo de distância.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleUpdateLocation}
                      disabled={gpsLoading || savingLocation || !isVerified}
                      className="w-full"
                    >
                      {gpsLoading || savingLocation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          A capturar localização...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2" />
                          Capturar Minha Localização
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Disponibilidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Disponível para trabalhar</Label>
                    <p className="text-xs text-muted-foreground">
                      Aparecer como disponível nas buscas
                    </p>
                  </div>
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={setIsAvailable}
                    disabled={!isVerified}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Atendimento ao domicílio</Label>
                    <p className="text-xs text-muted-foreground">
                      Oferecer serviço na casa do cliente
                    </p>
                  </div>
                  <Switch
                    checked={offersHomeService}
                    onCheckedChange={setOffersHomeService}
                    disabled={!isVerified}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleSave}
              disabled={saving || !isVerified}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Guardar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}