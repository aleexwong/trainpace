// // src/utils/routeMigration.ts
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   updateDoc,
//   doc,
// } from "firebase/firestore";
// import { db } from "../lib/firebase";
// import { migrateSlugToRouteKey } from "../config/routes";

// interface BookmarkRecord {
//   id: string;
//   userId: string;
//   type: string;
//   routeSlug?: string;
//   routeKey?: string;
//   schemaVersion?: number;
// }

// /**
//  * Migrate existing bookmarks from routeSlug to routeKey format
//  * This is a one-time migration utility
//  */
// export async function migrateBookmarksToRouteKeys(
//   dryRun: boolean = true
// ): Promise<void> {
//   console.log(`Starting bookmark migration ${dryRun ? "(DRY RUN)" : "(LIVE)"}`);

//   try {
//     // Find all bookmarks that need migration
//     const bookmarksQuery = query(
//       collection(db, "user_bookmarks"),
//       where("type", "==", "preview_route")
//     );

//     const snapshot = await getDocs(bookmarksQuery);
//     const bookmarksToMigrate: BookmarkRecord[] = [];

//     snapshot.forEach((docSnapshot) => {
//       const data = docSnapshot.data();
//       const bookmark: BookmarkRecord = {
//         id: docSnapshot.id,
//         userId: data.userId,
//         type: data.type,
//         routeSlug: data.routeSlug,
//         routeKey: data.routeKey,
//         schemaVersion: data.schemaVersion || 1,
//       };

//       // Only migrate if:
//       // 1. Has routeSlug but no routeKey, OR
//       // 2. Schema version is less than 2
//       if (
//         (!bookmark.routeKey && bookmark.routeSlug) ||
//         (bookmark.schemaVersion && bookmark.schemaVersion < 2)
//       ) {
//         bookmarksToMigrate.push(bookmark);
//       }
//     });

//     console.log(`Found ${bookmarksToMigrate.length} bookmarks to migrate`);

//     if (bookmarksToMigrate.length === 0) {
//       console.log("No bookmarks need migration");
//       return;
//     }

//     // Process each bookmark
//     let successCount = 0;
//     let errorCount = 0;

//     for (const bookmark of bookmarksToMigrate) {
//       try {
//         const routeKey =
//           bookmark.routeKey || migrateSlugToRouteKey(bookmark.routeSlug || "");

//         if (!routeKey) {
//           console.warn(
//             `Could not migrate bookmark ${bookmark.id}: no valid route key found for slug "${bookmark.routeSlug}"`
//           );
//           errorCount++;
//           continue;
//         }

//         const updateData = {
//           routeKey,
//           schemaVersion: 2,
//           migratedAt: new Date(),
//         };

//         console.log(
//           `${dryRun ? "[DRY RUN] " : ""}Migrating bookmark ${bookmark.id}:`
//         );
//         console.log(
//           `  routeSlug: "${bookmark.routeSlug}" → routeKey: "${routeKey}"`
//         );
//         console.log(`  schemaVersion: ${bookmark.schemaVersion} → 2`);

//         if (!dryRun) {
//           const docRef = doc(db, "user_bookmarks", bookmark.id);
//           await updateDoc(docRef, updateData);
//         }

//         successCount++;
//       } catch (error) {
//         console.error(`Failed to migrate bookmark ${bookmark.id}:`, error);
//         errorCount++;
//       }
//     }

//     console.log(
//       `Migration completed: ${successCount} successful, ${errorCount} errors`
//     );
//   } catch (error) {
//     console.error("Migration failed:", error);
//     throw error;
//   }
// }

// /**
//  * Check migration status - how many bookmarks still need migration
//  */
// export async function checkMigrationStatus(): Promise<{
//   total: number;
//   migrated: number;
//   needsMigration: number;
// }> {
//   try {
//     const bookmarksQuery = query(
//       collection(db, "user_bookmarks"),
//       where("type", "==", "preview_route")
//     );

//     const snapshot = await getDocs(bookmarksQuery);
//     let total = 0;
//     let migrated = 0;
//     let needsMigration = 0;

//     snapshot.forEach((doc) => {
//       const data = doc.data();
//       total++;

//       if (data.routeKey && (data.schemaVersion || 1) >= 2) {
//         migrated++;
//       } else {
//         needsMigration++;
//       }
//     });

//     return { total, migrated, needsMigration };
//   } catch (error) {
//     console.error("Failed to check migration status:", error);
//     throw error;
//   }
// }

// /**
//  * Development utility to run migration from console
//  */
// if (typeof window !== "undefined") {
//   (window as any).routeMigration = {
//     migrate: migrateBookmarksToRouteKeys,
//     checkStatus: checkMigrationStatus,

//     // Helper to run dry run
//     dryRun: () => migrateBookmarksToRouteKeys(true),

//     // Helper to run live migration
//     runLive: () => migrateBookmarksToRouteKeys(false),
//   };
// }

// export default {
//   migrateBookmarksToRouteKeys,
//   checkMigrationStatus,
// };
