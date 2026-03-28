import { createError, defineEventHandler } from 'h3';
import { profileRepository } from '../../../db/repositories/profile.repository';

export default defineEventHandler(async () => {
  const profile = await profileRepository.find();

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found.' });
  }

  return profile;
});
