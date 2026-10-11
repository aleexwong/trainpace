import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { app, auth } from "./firebase-app";

export const db = getFirestore(app);
export const storage = getStorage(app);
export { app, auth };
