import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, TrendingUp, Calendar, DollarSign,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];

interface EarningsSummary {
  total: number;
  thisMonth: number;
  lastMonth: number;
  completedJobs: number;
}

export default function WorkerEarnings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    completedJobs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchEarnings() {
      if (!user) return;
      
      try {
        const { data: workerData } = await supabase
          .from('workers')
          .select('id, total_earnings')
          .eq('user_id', user.id)
          .single();

        if (!workerData) return;

        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .eq('worker_id', workerData.id)
          .eq('status', 'completed')
          .order('booking_date', { ascending: false });

        if (bookingsData) {
          setBookings(bookingsData);

          const now = new Date();
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

          const thisMonthEarnings = bookingsData
            .filter(b => new Date(b.booking_date) >= thisMonthStart)
            .reduce((sum, b) => sum + Number(b.total_price), 0);

          const lastMonthEarnings = bookingsData
            .filter(b => {
              const date = new Date(b.booking_date);
              return date >= lastMonthStart && date <= lastMonthEnd;
            })
            .reduce((sum, b) => sum + Number(b.total_price), 0);

          setSummary({
            total: Number(workerData.total_earnings),
            thisMonth: thisMonthEarnings,
            lastMonth: lastMonthEarnings,
            completedJobs: bookingsData.length
          });
        }
      } catch (error) {
        console.error('Error fetching earnings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEarnings();
  }, [user]);

  const monthChange = summary.lastMonth > 0 
    ? ((summary.thisMonth - summary.lastMonth) / summary.lastMonth) * 100 
    : 0;

  if (authLoading || loading) {
    return (
      <Layout showFooter={false}>
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">A carregar...</div>
        </div>
      </Layout>
    );
  }

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
        <h1 className="text-2xl font-bold mb-6">Meus Ganhos</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">
                Ganhos Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {summary.total.toLocaleString('pt-AO')} Kz
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">
                Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.thisMonth.toLocaleString('pt-AO')} Kz
              </div>
              {monthChange !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${monthChange > 0 ? 'text-success' : 'text-destructive'}`}>
                  {monthChange > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(monthChange).toFixed(0)}% vs mês anterior
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">
                Mês Anterior
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.lastMonth.toLocaleString('pt-AO')} Kz
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">
                Serviços Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.completedJobs}</div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Histórico de Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Sem transações</h3>
                <p className="text-sm text-muted-foreground">
                  Os seus ganhos aparecerão aqui quando concluir serviços
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-success/10">
                        <DollarSign className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">Serviço Concluído</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(booking.booking_date).toLocaleDateString('pt-AO')}
                        </div>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-success">
                      +{Number(booking.total_price).toLocaleString('pt-AO')} Kz
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
