import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  DocumentReference 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAGMLXExaLCwMQ4W-k-Csl4mViyZXghgHM",
  authDomain: "sincere-etching-356016.firebaseapp.com",
  databaseURL: "https://sincere-etching-356016-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sincere-etching-356016",
  storageBucket: "sincere-etching-356016.appspot.com",
  messagingSenderId: "1011466224742",
  appId: "1:1011466224742:web:6ce1cf0b3c4c8d25b599a7",
  measurementId: "G-5DBZ4BKW34"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Define user data interface
interface UserData {
  displayName: string | null;
  email: string | null;
  credits: number;
  friends: string[];
  createdAt: any; // FirebaseFirestore.FieldValue
  lastLogin: any; // FirebaseFirestore.FieldValue
  totalQuizzesTaken: number;
  totalCreditsEarned: number;
}

// Initialize user in Firestore after sign in
export const initializeUserInFirestore = async (user: User): Promise<void> => {
  const userRef: DocumentReference = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const userData: UserData = {
      displayName: user.displayName,
      email: user.email,
      credits: 100, // Starting credits
      friends: [],
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      totalQuizzesTaken: 0,
      totalCreditsEarned: 0
    };
    
    await setDoc(userRef, userData);
  } else {
    await updateDoc(userRef, {
      lastLogin: serverTimestamp()
    });
  }
};