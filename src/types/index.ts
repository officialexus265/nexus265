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
  privateNotes?: string; // deployment info, languages, features, credentials location, blueprints notes
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
