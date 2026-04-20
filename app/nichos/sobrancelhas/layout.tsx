import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agendify para Designer de Sobrancelhas — Agenda automática",
  description: "Software de agendamento online para profissionais de beleza brasileiros.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
