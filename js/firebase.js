// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Firebase config (mobbyfashion)
const firebaseConfig = {
  apiKey: "AIzaSyC9p0CGc65dim9DwxNN6Khvai3ZjV4p5FU",
  authDomain: "mobbyfashion.firebaseapp.com",
  projectId: "mobbyfashion",
  storageBucket: "mobbyfashion.firebasestorage.app",
  messagingSenderId: "459297026910",
  appId: "1:459297026910:web:4c4ad521961ea52c0dd5cf",
  measurementId: "G-7LEBQ0SCHZ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}
