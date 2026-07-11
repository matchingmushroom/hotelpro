import { supabase } from '../config/supabase';

let currentUserId = null;
let currentHotelId = null;

export function setActivityContext(userId, hotelId) {
  currentUserId = userId;
  currentHotelId = hotelId;
}

export async function logActivity({ action, entity_type, entity_id, details = {} }) {
  if (!currentHotelId) return;
  try {
    await supabase.from('activity_logs').insert({
      hotel_id: currentHotelId,
      user_id: currentUserId,
      action,
      entity_type,
      entity_id,
      details,
    });
  } catch (err) {
    console.warn('Failed to log activity:', err.message);
  }
}

export async function fetchActivityLog({ limit = 50, entity_type, entity_id } = {}) {
  let query = supabase
    .from('activity_logs')
    .select('*, profiles!activity_logs_user_id_fkey(name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (currentHotelId) query = query.eq('hotel_id', currentHotelId);
  if (entity_type) query = query.eq('entity_type', entity_type);
  if (entity_id) query = query.eq('entity_id', entity_id);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Wrappers for common actions
export function logCreate(entityType, entityId, details = {}) {
  return logActivity({ action: 'create', entity_type: entityType, entity_id: entityId, details });
}

export function logUpdate(entityType, entityId, details = {}) {
  return logActivity({ action: 'update', entity_type: entityType, entity_id: entityId, details });
}

export function logDelete(entityType, entityId, details = {}) {
  return logActivity({ action: 'delete', entity_type: entityType, entity_id: entityId, details });
}

export function logCheckIn(entityId, details = {}) {
  return logActivity({ action: 'check_in', entity_type: 'booking', entity_id: entityId, details });
}

export function logCheckOut(entityId, details = {}) {
  return logActivity({ action: 'check_out', entity_type: 'booking', entity_id: entityId, details });
}

export function logPayment(entityId, details = {}) {
  return logActivity({ action: 'payment', entity_type: 'invoice', entity_id: entityId, details });
}

export function logConvert(entityType, entityId, details = {}) {
  return logActivity({ action: 'convert', entity_type: entityType, entity_id: entityId, details });
}
