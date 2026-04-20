import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agendify para Lash Designers — Controle de manutenções automático",
  description: "Software de agendamento online para profissionais de beleza brasileiros.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
