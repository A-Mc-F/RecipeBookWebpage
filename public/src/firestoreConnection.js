import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB7fE3GsZIxyfE7twzsUnycLCk4tx0xzU4",
    authDomain: "mealplanner-e91be.firebaseapp.com",
    projectId: "mealplanner-e91be",
    storageBucket: "mealplanner-e91be.firebasestorage.app",
    messagingSenderId: "46200749310",
    appId: "1:46200749310:web:9a99f7d4e6d225ccff39af"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);