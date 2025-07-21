export interface PlatformMessages {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    whatsapp?: string;
    messenger?: string;
    email?: {
      subject?: string;
      body?: string;
    };
  }
  
  export interface PlatformConfig {
    icon: React.ReactNode;
    color: string;
    hoverColor: string;
    bgColor: string;
    label: string;
  }