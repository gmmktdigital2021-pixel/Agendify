import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type UserRole = "owner" | "professional" | "unknown";

export async function getUserRole(userId: string): Promise<{
  role: UserRole;
  professionalId?: string;
  salonId?: string;
  salonName?: string;
}> {
  // Verifica se é dono de salão
  const { data: salon } = await supabase
    .from("salons")
    .select("id, nome")
    .eq("user_id", userId)
    .single();

  if (salon) {
    return { role: "owner", salonId: salon.id, salonName: salon.nome };
  }

  // Verifica se é profissional convidado
  const { data: professional } = await supabase
    .from("professionals")
    .select("id, salon_id, invite_accepted")
    .eq("user_id", userId)
    .single();

  if (professional) {
    return {
      role: "professional",
      professionalId: professional.id,
      salonId: professional.salon_id,
    };
  }

  return { role: "unknown" };
}
