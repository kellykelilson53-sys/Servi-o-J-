import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ServiceType = Database['public']['Enums']['service_type'];
type VerificationStatus = Database['public']['Enums']['verification_status'];

interface Profile {
  id: string;
  name: string;
  phone: string;
  city: string;
  user_type: string;
  avatar_url: string | null;
}

interface WorkerWithProfile {
  id: string;
  user_id: string;
  service_type: ServiceType;
  description: string | null;
  base_price: number;
  price_per_km: number;
  is_available: boolean;
  offers_home_service: boolean;
  verification_status: VerificationStatus;
  rating: number;
  review_count: number;
  completed_jobs: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  profiles: Profile | null;
}

export function useWorkers(city?: string, serviceType?: string, excludeUserId?: string) {
  const [workers, setWorkers] = useState<WorkerWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorkers() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch workers - using anon key which works without auth
        const { data: workersData, error: workersError } = await supabase
          .from('workers')
          .select('*')
          .eq('verification_status', 'verified');

        if (workersError) throw workersError;

        if (!workersData || workersData.length === 0) {
          setWorkers([]);
          return;
        }

        // Get user IDs
        const userIds = workersData.map(w => w.user_id);
        
        // Fetch profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Create a map of profiles by user_id
        const profilesMap = new Map<string, Profile>();
        profilesData?.forEach(p => {
          profilesMap.set(p.id, p as Profile);
        });

        // Combine workers with profiles
        let combined: WorkerWithProfile[] = workersData.map(w => ({
          ...w,
          profiles: profilesMap.get(w.user_id) || null
        }));
        
        // Filter by city if provided AND city is not empty
        if (city && city.trim() !== '') {
          combined = combined.filter(w => w.profiles?.city === city);
        }

        // Filter by service type if provided
        if (serviceType) {
          combined = combined.filter(w => w.service_type === serviceType);
        }

        // Exclude current user's worker profile
        if (excludeUserId) {
          combined = combined.filter(w => w.user_id !== excludeUserId);
        }

        setWorkers(combined);
      } catch (err) {
        console.error('Error fetching workers:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch workers');
      } finally {
        setLoading(false);
      }
    }

    fetchWorkers();
  }, [city, serviceType, excludeUserId]);

  return { workers, loading, error };
}

export function useWorkerById(workerId: string) {
  const [worker, setWorker] = useState<WorkerWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorker() {
      if (!workerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch worker - using anon key which works without auth
        const { data: workerData, error: workerError } = await supabase
          .from('workers')
          .select('*')
          .eq('id', workerId)
          .maybeSingle();

        if (workerError) throw workerError;

        if (!workerData) {
          setWorker(null);
          return;
        }

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', workerData.user_id)
          .maybeSingle();

        if (profileError) throw profileError;

        setWorker({
          ...workerData,
          profiles: profileData as Profile | null
        });
      } catch (err) {
        console.error('Error fetching worker:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch worker');
      } finally {
        setLoading(false);
      }
    }

    fetchWorker();
  }, [workerId]);

  return { worker, loading, error };
}

// Hook to get worker by user_id
export function useWorkerByUserId(userId: string | undefined) {
  const [worker, setWorker] = useState<WorkerWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorker() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch worker by user_id
        const { data: workerData, error: workerError } = await supabase
          .from('workers')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (workerError) throw workerError;

        if (!workerData) {
          setWorker(null);
          return;
        }

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) throw profileError;

        setWorker({
          ...workerData,
          profiles: profileData as Profile | null
        });
      } catch (err) {
        console.error('Error fetching worker:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch worker');
      } finally {
        setLoading(false);
      }
    }

    fetchWorker();
  }, [userId]);

  return { worker, loading, error };
}
