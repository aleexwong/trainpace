/**
 * Feature Flags Configuration
 * Centralized feature toggles based on environment variables
 */

export const featureFlags = {
  /**
   * Training Plan Builder Feature
   * Enables/disables the training plan builder feature
   */
  trainingPlans: import.meta.env.VITE_TRAINING_PLANS === "true",
} as const;
