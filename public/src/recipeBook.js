import { getState, setChangeListener } from "./stateMachine.js";
import { getAllRecipes } from "./recipesFirestore.js"
import { recipeCard } from "./recipeRenderer.js";

// --- Render the meal plan recursively ---
export function renderRecipeBook() {
    if (getState('stage') !== 'Book') {
        return
    }
    console.log('rendering Recipe book')
    const html_object = document.getElementById('recipe-list');
    html_object.innerHTML = '';
    const recipes = getAllRecipes();

    recipes.sort((a, b) => {
        const recA = a.name || "";
        const recB = b.name || "";
        return recA.localeCompare(recB);
    });

    recipes.forEach((recipe) => {
        html_object.appendChild(recipeCard(recipe))
    })
};

renderRecipeBook()

setChangeListener('stage', renderRecipeBook)