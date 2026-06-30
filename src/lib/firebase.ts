import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, Firestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

let db: Firestore | null = null;
let isFirebaseAvailable = false;

try {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  isFirebaseAvailable = true;
  console.log("Firebase initialized successfully with App ID:", firebaseConfig.appId);
} catch (error) {
  console.error("Firebase failed to initialize, falling back to LocalStorage:", error);
}

export { db, isFirebaseAvailable };
