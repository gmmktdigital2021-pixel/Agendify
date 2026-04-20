import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://agendify-plpd.vercel.app", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://agendify-plpd.vercel.app/nichos/cabeleireiras", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://agendify-plpd.vercel.app/nichos/manicure", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://agendify-plpd.vercel.app/nichos/sobrancelhas", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://agendify-plpd.vercel.app/nichos/cilios", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://agendify-plpd.vercel.app/nichos/maquiadoras", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://agendify-plpd.vercel.app/nichos/barbearias", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://agendify-plpd.vercel.app/nichos/estetica", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://agendify-plpd.vercel.app/nichos/depilacao", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];
}
