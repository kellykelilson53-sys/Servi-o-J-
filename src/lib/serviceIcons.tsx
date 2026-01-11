import {
  Scissors,
  Car,
  Shirt,
  Zap,
  Wrench,
  Settings,
  Sparkles,
  BookOpen,
  Hammer,
  Paintbrush,
  TreeDeciduous,
  Heart,
} from 'lucide-react';
import { ServiceType } from '@/types';

export const SERVICE_ICONS: Record<ServiceType, React.ComponentType<{ className?: string }>> = {
  barber: Scissors,
  car_wash: Car,
  laundry: Shirt,
  electrician: Zap,
  plumber: Wrench,
  mechanic: Settings,
  cleaning: Sparkles,
  tutor: BookOpen,
  handyman: Hammer,
  painter: Paintbrush,
  gardener: TreeDeciduous,
  beauty: Heart,
};

export function getServiceIcon(serviceType: ServiceType) {
  return SERVICE_ICONS[serviceType] || Hammer;
}
