import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

console.log("Initializing Firebase Admin with projectId:", firebaseConfig.projectId);

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
      // Note: In local development with Firebase Emulators or if running 
      // in GAE/Cloud Run, this often works without explicit credentials 
      // if using the default service account.
    });
    console.log("Firebase Admin initialized successfully");
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
  throw error;
}

export const adminDb = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId)
  : getFirestore();
export const adminAuth = admin.auth();
