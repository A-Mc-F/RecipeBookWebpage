import { loadRecipesFromFirestore, saveRecipesToFirestore } from './recipeFirestore.js';


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