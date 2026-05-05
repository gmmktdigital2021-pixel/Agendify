import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from "@/lib/get-user-role";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }
    const role = await getUserRole(userId);
    return NextResponse.json(role);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
