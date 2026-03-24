import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCqu4-UjnulvIh0i3CtR5jnsNJGYO3pWW4",
  authDomain: "cleaning-roster-daee7.firebaseapp.com",
  projectId: "cleaning-roster-daee7",
  storageBucket: "cleaning-roster-daee7.firebasestorage.app",
  messagingSenderId: "320536323994",
  appId: "1:320536323994:web:7dbfae20646dc2e210fc23",
  measurementId: "G-CDR2VR4KWZ"
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);
// データベース（Firestore）をいろんな場所で使えるようにエクスポート
export const db = getFirestore(app);
