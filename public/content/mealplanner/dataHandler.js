// --- Meal plan change listener ---
let onMealPlanChange = null;
export function setMealPlanChangeListener(cb) { onMealPlanChange = cb; }
function notifyChange() { if (onMealPlanChange) onMealPlanChange(mealPlanData); }
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

// --- Firebase config ---
const firebaseConfig = {
    apiKey: "AIzaSyB7fE3GsZIxyfE7twzsUnycLCk4tx0xzU4",
    authDomain: "mealplanner-e91be.firebaseapp.com",
    projectId: "mealplanner-e91be",
    storageBucket: "mealplanner-e91be.appspot.com",
    messagingSenderId: "46200749310",
    appId: "1:46200749310:web:9a99f7d4e6d225ccff39af"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


let allRecipes = [];
let mealPlanData = [];
let mealplanName = null;

// --- Fetch all recipes from Firestore ---
async function fetchAllRecipes() {
    const recipesCol = collection(db, 'recipes');
    const recipesSnapshot = await getDocs(recipesCol);
    allRecipes = recipesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
await fetchAllRecipes();

export function getAllRecipes() {
    return allRecipes;
}

export function getMealplanName() {
    return mealplanName;
}

export function setMealplanName(name) {
    mealplanName = name;
    loadMealPlanFromFirestore();
}

export function getMealplanData() {
    return mealPlanData;
}

async function saveMealPlanToFirestore() {
    if (!mealplanName) return;
    await setDoc(doc(db, 'mealPlans', mealplanName), {
        mealPlan: mealPlanData,
        timestamp: new Date()
    });
}

async function loadMealPlanFromFirestore() {
    if (!mealplanName) return;
    const mealPlanDoc = await getDoc(doc(db, 'mealPlans', mealplanName));
    if (mealPlanDoc.exists()) {
        mealPlanData = mealPlanDoc.data().mealPlan;
    } else {
        mealPlanData = { name: mealplanName, type: 'mealPlan', items: [] }; // Initialize with empty structure
    }
    notifyChange();
}

// --- Centralized mutation helpers --- 
export function addMealPlanItem(parentPath, item) {
    let arr = mealPlanData.items;
    for (let i = 0; i < parentPath.length; i++) {
        arr = arr[parentPath[i]].items;
    }
    arr.push(item);
    saveMealPlanToFirestore();
    notifyChange();
}

export function removeMealPlanItem(parentPath, idx) {
    let arr = mealPlanData.items;
    for (let i = 0; i < parentPath.length; i++) {
        arr = arr[parentPath[i]].items;
    }
    arr.splice(idx, 1);
    saveMealPlanToFirestore();
    notifyChange();
}

export function updateMealPlanItem(parentPath, idx, newData) {
    let arr = mealPlanData.items;
    for (let i = 0; i < parentPath.length; i++) {
        arr = arr[parentPath[i]].items;
    }
    arr[idx] = { ...arr[idx], ...newData };
}
