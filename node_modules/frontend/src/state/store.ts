import { fetchBoundaries, fetchFaskes } from "../data/apiClient";
import { BoundaryFeature, FaskesFeature } from "../data/types";

export type ErrorNotification = {
  type: "error" | "warning" | "info";
  message: string;
  dismissible: boolean;
  duration?: number;
};

export type NearestFacility = {
  feature: FaskesFeature;
  distanceKm: number;
};

export type CoverageStats = {
  coveredKm2: number;
  uncoveredKm2: number;
  percentageCovered: number;
};

export type AppState = {
  faskes: FaskesFeature[];
  boundaries: BoundaryFeature[];
  filteredFaskes: FaskesFeature[];
  activeFilter: string;
  searchQuery: string;
  bufferRadius: number;
  bufferActive: boolean;
  analysisPoint: [number, number] | null;
  nearestFacilities: NearestFacility[];
  coverageStats: CoverageStats | null;
  loading: boolean;
  errors: ErrorNotification[];
};

type Subscriber = (state: AppState) => void;

type Store = {
  getState: () => AppState;
  setState: (partial: Partial<AppState>) => void;
  subscribe: (listener: Subscriber) => () => void;
  initializeData: () => Promise<void>;
};

const initialState: AppState = {
  faskes: [],
  boundaries: [],
  filteredFaskes: [],
  activeFilter: "all",
  searchQuery: "",
  bufferRadius: 1000,
  bufferActive: false,
  analysisPoint: null,
  nearestFacilities: [],
  coverageStats: null,
  loading: false,
  errors: [],
};

export function createStore(): Store {
  let state = { ...initialState };
  const listeners = new Set<Subscriber>();

  const getState = () => state;

  const setState = (partial: Partial<AppState>) => {
    state = { ...state, ...partial };
    listeners.forEach((listener) => listener(state));
  };

  const subscribe = (listener: Subscriber) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const initializeData = async () => {
    setState({ loading: true, errors: [] });
    try {
      const [faskesResult, boundaryResult] = await Promise.all([
        fetchFaskes(),
        fetchBoundaries(),
      ]);

      setState({
        faskes: faskesResult.valid,
        boundaries: boundaryResult.valid,
        filteredFaskes: faskesResult.valid,
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data.";
      setState({
        loading: false,
        errors: [
          {
            type: "error",
            message,
            dismissible: false,
          },
        ],
      });
    }
  };

  return {
    getState,
    setState,
    subscribe,
    initializeData,
  };
}
