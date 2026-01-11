import { useUserPresence } from '@/hooks/useUserPresence';

export function PresenceTracker() {
  useUserPresence();
  return null;
}
