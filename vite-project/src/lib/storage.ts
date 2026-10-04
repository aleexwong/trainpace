import { getStorage } from "firebase/storage";
import { app } from "./firebase";

// Kept out of ./firebase so the Storage SDK only loads with the pages that use it.
export const storage = getStorage(app);
