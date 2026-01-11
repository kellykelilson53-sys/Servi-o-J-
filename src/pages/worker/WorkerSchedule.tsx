import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, Save } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ScheduleDay {
  day_of_week: number;
  is_available: boolean;
  start_time: string;
  end_time: string;
}

const DAYS = [
  { day: 0, name: 'Domingo' },
  { day: 1, name: 'Segunda-feira' },
  { day: 2, name: 'Terça-feira' },
  { day: 3, name: 'Quarta-feira' },
  { day: 4, name: 'Quinta-feira' },
  { day: 5, name: 'Sexta-feira' },
  { day: 6, name: 'Sábado' },
];

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

export default function WorkerSchedule() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ScheduleDay[]>(
    DAYS.map(d => ({
      day_of_week: d.day,
      is_available: d.day >= 1 && d.day <= 5,
      start_time: '08:00',
      end_time: '18:00'
    }))
  );
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchSchedule() {
      if (!user) return;
      
      try {
        const { data: workerData } = await supabase
          .from('workers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!workerData) return;
        setWorkerId(workerData.id);

        const { data: scheduleData } = await supabase
          .from('worker_schedule')
          .select('*')
          .eq('worker_id', workerData.id);

        if (scheduleData && scheduleData.length > 0) {
          const scheduleMap = new Map(scheduleData.map(s => [s.day_of_week, s]));
          setSchedule(prev => prev.map(day => {
            const existing = scheduleMap.get(day.day_of_week);
            if (existing) {
              return {
                day_of_week: existing.day_of_week,
                is_available: existing.is_available,
                start_time: existing.start_time,
                end_time: existing.end_time
              };
            }
            return day;
          }));
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSchedule();
  }, [user]);

  const updateDay = (dayOfWeek: number, updates: Partial<ScheduleDay>) => {
    setSchedule(prev => prev.map(day => 
      day.day_of_week === dayOfWeek ? { ...day, ...updates } : day
    ));
  };

  const handleSave = async () => {
    if (!workerId) return;

    setSaving(true);
    try {
      // Delete existing schedule
      await supabase
        .from('worker_schedule')
        .delete()
        .eq('worker_id', workerId);

      // Insert new schedule
      const { error } = await supabase
        .from('worker_schedule')
        .insert(schedule.map(day => ({
          worker_id: workerId,
          day_of_week: day.day_of_week,
          is_available: day.is_available,
          start_time: day.start_time,
          end_time: day.end_time
        })));

      if (error) throw error;

      toast({
        title: 'Agenda guardada!',
        description: 'A sua disponibilidade foi actualizada.',
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível guardar a agenda.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Minha Agenda</h1>
            <p className="text-muted-foreground">Defina os seus dias e horários de disponibilidade</p>
          </div>
          <Button variant="hero" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'A guardar...' : 'Guardar'}
          </Button>
        </div>

        <div className="space-y-4">
          {DAYS.map((day) => {
            const daySchedule = schedule.find(s => s.day_of_week === day.day)!;
            return (
              <Card key={day.day}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <Switch
                        checked={daySchedule.is_available}
                        onCheckedChange={(checked) => updateDay(day.day, { is_available: checked })}
                      />
                      <Label className="font-medium w-32">{day.name}</Label>
                    </div>

                    {daySchedule.is_available && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={daySchedule.start_time}
                          onValueChange={(v) => updateDay(day.day, { start_time: v })}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">até</span>
                        <Select
                          value={daySchedule.end_time}
                          onValueChange={(v) => updateDay(day.day, { end_time: v })}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map(time => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {!daySchedule.is_available && (
                      <span className="text-sm text-muted-foreground">Indisponível</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
