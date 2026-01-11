import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, CheckCircle, XCircle, Clock, 
  TrendingUp, Calendar, AlertTriangle, Eye, Bot, ExternalLink, RefreshCw, Loader2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

interface AIVerificationResult {
  approved?: boolean;
  confidence_score: number;
  reasons: string[];
  recommendation: 'approve' | 'reject' | 'manual_review';
  checks?: {
    selfie_legible?: boolean;
    bi_front_legible?: boolean;
    bi_back_legible?: boolean;
  };
}

type Worker = Database['public']['Tables']['workers']['Row'];
type VerificationDocument = Database['public']['Tables']['verification_documents']['Row'];

interface PendingWorker extends Worker {
  profiles: { name: string; avatar_url: string | null; city: string } | null;
  verification_documents: VerificationDocument | null;
}

interface Stats {
  totalWorkers: number;
  verifiedWorkers: number;
  pendingVerifications: number;
  totalBookings: number;
  completedBookings: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<Stats>({
    totalWorkers: 0,
    verifiedWorkers: 0,
    pendingVerifications: 0,
    totalBookings: 0,
    completedBookings: 0,
  });
  const [pendingWorkers, setPendingWorkers] = useState<PendingWorker[]>([]);
  const [allWorkers, setAllWorkers] = useState<PendingWorker[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [reanalyzing, setReanalyzing] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<PendingWorker | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user || !isAdmin) return;

    setLoadingData(true);

    try {
      // Fetch stats (counts)
      const [
        totalWorkersRes,
        verifiedWorkersRes,
        pendingVerificationsRes,
        totalBookingsRes,
        completedBookingsRes,
      ] = await Promise.all([
        supabase.from('workers').select('*', { count: 'exact', head: true }),
        supabase
          .from('workers')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'verified'),
        supabase
          .from('workers')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'pending'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed'),
      ]);

      const maybeThrow = (res: { error: any }) => {
        if (res?.error) throw res.error;
      };

      [
        totalWorkersRes,
        verifiedWorkersRes,
        pendingVerificationsRes,
        totalBookingsRes,
        completedBookingsRes,
      ].forEach(maybeThrow);

      setStats({
        totalWorkers: totalWorkersRes.count || 0,
        verifiedWorkers: verifiedWorkersRes.count || 0,
        pendingVerifications: pendingVerificationsRes.count || 0,
        totalBookings: totalBookingsRes.count || 0,
        completedBookings: completedBookingsRes.count || 0,
      });

      const enrichWorkers = async (rows: Worker[]): Promise<PendingWorker[]> => {
        if (!rows || rows.length === 0) return [];

        const userIds = Array.from(new Set(rows.map((w) => w.user_id)));
        const workerIds = Array.from(new Set(rows.map((w) => w.id)));

        const [profilesRes, docsRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, name, avatar_url, city')
            .in('id', userIds),
          supabase
            .from('verification_documents')
            .select('*')
            .in('worker_id', workerIds),
        ]);

        maybeThrow(profilesRes);
        maybeThrow(docsRes);

        const profilesMap = new Map<string, PendingWorker['profiles']>();
        (profilesRes.data || []).forEach((p: any) => {
          profilesMap.set(p.id, {
            name: p.name,
            avatar_url: p.avatar_url,
            city: p.city,
          });
        });

        const docsMap = new Map<string, VerificationDocument>();
        (docsRes.data || []).forEach((d: any) => {
          docsMap.set(d.worker_id, d as VerificationDocument);
        });

