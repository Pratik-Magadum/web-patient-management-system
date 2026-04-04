import { createContext, useContext } from 'react';
import { FEATURE_KEYS } from '../services/api';

// Default: all features enabled
const defaultFlags = Object.fromEntries(
  Object.values(FEATURE_KEYS).map((key) => [key, true])
);

const FeatureContext = createContext(defaultFlags);

export function FeatureProvider({ features, children }) {
  // Merge with defaults so any missing key defaults to true
  const merged = { ...defaultFlags, ...features };
  return (
    <FeatureContext.Provider value={merged}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatures() {
  return useContext(FeatureContext);
}

export function useFeature(key) {
  const features = useContext(FeatureContext);
  return features[key] !== false;
}
