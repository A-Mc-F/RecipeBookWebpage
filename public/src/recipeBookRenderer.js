import { getState, setState, setChangeListener } from "./stateMachine.js";
import { getAllRecipes } from "./recipesFirestore.js"
import { addMealplanItem } from "./dataHandler.js";
import { recipeCard } from "./recipeCard.js";

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
        let recipePill = recipeCard(recipe.name)
        recipePill.onclick = e => {
            setState('recipe', recipe)
            if (getState('group') !== null) {
                let recipeObj = { type: 'recipe', name: getState('recipe').name, recipeId: getState('recipe').id }
                addMealplanItem(getState('group'), recipeObj)
                console.log(`added ${recipeObj.name} to meal plan`)
            }
        }
        html_object.appendChild(recipePill)
    })
};

renderRecipeBook()

setChangeListener('stage', renderRecipeBook)