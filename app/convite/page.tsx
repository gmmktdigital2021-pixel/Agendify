"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { CheckCircle, Loader2 } from "lucide-react";

function ConviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    const acceptInvite = async () => {
      const token = searchParams.get("token");
      const salonId = searchParams.get("salon");

      if (!token || !salonId) {
        setStatus("error");
        setMessage("Link de convite inválido.");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setStatus("error");
        setMessage("Faça login para aceitar o convite.");
        return;
      }

      // Atualiza o profissional com o user_id
      const { error } = await supabase
        .from("professionals")
        .update({
          user_id: session.user.id,
          invite_accepted: true,
          updated_at: new Date().toISOString(),
        })
        .eq("invite_token", token)
        .eq("salon_id", salonId);

      if (error) {
        setStatus("error");
        setMessage("Erro ao aceitar convite. Tente novamente.");
        return;
      }

      setStatus("success");
      setMessage("Convite aceito! Redirecionando para o dashboard...");
      setTimeout(() => router.push("/dashboard"), 3000);
    };

    acceptInvite();
  }, [router, supabase, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 size={40} className="animate-spin text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Processando convite...</h2>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Bem-vindo ao Agendify!</h2>
            <p className="text-gray-500">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-xl">!</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Erro no convite</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <a href="/login" className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition">
              Ir para o login
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-purple-600" />
      </div>
    }>
      <ConviteContent />
    </Suspense>
  );
}
