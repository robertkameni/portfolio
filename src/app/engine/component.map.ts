import { Type } from '@angular/core';

// This map allows the backend to refer to components by string keys
export const componentMap: Record<string, () => Promise<Type<any>>> = {
  // Using dynamic imports for lazy loading
  'HeroDefault': () => import('../pages/components/hero/hero').then(m => m.HeroComponent),
  // Example of a variant that we might create later
  // 'HeroRecruiter': () => import('../pages/components/hero-recruiter/hero-recruiter').then(m => m.HeroRecruiterComponent),

  // Add other swappable components here
};
