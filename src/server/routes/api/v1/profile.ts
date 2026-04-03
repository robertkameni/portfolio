import { createError, defineEventHandler } from 'h3';
import { profileRepository } from '../../../db/repositories/profile.repository';
import { defaultProfile } from '../../../data/default-profile';
import { localizeProfile } from '../../../data/localized-profile';
import { resolveRequestLocale } from '../../../utils/locale';

export default defineEventHandler(async (event) => {
  const locale = resolveRequestLocale(event);

  if (!process.env['DATABASE_URL']) {
    return localizeProfile(defaultProfile, locale);
  }

  const profile = await profileRepository.find();

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found.' });
  }

  return localizeProfile(profile, locale);
});
