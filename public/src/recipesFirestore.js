import { database } from './firestoreConnection.js';
import { collection, getDocs, doc, addDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

let allRecipes = {};

// --- Fetch all recipes from Firestore ---
async function fetchAllRecipes() {
    const recipesCol = collection(database, 'recipes');
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

export function addRecipe(recipe) {
    const recipesCol = collection(database, 'recipes');
    return addDoc(recipesCol, recipe);
}

export function updateRecipe(id, updatedData) {
    const recipeDoc = doc(database, 'recipes', id);
    return setDoc(recipeDoc, updatedData, { merge: true });
}

export function deleteRecipe(id) {
    const recipeDoc = doc(database, 'recipes', id);
    return deleteDoc(recipeDoc);
}
