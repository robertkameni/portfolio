import { createError, defineEventHandler } from 'h3';
import { profileRepository } from '../../../db/repositories/profile.repository';
import { defaultProfile } from '../../../data/default-profile';

export default defineEventHandler(async () => {
  if (!process.env['DATABASE_URL']) {
    return defaultProfile;
  }

  const profile = await profileRepository.find();

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found.' });
  }

  return profile;
});
