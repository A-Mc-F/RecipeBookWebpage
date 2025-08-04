import { getState, setState } from "../stateMachine.js";
import { getAllRecipes } from "./recipesFirestore.js"
import { addMealplanItem } from "../content/mealplanner/dataHandler.js";
import { recipeCard } from "./recipeRenderer.js";

// --- Render the meal plan recursively ---
export function renderRecipeBook() {
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

renderRecipeBook();