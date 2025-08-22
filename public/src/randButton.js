import { addMealplanItem, getAllRecipes, getMealplanData } from "./dataHandler.js";
import { getState } from "./stateMachine.js";

document.getElementById('random-recipe-btn').addEventListener('click', function () {
    const usedIds = getMealplanData().items.flatMap(flattenRecipes);
    const unused = getAllRecipes().filter(r => !usedIds.includes(r.id));
    const pick = unused.length ? unused[Math.floor(Math.random() * unused.length)] : getAllRecipes()[Math.floor(Math.random() * getAllRecipes().length)];
    addMealplanItem(getState('group'), { type: 'recipe', recipeId: pick.id });
});

function flattenRecipes(item) {
    if (item.type === 'recipe') return [item.recipeId];
    if (item.items) return item.items.flatMap(flattenRecipes);
    return [];
}