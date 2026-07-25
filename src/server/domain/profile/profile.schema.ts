import { z } from 'zod';

const SocialLinkSchema = z.object({
  platform: z.string(),
  url: z.string(),
  iconPath: z.string(),
});

const IntroDataSchema = z.object({
  name: z.string(),
  title: z.string(),
  description: z.string(),
  socials: z.array(SocialLinkSchema),
});

const SkillItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const SkillCardSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  iconPath: z.string(),
  description: z.string(),
  items: z.array(SkillItemSchema),
});

const SkillBentoDataSchema = z.object({
  name: z.string(),
  iconPath: z.string(),
  iconFilled: z.boolean().optional(),
});

const AboutHighlightSchema = z.object({
  title: z.string(),
  description: z.string(),
  iconPath: z.string(),
});

const AboutDataSchema = z.object({
  title: z.string(),
  paragraphs: z.array(z.string()),
  highlights: z.array(AboutHighlightSchema),
});

const ContactFeatureSchema = z.object({
  title: z.string(),
  description: z.string(),
  iconPath: z.string(),
});

const ContactDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  features: z.array(ContactFeatureSchema),
  formCard: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const ProfileDataSchema = z.object({
  name: z.string(),
  title: z.string(),
  phone: z.string(),
  email: z.string(),
  intro: IntroDataSchema,
  heroCards: z.array(SkillCardSchema),
  skills: z.array(SkillBentoDataSchema),
  about: AboutDataSchema,
  contact: ContactDataSchema,
});

export type ValidatedProfileData = z.infer<typeof ProfileDataSchema>;

export function validateProfileData(raw: unknown): ValidatedProfileData | null {
  const result = ProfileDataSchema.safeParse(raw);
  if (!result.success) {
    return null;
  }
  return result.data;
}
