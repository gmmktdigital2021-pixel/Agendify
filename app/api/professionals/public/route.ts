import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const salonId = searchParams.get("salonId");

    if (!salonId) {
      return NextResponse.json({ error: "salonId obrigatório" }, { status: 400 });
    }

    const { data: professionals } = await supabase
      .from("professionals")
      .select("id, name, specialty, avatar_url")
      .eq("salon_id", salonId)
      .eq("active", true)
      .eq("invite_accepted", true)
      .order("name");

    return NextResponse.json({ professionals: professionals || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
