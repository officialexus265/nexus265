export interface Website {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  thumbnail: string;
  liveUrl: string;
  demoUrl?: string;
  isForSale: boolean;
  oldPrice?: number;
  newPrice?: number;
  tags?: string[];
  privateNotes?: string;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  logo: string;
  heroImage: string;
  email: string;
  phone: string;
  whatsapp: string;
  social: {
    facebook: string;
    x: string;
    linkedin: string;
    gmail: string;
    tiktok: string;
  };
}

export const defaultSettings: SiteSettings = {
  siteName: "nexus265",
  tagline: "where ideas connect.",
  logo: "",
  heroImage: "",
  email: "officialnexus265@gmail.com",
  phone: "+265999939040",
  whatsapp: "265999939040",
  social: {
    facebook: "",
    x: "",
    linkedin: "",
    gmail: "mailto:officialnexus265@gmail.com",
    tiktok: "",
  },
};
