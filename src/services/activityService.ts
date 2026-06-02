import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export enum ActivityType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  UPLOAD = 'UPLOAD',
}

export interface ActivityLog {
  id?: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  type: ActivityType;
  collection: string;
  timestamp: any;
}

export async function logActivity(
  user: { uid: string; displayName: string },
  action: string,
  details: string,
  type: ActivityType,
  collectionName: string
) {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      userId: user.uid,
      userName: user.displayName,
      action,
      details,
      type,
      collection: collectionName,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
