import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { app, auth } from "./firebaseApp";

// Code that runs on every page (layout, AuthContext) must import from
// ./firebaseApp instead, or Firestore ends up in the entry bundle.
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app, auth };
