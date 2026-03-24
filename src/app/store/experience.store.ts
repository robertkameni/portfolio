import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

export type UiDirective = {
  component: string;
  variant?: string;
  props?: Record<string, any>;
};

export type ExperienceState = Record<string, UiDirective>;

type ExperienceStoreState = {
  directives: ExperienceState;
};

const initialState: ExperienceStoreState = {
  directives: {},
};

export const ExperienceStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setDirectives(directives: ExperienceState) {
      patchState(store, { directives });
    },
    updateDirectives(directives: ExperienceState) {
      patchState(store, (state) => ({
        directives: { ...state.directives, ...directives },
      }));
    },
  }))
);
