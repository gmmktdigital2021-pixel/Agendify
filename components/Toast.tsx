"use client";
import React, { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

export function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-white p-4 rounded-xl shadow-lg border border-slate-100 animate-in slide-in-from-bottom-5 fade-in duration-300">
      {type === "success" ? (
        <CheckCircle2 className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500" />
      )}
      <span className="text-sm font-medium text-slate-800">{message}</span>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
