import firebase from 'firebase/compat/app';
import db from './firestoreConnection.js';
import { collection, getDocs, doc, addDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

// --- Fetch all recipes from Firestore ---
export async function getRecipes() {
    const recipesCol = firebase.firestore().collection('recipes');
    let allRecipes = recipesCol.que
    const recipesSnapshot = await getDocs(recipesCol);
    allRecipes = recipesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return allRecipes;
}

export function addRecipe(recipe) {
    const recipesCol = collection(db, 'recipes');
    return addDoc(recipesCol, recipe);
}

export function updateRecipe(id, updatedData) {
    const recipeDoc = doc(db, 'recipes', id);
    return setDoc(recipeDoc, updatedData, { merge: true });
}

export function deleteRecipe(id) {
    const recipeDoc = doc(db, 'recipes', id);
    return deleteDoc(recipeDoc);
}
