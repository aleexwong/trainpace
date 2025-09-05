// src/config/routes.ts

/**
 * Firebase Document ID Migration Mapping
 * 
 * When route data gets updated and creates new document IDs,
 * add the old ID → new ID mapping here to maintain backwards compatibility
 */
export const FIREBASE_ID_MIGRATIONS: Record<string, string> = {
  // Example: When Boston Marathon data is updated
  // '8Cf8rFpXCSSBuHg540wR': 'NewBostonMarathonId2025', // Replace with actual new ID when needed
  
  // Add more migrations as route data gets updated
  // 'oldDocId123': 'newDocId456',
};

/**
 * Get the current (most up-to-date) document ID for a given document ID
 * Handles migrations from old document IDs to new ones
 */
export function getCurrentDocumentId(docId: string): string {
  // Check if this document ID has been migrated to a newer version
  const migratedId = FIREBASE_ID_MIGRATIONS[docId];
  
  if (migratedId) {
    console.log(`📋 Migrating document ID: ${docId} → ${migratedId}`);
    return migratedId;
  }
  
  // No migration needed, return original ID
  return docId;
}

/**
 * Check if a document ID needs migration
 */
export function needsMigration(docId: string): boolean {
  return docId in FIREBASE_ID_MIGRATIONS;
}