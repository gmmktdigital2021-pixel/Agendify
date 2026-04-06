import React from "react";

type BadgeStatus = "confirmado" | "pendente" | "cancelado" | "concluido" | "livre";

interface BadgeProps {
  status: BadgeStatus;
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ status, children, className = "" }: BadgeProps) {
  // The mockup uses a specific style for "Pendente" (yellow bg, brown text) 
  // and "Concluido" (gray bg, gray text). So I'll adapt to match it closer.
  
  const finalStyles = {
    confirmado: "bg-status-confirmado text-white",
    pendente: "bg-amber-100 text-amber-800",
    cancelado: "bg-status-cancelado text-white",
    concluido: "bg-slate-200 text-slate-600",
    livre: "bg-slate-100 text-slate-500",
  };

  const label = children || (status.charAt(0).toUpperCase() + status.slice(1));

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${finalStyles[status]} ${className}`}>
      {label}
    </span>
  );
}
