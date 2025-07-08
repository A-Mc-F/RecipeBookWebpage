import { getAllRecipes, addMealPlanItem } from "./dataHandler.js";

let parentPath = null;

// --- Recipe modal logic ---
export function openRecipeModal(path) {
    parentPath = path;
    document.getElementById('recipe-modal').style.display = 'block';
    const list = document.getElementById('recipe-list-modal');
    list.innerHTML = '';
    getAllRecipes().forEach(r => {
        const btn = document.createElement('button');
        btn.textContent = r.name;
        btn.onclick = () => {
            addMealPlanItem(parentPath, { type: 'recipe', recipeId: r.id });
            closeRecipeModal();
        };
        list.appendChild(btn);
    })
}

window.addRandomRecipeToCurrentGroup = function () {
    if (!parentPath) return;
    const usedIds = getMealplanData().flatMap(flattenRecipes);
    const unused = getAllRecipes().filter(r => !usedIds.includes(r.id));
    const pick = unused.length ? unused[Math.floor(Math.random() * unused.length)] : getAllRecipes()[Math.floor(Math.random() * getAllRecipes().length)];
    addMealPlanItem(parentPath, { type: 'recipe', recipeId: pick.id });
    closeRecipeModal();
}

window.onclick = function (event) {
    const modal = document.getElementById('recipe-modal');
    if (event.target == modal) {
        closeRecipeModal();
    }
}

function closeRecipeModal() {
    document.getElementById('recipe-modal').style.display = 'none';
    currentRecipeTarget = null;
}

function flattenRecipes(item) {
    if (item.type === 'recipe') return [item.recipeId];
    if (item.items) return item.items.flatMap(flattenRecipes);
    return [];
}

