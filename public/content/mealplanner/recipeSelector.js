import { getAllRecipes, addMealplanItem, replaceMealplanItem } from "./dataHandler.js";

let targetObject = null;

document.getElementById('recipe-modal').addEventListener('click', function () {
    closeRecipeModal()
})

document.getElementById('close-btn').addEventListener('click', function () {
    closeRecipeModal()
});

document.getElementById('random-recipe-btn').addEventListener('click', function () {
    if (!targetObject) return;
    const usedIds = getMealplanData().flatMap(flattenRecipes);
    const unused = getAllRecipes().filter(r => !usedIds.includes(r.id));
    const pick = unused.length ? unused[Math.floor(Math.random() * unused.length)] : getAllRecipes()[Math.floor(Math.random() * getAllRecipes().length)];
    addMealplanItem(targetObject, { type: 'recipe', recipeId: pick.id });
    closeRecipeModal();
});

export function openRecipeModal(object) {
    targetObject = object;
    document.getElementById('recipe-modal').style.display = 'block';
    const list = document.getElementById('recipe-list');
    list.innerHTML = '';
    getAllRecipes().forEach(r => {
        const btn = document.createElement('button');
        btn.textContent = r.name;
        btn.onclick = () => {
            let selectedRecipe = { type: 'recipe', recipeId: r.id };
            replaceMealplanItem(targetObject, selectedRecipe)
            closeRecipeModal();
        };
        list.appendChild(btn);
    })
}

function closeRecipeModal() {
    targetObject = null;
    document.getElementById('recipe-modal').style.display = 'none';
}

function flattenRecipes(item) {
    if (item.type === 'recipe') return [item.recipeId];
    if (item.items) return item.items.flatMap(flattenRecipes);
    return [];
}

