export type UserRole = 'client' | 'worker' | 'admin';

export type VerificationStatus = 'not_verified' | 'pending' | 'verified' | 'rejected';

export type ServiceType = 
  | 'barber'
  | 'car_wash'
  | 'laundry'
  | 'electrician'
  | 'plumber'
  | 'mechanic'
  | 'cleaning'
  | 'tutor'
  | 'handyman'
  | 'painter'
  | 'gardener'
  | 'beauty';

export type City = 
  | 'Bengo'
  | 'Benguela'
  | 'Bié'
  | 'Cabinda'
  | 'Cuando Cubango'
  | 'Cuanza Norte'
  | 'Cuanza Sul'
  | 'Cunene'
  | 'Huambo'
  | 'Huíla'
  | 'Luanda'
  | 'Lunda Norte'
  | 'Lunda Sul'
  | 'Malanje'
  | 'Moxico'
  | 'Namibe'
  | 'Uíge'
  | 'Zaire';

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  phone: string;
  city: City;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Worker extends User {
  role: 'worker';
  serviceType: ServiceType;
  description: string;
  basePrice: number;
  pricePerKm: number;
  isAvailable: boolean;
  offersHomeService: boolean;
  verificationStatus: VerificationStatus;
  verificationDocuments?: VerificationDocuments;
  portfolio: PortfolioItem[];
  schedule: ScheduleSlot[];
  rating: number;
  reviewCount: number;
  completedJobs: number;
  earnings: EarningsData;
}

export interface VerificationDocuments {
  fullName: string;
  biNumber: string;
  birthDate: string;
  address: string;
  selfieUrl?: string;
  biFrontUrl?: string;
  biBackUrl?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  description?: string;
  likes: number;
  createdAt: Date;
}

export interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface EarningsData {
  today: number;
  weekly: number;
  monthly: number;
  total: number;
}

export interface Booking {
  id: string;
  clientId: string;
  workerId: string;
  serviceType: ServiceType;
  status: BookingStatus;
  date: Date;
  time: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  distance: number;
  basePrice: number;
  distancePrice: number;
  totalPrice: number;
  notes?: string;
  clientRating?: number;
  workerRating?: number;
  createdAt: Date;
}

export interface Review {
  id: string;
  bookingId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  onTime: boolean;
  satisfactory: boolean;
  comment?: string;
  createdAt: Date;
}

export interface ServiceCategory {
  id: ServiceType;
  name: string;
  description: string;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'barber', name: 'Barbeiro', description: 'Cortes, barba e cuidados masculinos' },
  { id: 'car_wash', name: 'Lavagem de Carro', description: 'Lavagem completa ao domicílio' },
  { id: 'laundry', name: 'Lavadeira', description: 'Lavagem e engomadoria de roupa' },
  { id: 'electrician', name: 'Electricista', description: 'Instalações e reparações eléctricas' },
  { id: 'plumber', name: 'Canalizador', description: 'Reparações de canalização' },
  { id: 'mechanic', name: 'Mecânico', description: 'Reparações de automóveis' },
  { id: 'cleaning', name: 'Limpeza', description: 'Limpeza doméstica profissional' },
  { id: 'tutor', name: 'Explicador', description: 'Aulas particulares e explicações' },
  { id: 'handyman', name: 'Faz-Tudo', description: 'Pequenas reparações domésticas' },
  { id: 'painter', name: 'Pintor', description: 'Pintura de interiores e exteriores' },
  { id: 'gardener', name: 'Jardineiro', description: 'Manutenção de jardins' },
  { id: 'beauty', name: 'Beleza', description: 'Cabeleireiro, manicure e estética' },
];

export const CITIES: City[] = [
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cuando Cubango',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cunene',
  'Huambo',
  'Huíla',
  'Luanda',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Namibe',
  'Uíge',
  'Zaire',
];
