import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- TIPAGENS ---

export interface Salon {
  id: string;
  user_id: string;
  nome: string;
  whatsapp?: string;
  horario_inicio: string;
  horario_fim: string;
  dias_ativos: string[];
  mensagem_padrao: string;
  created_at: string;
}

export interface Client {
  id: string;
  salon_id: string;
  nome: string;
  telefone?: string;
  created_at: string;
}

export interface Service {
  id: string;
  salon_id: string;
  nome: string;
  duracao_minutos: number;
  preco: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  salon_id: string;
  client_id: string;
  service_id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  created_at: string;
}

export interface Lead {
  id: string;
  nome: string;
  whatsapp: string;
  created_at: string;
}

// --- HELPERS TIPADOS ---

export const db = {
  salons: supabase.from('salons'),
  clients: supabase.from('clients'),
  services: supabase.from('services'),
  appointments: supabase.from('appointments'),
  leads: supabase.from('leads'),
};

/** Helpers para Salons */
export async function getSalons() {
  const { data, error } = await db.salons.select('*');
  if (error) throw error;
  return data as Salon[];
}
export async function getSalonByUserId(userId: string) {
  const { data, error } = await db.salons.select('*').eq('user_id', userId).single();
  if (error) throw error;
  return data as Salon;
}
export async function upsertSalon(salon: Partial<Salon>) {
  const { data, error } = await db.salons.upsert(salon).select().single();
  if (error) throw error;
  return data as Salon;
}

/** Helpers para Clients */
export async function getClients(salonId: string) {
  const { data, error } = await db.clients.select('*').eq('salon_id', salonId);
  if (error) throw error;
  return data as Client[];
}
export async function createDbClient(client: Partial<Client>) {
  const { data, error } = await db.clients.insert(client).select().single();
  if (error) throw error;
  return data as Client;
}
export async function updateDbClient(id: string, client: Partial<Client>) {
  const { data, error } = await db.clients.update(client).eq('id', id).select().single();
  if (error) throw error;
  return data as Client;
}
export async function deleteDbClient(id: string) {
  const { error } = await db.clients.delete().eq('id', id);
  if (error) throw error;
}

/** Helpers para Services */
export async function getServices(salonId: string) {
  const { data, error } = await db.services.select('*').eq('salon_id', salonId);
  if (error) throw error;
  return data as Service[];
}
export async function createDbService(service: Partial<Service>) {
  const { data, error } = await db.services.insert(service).select().single();
  if (error) throw error;
  return data as Service;
}
export async function updateDbService(id: string, service: Partial<Service>) {
  const { data, error } = await db.services.update(service).eq('id', id).select().single();
  if (error) throw error;
  return data as Service;
}
export async function deleteDbService(id: string) {
  const { error } = await db.services.delete().eq('id', id);
  if (error) throw error;
}

/** Helpers para Appointments */
export async function getAppointments(salonId: string, dateStart?: string, dateEnd?: string) {
  let query = db.appointments.select(`
    *,
    clients (nome, telefone),
    services (nome, preco, duracao_minutos)
  `).eq('salon_id', salonId);
  
  if (dateStart) query = query.gte('data', dateStart);
  if (dateEnd)   query = query.lte('data', dateEnd);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
export async function createDbAppointment(appointment: Partial<Appointment>) {
  const { data, error } = await db.appointments.insert(appointment).select().single();
  if (error) throw error;
  return data as Appointment;
}
export async function updateDbAppointment(id: string, appointment: Partial<Appointment>) {
  const { data, error } = await db.appointments.update(appointment).eq('id', id).select().single();
  if (error) throw error;
  return data as Appointment;
}

/** Helpers para Leads */
export async function createDbLead(lead: { nome: string, whatsapp: string }) {
  const { data, error } = await db.leads.insert(lead).select().single();
  if (error) throw error;
  return data as Lead;
}
