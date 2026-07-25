import type { AppLocale } from '../i18n/app-locale';

export interface SocialLink {
  platform: string;
  url: string;
  iconPath: string;
}

export interface IntroData {
  name: string;
  title: string;
  description: string;
  socials: SocialLink[];
}

export interface SkillItem {
  title: string;
  description: string;
}

export interface SkillCard {
  title: string;
  subtitle: string;
  iconPath: string;
  description: string;
  items: SkillItem[];
}

export interface SkillBentoData {
  name: string;
  iconPath: string;
  /** When true, render as a filled brand mark instead of a stroke icon. */
  iconFilled?: boolean;
}

export interface AboutHighlight {
  title: string;
  description: string;
  iconPath: string;
}

export interface AboutData {
  title: string;
  paragraphs: string[];
  highlights: AboutHighlight[];
}

export interface ContactFeature {
  title: string;
  description: string;
  iconPath: string;
}

export interface ContactData {
  title: string;
  description: string;
  features: ContactFeature[];
  formCard: {
    title: string;
    description: string;
  };
}

export interface ProfileData {
  name: string;
  title: string;
  phone: string;
  email: string;
  intro: IntroData;
  heroCards: SkillCard[];
  skills: SkillBentoData[];
  about: AboutData;
  contact: ContactData;
}

export interface LocalizedProfileData extends ProfileData {
  locale: AppLocale;
}
