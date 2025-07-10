
/**
 * @typedef {Object} MealPlanItem
 * @property {'day'|'meal'|'recipe'|'other'|'misc_group'|'misc'} type
 * @property {string} [name]         // For 'day', 'meal', 'misc_group'
 * @property {string} [text]         // For 'other', 'misc'
 * @property {string} [recipeId]     // For 'recipe'
 * @property {MealPlanItem[]} [items]// For 'day', 'meal', 'misc_group'
 */

/**
 * @typedef {Object} MealPlan
 * @property {string} name
 * @property {'mealPlan'} type
 * @property {MealPlanItem[]} items
 */



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
let mealPlanData = /** @type { MealPlan } */ ({ name: '', type: 'mealPlan', items: [] });
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

export function getRecipeByID(id) {
    return allRecipes.find(recipe => recipe.id === id);
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

export function getItemPath(type, name) {
    //perform a breadth-first search for an item with the given type and name and returns the path as an array of indices
    function bfs(items, path = []) {
        const queue = [{ items, path }];
        while (queue.length > 0) {
            const { items, path } = queue.shift();
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type === type && item.name === name) {
                    return [...path, i];
                }
                if (item.items) {
                    queue.push({ items: item.items, path: [...path, i] });
                }
            }
        }
        return null;
    }
    return bfs(mealPlanData.items);
}
