import { getFirestore } from "firebase/firestore";
import { app } from "./firebase";

// Kept out of ./firebase so the Firestore SDK only loads with the pages that use it.
export const db = getFirestore(app);
