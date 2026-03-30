import { ContactFeature } from './contact-feature';

export interface ContactData {
  title: string;
  description: string;
  features: ContactFeature[];
  formCard: {
    title: string;
    description: string;
  };
}
