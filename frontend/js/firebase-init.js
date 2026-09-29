import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updatePassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAsYFhvV77DTNFxlGzdGLfesjnUZNwvRl0",
    authDomain: "shmagh-77695.firebaseapp.com",
    projectId: "shmagh-77695",
    storageBucket: "shmagh-77695.firebasestorage.app",
    messagingSenderId: "642855898909",
    appId: "1:642855898909:web:72568c74a37846e3c05bf4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export { 
    collection, addDoc, getDocs, query, where, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updatePassword, updateProfile 
};
