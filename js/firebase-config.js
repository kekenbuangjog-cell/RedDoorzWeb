// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIvPcV9IODIpVmXTL_9AOft0Q2I-QAPIE",
  authDomain: "reddoorz-intprog.firebaseapp.com",
  projectId: "reddoorz-intprog",
  storageBucket: "reddoorz-intprog.firebasestorage.app",
  messagingSenderId: "1022931772241",
  appId: "1:1022931772241:web:f063fa6c2822187be0e970",
  measurementId: "G-WBT7C1NCTM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
