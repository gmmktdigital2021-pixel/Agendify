import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agendify para Cabeleireiras — Agenda automática para salões",
  description: "Software de agendamento para cabeleireiras e salões de beleza. Receba marcações online 24h e elimine o caos do WhatsApp.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
