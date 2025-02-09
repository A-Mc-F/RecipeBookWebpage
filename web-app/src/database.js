const recipes = [];

function getRecipes() {
    return recipes;
}

function addRecipe(title, ingredients, instructions) {
    recipes.push({ title, ingredients, instructions });
}

module.exports = { getRecipes, addRecipe };