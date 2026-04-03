import { defineEventHandler } from 'h3';
import { profileRepository } from '../../../db/repositories/profile.repository';
import { defaultProfile } from '../../../data/default-profile';
import { localizeProfile } from '../../../data/localized-profile';
import { resolveRequestLocale } from '../../../utils/locale';

export default defineEventHandler(async (event) => {
  const locale = resolveRequestLocale(event);

  if (!process.env['DATABASE_URL']) {
    return localizeProfile(defaultProfile, locale);
  }

  try {
    const profile = await profileRepository.find();
    return localizeProfile(profile ?? defaultProfile, locale);
  } catch (error) {
    console.error('[Profile] DB error, falling back to default profile:', error);
    return localizeProfile(defaultProfile, locale);
  }
});
