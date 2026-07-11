export const HOTEL_NAME = 'Otel.Pro';
export const TAGLINE = 'Run Hotel Like a Pro';

export const ROLES = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  HOUSEKEEPING: 'housekeeping',
  HOUSEKEEPING_MGR: 'housekeeping_manager',
  FOOD_STAFF: 'food_staff',
};

export const ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  CLEANING: 'cleaning',
  MAINTENANCE: 'maintenance',
  OUT_OF_ORDER: 'out_of_order',
};

export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
};

export const BOOKING_TYPE = {
  REGULAR: 'regular',
  GROUP: 'group',
  WALK_IN: 'walk_in',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const CLEANING_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const CLEANING_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const QUOTE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CONVERTED: 'converted',
};

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  REFUNDED: 'refunded',
};

export const ROOM_TYPES = [
  'single', 'double', 'twin', 'suite', 'deluxe', 'penthouse'
];

export const FOOD_CATEGORIES = [
  'veg', 'non_veg', 'beverages', 'desserts', 'snacks'
];

export const STATUS_COLORS = {
  available: '#22c55e',
  occupied: '#ef4444',
  cleaning: '#f59e0b',
  maintenance: '#6b7280',
  out_of_order: '#111827',
  confirmed: '#3b82f6',
  checked_in: '#22c55e',
  checked_out: '#6b7280',
  cancelled: '#ef4444',
  pending: '#f59e0b',
  preparing: '#3b82f6',
  delivered: '#22c55e',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  draft: '#6b7280',
  sent: '#3b82f6',
  accepted: '#22c55e',
  rejected: '#ef4444',
  expired: '#f59e0b',
  converted: '#8b5cf6',
  paid: '#22c55e',
  partial: '#f59e0b',
  overdue: '#ef4444',
  refunded: '#8b5cf6',
};
