import { getRecipeByID, addRecipe, fetchAllRecipes } from "./dataHandler.js";
import { renderRecipeBook } from "./recipeBookRenderer.js";
import { renderMealplan } from "./mealPlanRenderer.js";


document.getElementById('new-recipe-btn').addEventListener('click', function () {
    clearRecipeFormFields()
    document.getElementById('recipe-form').style.display = 'block'
});

//function to clear the fields in the modal
function clearRecipeFormFields() {
    document.getElementById('recipe-name').value = '';
    document.getElementById('recipe-ingredients').value = '';
    document.getElementById('recipe-instructions').value = '';
    // Add more fields here if your form has them
}

function fillRecipeFormFields(recipeId) {
    // Assuming you have a way to get the recipe data by ID, e.g., from a global array or API
    const recipe = getRecipeByID(recipeId); // Implement getRecipeById as needed
    if (recipe) {
        document.getElementById('recipe-name').value = recipe.name || '';
        document.getElementById('recipe-ingredients').value = recipe.ingredients || '';
        document.getElementById('recipe-instructions').value = recipe.instructions || '';
        // Add more fields here if your form has them
    }
}

async function submitRecipeForm() {
    const name = document.getElementById('recipe-name').value.trim();
    const ingredients = document.getElementById('recipe-ingredients').value
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const instructions = document.getElementById('recipe-instructions').value
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (!name || !ingredients || !instructions) {
        alert("Please fill in all fields.");
        return;
    }

    const recipe = {
        "name": name,
        "ingredients": ingredients,
        "instructions": instructions
        // Add more fields if needed
    };

    try {
        await addRecipe(recipe);
        alert("Recipe added successfully!");
        document.getElementById('recipe-form').style.display = 'none';
        clearRecipeFormFields();
    } catch (error) {
        alert("Error adding recipe: " + error.message);
    }

    await fetchAllRecipes()

    renderRecipeBook()
    renderMealplan()

}

document.getElementById('done-btn').addEventListener('click', submitRecipeForm);