        return rows.map((w) => ({
          ...(w as Worker),
          profiles: profilesMap.get(w.user_id) ?? null,
          verification_documents: docsMap.get(w.id) ?? null,
        }));
      };

      const [pendingRes, allRes] = await Promise.all([
        supabase
          .from('workers')
          .select('*')
          .eq('verification_status', 'pending')
          .order('created_at', { ascending: false }),
        supabase.from('workers').select('*').order('created_at', { ascending: false }),
      ]);

      maybeThrow(pendingRes);
      maybeThrow(allRes);

      setPendingWorkers(await enrichWorkers((pendingRes.data as Worker[]) || []));
      setAllWorkers(await enrichWorkers((allRes.data as Worker[]) || []));
    } catch (err: any) {
      console.error('AdminDashboard fetchData error:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do painel admin.',
        variant: 'destructive',
      });
      setPendingWorkers([]);
      setAllWorkers([]);
    } finally {
      setLoadingData(false);
    }
  }, [user, isAdmin, toast]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (!loading && user && !isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta página.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate, toast]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin, fetchData]);

  // Realtime subscription for verification_documents and workers
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel('admin-verification-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verification_documents' },
        () => {
          console.log('verification_documents changed, refreshing...');
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workers' },
        () => {
          console.log('workers changed, refreshing...');
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, fetchData]);

  const handleApprove = async (workerId: string) => {
    setProcessing(workerId);
    
    const { error } = await supabase
      .from('workers')
      .update({ verification_status: 'verified' })
      .eq('id', workerId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar o trabalhador.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Aprovado!',
        description: 'O trabalhador foi verificado com sucesso.',
      });
      setPendingWorkers(prev => prev.filter(w => w.id !== workerId));
      setStats(prev => ({
        ...prev,
        verifiedWorkers: prev.verifiedWorkers + 1,
        pendingVerifications: prev.pendingVerifications - 1,
      }));
    }
    
    setProcessing(null);
  };

  const handleReject = async (workerId: string) => {
    setProcessing(workerId);
    
    const { error } = await supabase
      .from('workers')
      .update({ verification_status: 'rejected' })
      .eq('id', workerId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar o trabalhador.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Rejeitado',
        description: 'O trabalhador foi rejeitado.',
      });
      setPendingWorkers(prev => prev.filter(w => w.id !== workerId));
      setStats(prev => ({
        ...prev,
        pendingVerifications: prev.pendingVerifications - 1,
      }));
    }
    
    setProcessing(null);
  };

  const handleReanalyze = async (workerId: string) => {
    setReanalyzing(workerId);
    
    try {
      const { error } = await supabase.functions.invoke('verify-documents', {
        body: { workerId },
      });
      
      if (error) {
        throw error;
      }

      toast({
        title: 'Reanálise iniciada',
        description: 'A IA está a analisar os documentos novamente.',
      });
      
      // Refresh data after a short delay
      setTimeout(() => fetchData(), 2000);
    } catch (error: any) {
      console.error('Reanalyze error:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível reanalisar os documentos.',
        variant: 'destructive',
      });
    } finally {
      setReanalyzing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Verificado</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-warning-foreground">Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Não verificado</Badge>;
    }
  };

  if (loading || loadingData) {
    return (
      <Layout showFooter={false}>
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">A carregar...</div>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Layout showFooter={false}>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Painel Admin</h1>
            <p className="text-muted-foreground">Gestão da plataforma ServiçoJá</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Trabalhadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Verificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.verifiedWorkers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pendingVerifications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Total Reservas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.completedBookings}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Verificações Pendentes
              {pendingWorkers.length > 0 && (
                <Badge className="ml-1 bg-warning text-warning-foreground">
                  {pendingWorkers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">Todos os Trabalhadores</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingWorkers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                  <h3 className="font-semibold mb-2">Nenhuma verificação pendente</h3>
                  <p className="text-muted-foreground">
                    Todas as verificações estão em dia!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingWorkers.map((worker) => {
                  const aiResult = worker.verification_documents?.ai_verification_result as unknown as AIVerificationResult | null;
                  const hasAiResult = !!aiResult?.recommendation;
                  
                  return (
                    <Card key={worker.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-start gap-6">
                          {/* Worker Info */}
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-16 w-16">
                              <AvatarImage 
                                src={worker.profiles?.avatar_url || ''} 
                                alt={worker.profiles?.name || ''} 
                              />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                {worker.profiles?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {worker.profiles?.name || 'Nome não disponível'}
                              </h3>
                              <p className="text-muted-foreground">
                                {worker.profiles?.city || 'Cidade não disponível'}
                              </p>
                              <Badge variant="secondary" className="mt-1">
                                {worker.service_type}
                              </Badge>
                            </div>
                          </div>

                          {/* Verification Documents */}
                          {worker.verification_documents && (
                            <div className="flex-1 text-sm">
                              <h4 className="font-medium mb-2">Documentos:</h4>
                              <div className="space-y-1 text-muted-foreground">
                                <p>Nome: {worker.verification_documents.full_name}</p>
                                <p>BI: {worker.verification_documents.bi_number}</p>
                                <p>Data Nasc: {worker.verification_documents.birth_date}</p>
                              </div>
                              
                              {/* AI Result Summary */}
                              {hasAiResult && (
                                <div className={`mt-3 p-3 rounded-lg ${
                                  aiResult.recommendation === 'approve'
                                    ? 'bg-success/10 border border-success/30'
                                    : aiResult.recommendation === 'reject'
                                    ? 'bg-destructive/10 border border-destructive/30'
                                    : 'bg-warning/10 border border-warning/30'
                                }`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Bot className="h-4 w-4" />
                                    <span className="font-medium text-sm">Análise IA</span>
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <p>Confiança: <strong>{(aiResult.confidence_score * 100).toFixed(0)}%</strong></p>
                                    <p>Recomendação: <Badge variant={
                                      aiResult.recommendation === 'approve' ? 'default' :
                                      aiResult.recommendation === 'reject' ? 'destructive' : 'secondary'
                                    } className="text-xs">
                                      {aiResult.recommendation === 'approve' ? 'Aprovar' :
                                       aiResult.recommendation === 'reject' ? 'Rejeitar' : 'Revisão Manual'}
                                    </Badge></p>
                                    <div className="mt-2">
                                      <p className="font-medium mb-1">Razões:</p>
                                      <ul className="list-disc pl-4 space-y-0.5">
                                        {aiResult.reasons?.slice(0, 3).map((reason, i) => (
                                          <li key={i}>{reason}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            {worker.verification_documents && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedWorker(worker);
                                  setShowDocModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Documentos
                              </Button>
                            )}

                            {/* Reanalyze Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReanalyze(worker.id)}
                              disabled={reanalyzing === worker.id}
                            >
                              {reanalyzing === worker.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                              )}
                              Reanalisar com IA
                            </Button>

                            {!hasAiResult && (
                              <Badge variant="secondary" className="justify-center py-2">
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                Sem análise IA
                              </Badge>
                            )}

                            <Button
                              variant="default"
                              className="bg-success hover:bg-success/90"
                              size="sm"
                              onClick={() => handleApprove(worker.id)}
                              disabled={processing === worker.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(worker.id)}
                              disabled={processing === worker.id}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            {allWorkers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Nenhum trabalhador registado</h3>
                  <p className="text-muted-foreground">
                    Ainda não há trabalhadores na plataforma.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allWorkers.map((worker) => (
                  <Card key={worker.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={worker.profiles?.avatar_url || ''} 
                            alt={worker.profiles?.name || ''} 
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {worker.profiles?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {worker.profiles?.name || 'Nome não disponível'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {worker.profiles?.city} • {worker.service_type}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(worker.verification_status)}
                          {worker.verification_documents && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedWorker(worker);
                                setShowDocModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Document Modal */}
        <Dialog open={showDocModal} onOpenChange={setShowDocModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Documentos de Verificação - {selectedWorker?.profiles?.name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedWorker?.verification_documents && (
              <div className="space-y-6">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome Completo</p>
                    <p className="font-medium">{selectedWorker.verification_documents.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Número do BI</p>
                    <p className="font-medium">{selectedWorker.verification_documents.bi_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                    <p className="font-medium">{selectedWorker.verification_documents.birth_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">{selectedWorker.verification_documents.address}</p>
                  </div>
                </div>

                {/* AI Result */}
                {selectedWorker.verification_documents.ai_verification_result && (() => {
                  const aiResult = selectedWorker.verification_documents.ai_verification_result as unknown as AIVerificationResult;
                  return (
                    <div className={`p-4 rounded-lg ${
                      aiResult.recommendation === 'approve'
                        ? 'bg-success/10 border border-success/30'
                        : aiResult.recommendation === 'reject'
                        ? 'bg-destructive/10 border border-destructive/30'
                        : 'bg-warning/10 border border-warning/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        <Bot className="h-5 w-5" />
                        <span className="font-semibold">Análise de Inteligência Artificial</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Nível de Confiança</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${aiResult.confidence_score >= 0.7 ? 'bg-success' : aiResult.confidence_score >= 0.4 ? 'bg-warning' : 'bg-destructive'}`}
                                style={{ width: `${aiResult.confidence_score * 100}%` }}
                              />
                            </div>
                            <span className="font-bold">{(aiResult.confidence_score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Recomendação</p>
                          <Badge variant={
                            aiResult.recommendation === 'approve' ? 'default' :
                            aiResult.recommendation === 'reject' ? 'destructive' : 'secondary'
                          } className="mt-1">
                            {aiResult.recommendation === 'approve' ? '✓ Aprovar' :
                             aiResult.recommendation === 'reject' ? '✗ Rejeitar' : '⚠ Revisão Manual Necessária'}
                          </Badge>
                        </div>
                      </div>
                      {aiResult.checks && (
                        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                          <div className={`p-2 rounded ${aiResult.checks.selfie_legible ? 'bg-success/20' : 'bg-destructive/20'}`}>
                            Selfie: {aiResult.checks.selfie_legible ? '✓' : '✗'}
                          </div>
                          <div className={`p-2 rounded ${aiResult.checks.bi_front_legible ? 'bg-success/20' : 'bg-destructive/20'}`}>
                            BI Frente: {aiResult.checks.bi_front_legible ? '✓' : '✗'}
                          </div>
                          <div className={`p-2 rounded ${aiResult.checks.bi_back_legible ? 'bg-success/20' : 'bg-destructive/20'}`}>
                            BI Verso: {aiResult.checks.bi_back_legible ? '✓' : '✗'}
                          </div>
                        </div>
                      )}
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Razões da Análise:</p>
                        <ul className="space-y-1">
                          {aiResult.reasons?.map((reason, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className={aiResult.recommendation === 'approve' ? 'text-success' : 'text-warning'}>•</span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}

                {/* Document Photos */}
                <div>
                  <h4 className="font-semibold mb-3">Fotos dos Documentos</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    {selectedWorker.verification_documents.selfie_url && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Selfie</p>
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={selectedWorker.verification_documents.selfie_url} 
                            alt="Selfie"
                            className="w-full h-full object-cover"
                          />
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="absolute bottom-2 right-2"
                            onClick={() => window.open(selectedWorker.verification_documents?.selfie_url || '', '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedWorker.verification_documents.bi_front_url && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">BI - Frente</p>
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={selectedWorker.verification_documents.bi_front_url} 
                            alt="BI Frente"
                            className="w-full h-full object-cover"
                          />
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="absolute bottom-2 right-2"
                            onClick={() => window.open(selectedWorker.verification_documents?.bi_front_url || '', '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedWorker.verification_documents.bi_back_url && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">BI - Verso</p>
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={selectedWorker.verification_documents.bi_back_url} 
                            alt="BI Verso"
                            className="w-full h-full object-cover"
                          />
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="absolute bottom-2 right-2"
                            onClick={() => window.open(selectedWorker.verification_documents?.bi_back_url || '', '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReanalyze(selectedWorker.id)}
                    disabled={reanalyzing === selectedWorker.id}
                  >
                    {reanalyzing === selectedWorker.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Reanalisar com IA
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDocModal(false)}
                  >
                    Fechar
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      handleReject(selectedWorker.id);
                      setShowDocModal(false);
                    }}
                    disabled={processing === selectedWorker.id}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button 
                    className="bg-success hover:bg-success/90"
                    onClick={() => {
                      handleApprove(selectedWorker.id);
                      setShowDocModal(false);
                    }}
                    disabled={processing === selectedWorker.id}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
