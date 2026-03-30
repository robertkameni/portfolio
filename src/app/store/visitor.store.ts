import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import type { VisitorProfileAnalysis } from '../shared/types/visitor.types';

// Define the state shape
type VisitorState = {
  profile: VisitorProfileAnalysis | null;
  isLoading: boolean;
};

const initialState: VisitorState = {
  profile: null,
  isLoading: false,
};

export const VisitorStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setProfile(profile: VisitorProfileAnalysis | null) {
      patchState(store, { profile });
    },
    setLoading(isLoading: boolean) {
      patchState(store, { isLoading });
    },
  })),
);
