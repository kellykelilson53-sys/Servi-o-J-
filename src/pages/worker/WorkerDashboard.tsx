import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, AlertTriangle, Clock, Star, 
  Calendar, Settings, Camera, TrendingUp
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { SERVICE_CATEGORIES } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Worker = Database['public']['Tables']['workers']['Row'];

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loadingWorker, setLoadingWorker] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione uma imagem');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Foto de perfil atualizada!');
      refreshProfile();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao atualizar foto');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

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
      }
      setLoadingWorker(false);
    }

    if (user) {
      fetchWorker();
    }
  }, [user]);

  if (loading || loadingWorker) {
    return (
      <Layout showFooter={false}>
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">A carregar...</div>
        </div>
      </Layout>
    );
  }

  if (!user || !worker) {
    return null;
  }

  const getServiceName = (type: string) => {
    return SERVICE_CATEGORIES.find(c => c.id === type)?.name || type;
  };

  const isVerified = worker.verification_status === 'verified';
  const isPending = worker.verification_status === 'pending';
  const isRejected = worker.verification_status === 'rejected';

  return (
    <Layout showFooter={false}>
      <div className="container py-8">
        {/* Verification Banner */}
        {!isVerified && (
          <div className={`mb-8 p-6 rounded-2xl ${
            isPending 
              ? 'bg-warning/10 border border-warning/30' 
              : isRejected
              ? 'bg-destructive/10 border border-destructive/30'
              : 'bg-destructive/10 border border-destructive/30'
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                {isPending ? (
                  <Clock className="h-8 w-8 text-warning" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                )}
                <div>
                  <h2 className="text-lg font-semibold mb-1">
                    {isPending 
                      ? 'Verificação em Análise' 
                      : isRejected
                      ? 'Verificação Rejeitada'
                      : 'Conta Não Verificada'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isPending 
                      ? 'Os seus documentos estão a ser analisados. Isso pode levar até 24 horas.'
                      : isRejected
                      ? 'A verificação foi rejeitada. Verifique o motivo e tente novamente.'
                      : 'Para começar a receber clientes, é obrigatório verificar a sua identidade.'}
                  </p>
                </div>
              </div>
              {!isPending && (
                <Button 
                  variant={isRejected ? 'destructive' : 'hero'}
                  onClick={() => navigate('/worker/verify')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {isRejected ? 'Tentar Novamente' : 'Verificar Conta'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.name || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {profile?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button 
                onClick={handleCameraClick}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{profile?.name || 'Profissional'}</h1>
                {isVerified && (
                  <Badge className="bg-success text-success-foreground gap-1">
                    <Shield className="h-3 w-3" />
                    Verificado
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{getServiceName(worker.service_type)}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  {Number(worker.rating).toFixed(1)}
                </span>
                <span className="text-muted-foreground">
                  {worker.review_count} avaliações
                </span>
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={() => navigate('/worker/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Definições
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">
                Ganhos Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {Number(worker.total_earnings).toLocaleString('pt-AO')} Kz
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">
                Preço Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Number(worker.base_price).toLocaleString('pt-AO')} Kz
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">
                Serviços Feitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{worker.completed_jobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">
                Avaliação Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                <Star className="h-5 w-5 text-warning fill-warning" />
                {Number(worker.rating).toFixed(1)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/worker/bookings')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Meus Pedidos</h3>
                  <p className="text-sm text-muted-foreground">Ver pedidos pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/worker/schedule')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <Clock className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Minha Agenda</h3>
                  <p className="text-sm text-muted-foreground">Gerir disponibilidade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/worker/earnings')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/10">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold">Meus Ganhos</h3>
                  <p className="text-sm text-muted-foreground">Histórico financeiro</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blocked Features Notice */}
        {!isVerified && (
          <div className="mt-8 p-6 bg-muted/50 rounded-2xl">
            <h3 className="font-semibold mb-3">Funcionalidades Bloqueadas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete a verificação de identidade para desbloquear:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                Aparecer nas buscas de clientes
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                Receber pedidos de serviço
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                Definir preços e disponibilidade
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                Ativar atendimento ao domicílio
              </li>
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
}
