"use client";

import { Crown } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanLimitBannerProps {
  type: "agendamentos" | "clientes" | "serviços";
  current: number;
  limit: number;
  plan: string;
}

export function PlanLimitBanner({ type, current, limit, plan }: PlanLimitBannerProps) {
  const router = useRouter();
  const percentage = limit > 0 ? (current / limit) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;

  if (plan === "premium" || limit === -1) return null;

  return (
    <div className={`p-4 rounded-xl border mb-6 ${isAtLimit ? "bg-red-50 border-red-200" : isNearLimit ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-100"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-sm font-medium ${isAtLimit ? "text-red-700" : isNearLimit ? "text-yellow-700" : "text-blue-700"}`}>
          {isAtLimit
            ? `⚠️ Limite de ${type} atingido!`
            : `📊 ${current} de ${limit} ${type} utilizados`}
        </p>
        {isAtLimit && (
          <button
            onClick={() => router.push("/dashboard/planos")}
            className="flex items-center gap-1 text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition"
          >
            <Crown size={12} />
            Fazer upgrade
          </button>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${isAtLimit ? "bg-red-500" : isNearLimit ? "bg-yellow-500" : "bg-blue-500"}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
