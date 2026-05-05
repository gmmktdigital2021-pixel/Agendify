"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { CheckCircle, Loader2, LogIn } from "lucide-react";

function ConviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "need_login" | "error">("loading");
  const [message, setMessage] = useState("");
  const token = searchParams.get("token");
  const salonId = searchParams.get("salon");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    const acceptInvite = async () => {
      if (!token || !salonId) {
        setStatus("error");
        setMessage("Link de convite inválido.");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      // Se não está logado, pede para fazer login
      if (!session) {
        setStatus("need_login");
        return;
      }

      // Verifica se o token é válido
      const { data: professional } = await supabase
        .from("professionals")
        .select("id, name, invite_accepted")
        .eq("invite_token", token)
        .eq("salon_id", salonId)
        .single();

      if (!professional) {
        setStatus("error");
        setMessage("Convite não encontrado ou já foi utilizado.");
        return;
      }

      if (professional.invite_accepted) {
        setStatus("success");
        setMessage("Este convite já foi aceito! Redirecionando...");
        setTimeout(() => router.push("/dashboard"), 2000);
        return;
      }

      // Aceita o convite
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
      setMessage(`Bem-vindo ao Agendify, ${professional.name}! 🎉`);
      setTimeout(() => router.push("/dashboard"), 3000);
    };

    acceptInvite();
  }, [router, supabase, token, salonId]);

  const handleLogin = () => {
    // Salva o token e salon no localStorage para aceitar após login
    if (token && salonId) {
      localStorage.setItem("invite_token", token);
      localStorage.setItem("invite_salon", salonId);
    }
    router.push(`/login?redirect=/convite?token=${token}&salon=${salonId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 max-w-md w-full text-center">

        {status === "loading" && (
          <>
            <Loader2 size={40} className="animate-spin text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Processando convite...</h2>
            <p className="text-gray-500 mt-2">Aguarde um momento.</p>
          </>
        )}

        {status === "need_login" && (
          <>
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn size={28} className="text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Faça login para aceitar</h2>
            <p className="text-gray-500 mb-6">
              Você precisa estar logado para aceitar este convite. Se ainda não tem conta, crie uma gratuitamente.
            </p>
            <button
              onClick={handleLogin}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition"
            >
              Fazer login e aceitar convite
            </button>
            
            <a
              href={`/cadastro?redirect=/convite?token=${token}&salon=${salonId}`}
              className="block mt-3 text-sm text-purple-600 hover:underline"
            >
              Não tem conta? Criar conta grátis
            </a>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Convite aceito! 🎉</h2>
            <p className="text-gray-500">{message}</p>
            <p className="text-gray-400 text-sm mt-2">Redirecionando para o dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-xl font-bold">!</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Erro no convite</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            
            <a
              href="/login"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition"
            >
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
