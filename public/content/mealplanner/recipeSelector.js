import { getAllRecipes, addMealplanItem, replaceMealplanItem } from "./dataHandler.js";

let targetObject = null;

document.getElementById('recipe-modal').addEventListener('click', function () {
    closeRecipeModal()
})

document.getElementById('close-btn').addEventListener('click', function () {
    closeRecipeModal()
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

