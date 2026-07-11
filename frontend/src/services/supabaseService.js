import { supabase } from '../config/supabase';

function applyFilters(query, filters = {}) {
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'object' && value.operator) {
      query = query[value.operator](key, value.value);
    } else {
      query = query.eq(key, value);
    }
  });
  return query;
}

export async function fetchAll(table, { filters, orderBy, orderDir, limit, page } = {}) {
  let query = supabase.from(table).select('*');
  query = applyFilters(query, filters);
  if (orderBy) query = query.order(orderBy, { ascending: orderDir !== 'desc' });
  if (limit) query = query.limit(limit);
  if (page && limit) {
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }
  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

export async function fetchById(table, id) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function insertRecord(table, record) {
  const { data, error } = await supabase.from(table).insert(record).select().single();
  if (error) throw error;
  return data;
}

export async function updateRecord(table, id, updates) {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function removeRecord(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function countRecords(table, filters) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  query = applyFilters(query, filters);
  const { count, error } = await query;
  if (error) throw error;
  return count;
}

export function subscribeToTable(table, filter, callback) {
  const filterStr = filter ? `hotel_id=eq.${filter}` : undefined;
  return supabase
    .channel(`${table}-changes`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table, filter: filterStr },
      callback
    )
    .subscribe();
}

export async function rpcCall(fnName, params = {}) {
  const { data, error } = await supabase.rpc(fnName, params);
  if (error) throw error;
  return data;
}
