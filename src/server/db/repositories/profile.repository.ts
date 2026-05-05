import { prisma } from '../client';
import type { ProfileData } from '../../../app/shared/types/profile-data';
import { validateProfileData } from '../../domain/profile/profile.schema';

// Serializes typed objects to plain JSON for Prisma write operations.
// Only needed on the write path — Prisma already returns parsed objects on reads.
const toJson = (v: unknown) => JSON.parse(JSON.stringify(v));

export const profileRepository = {
  async find(): Promise<ProfileData | null> {
    const row = await prisma.profile.findFirst({
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    if (!row) return null;

    const { id: _id, updatedAt: _updatedAt, ...profile } = row;
    const validated = validateProfileData(profile);
    if (!validated) {
      console.error('[ProfileRepository] DB row failed schema validation — falling back to default');
      return null;
    }
    return validated;
  },

  async upsert(data: ProfileData): Promise<void> {
    const payload = {
      name: data.name,
      title: data.title,
      phone: data.phone,
      email: data.email,
      intro: toJson(data.intro),
      heroCards: toJson(data.heroCards),
      skills: toJson(data.skills),
      about: toJson(data.about),
      contact: toJson(data.contact),
    };

    const existing = await prisma.profile.findFirst({
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    if (existing) {
      await prisma.profile.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.profile.create({ data: payload });
    }
  },
};
