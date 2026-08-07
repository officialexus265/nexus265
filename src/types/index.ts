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

export interface HeroButton {
  label: string;
  href: string;
  style: "primary" | "outline" | "accent";
}

export interface HeroSlide {
  id: string;
  badge: string;
  title: string; // e.g. site name part
  highlight: string; // gradient text part
  description: string;
  image: string;
  buttons: HeroButton[];
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  logo: string;
  heroImage: string; // kept for slide 1 fallback
  favicon: string;
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
  slides: HeroSlide[];
}

export const defaultSlide1 = (): HeroSlide => ({
  id: "1",
  badge: "Portfolio · Marketplace · Command Center",
  title: "nexus265.",
  highlight: "where ideas connect.",
  description:
    "Explore live projects, grab ready-to-launch websites at discounted prices, or hire me to build something exceptional for you.",
  image: "",
  buttons: [
    { label: "Browse Websites", href: "#websites", style: "primary" },
    { label: "View Projects for Sale", href: "/selling", style: "outline" },
    { label: "Hire Me", href: "/contact#hire", style: "accent" },
  ],
});

export const defaultSlide2 = (): HeroSlide => ({
  id: "2",
  badge: "Custom builds",
  title: "Need something",
  highlight: "built for you?",
  description:
    "From landing pages to full SaaS products — design, develop, and ship production-ready experiences.",
  image: "",
  buttons: [
    { label: "Hire Me", href: "/contact#hire", style: "accent" },
    { label: "See Projects", href: "#websites", style: "outline" },
  ],
});

export const defaultSlide3 = (): HeroSlide => ({
  id: "3",
  badge: "Ready to launch",
  title: "Projects",
  highlight: "for sale.",
  description:
    "Production-ready websites and starters at special prices. View demos and talk to negotiate.",
  image: "",
  buttons: [
    { label: "Browse for Sale", href: "/selling", style: "primary" },
    { label: "Contact", href: "/contact", style: "outline" },
  ],
});

export const defaultSettings: SiteSettings = {
  siteName: "nexus265",
  tagline: "where ideas connect.",
  logo: "",
  heroImage: "",
  favicon: "",
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
  slides: [defaultSlide1(), defaultSlide2(), defaultSlide3()],
};
