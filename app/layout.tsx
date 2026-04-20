import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Agendify — Sua agenda no piloto automático",
  description: "Software de agendamento online para profissionais de beleza. Receba marcações 24h, elimine faltas com lembretes automáticos e gerencie seus clientes com facilidade.",
  keywords: "agendamento online, software salão de beleza, agenda cabeleireira, sistema agendamento manicure, agendamento barbearia, agenda online beleza brasil",
  authors: [{ name: "Agendify" }],
  openGraph: {
    title: "Agendify — Sua agenda no piloto automático",
    description: "Software de agendamento online para profissionais de beleza brasileiros.",
    url: "https://agendify-plpd.vercel.app",
    siteName: "Agendify",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agendify — Sua agenda no piloto automático",
    description: "Software de agendamento online para profissionais de beleza brasileiros.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://agendify-plpd.vercel.app",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
