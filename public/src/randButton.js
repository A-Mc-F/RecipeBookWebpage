import { addMealplanItem, getAllRecipes, getMealplanData } from "./dataHandler.js";
import { getState } from "./stateMachine.js";

const modal = document.getElementById('random-choice-modal');
const container = document.getElementById('random-choice-container');
const closeBtn = document.getElementById('random-modal-close');

document.getElementById('random-recipe-btn').addEventListener('click', function () {
    const usedIds = getMealplanData().items.flatMap(flattenRecipes);
    const all = getAllRecipes();
    const unused = all.filter(r => !usedIds.includes(r.id));

    // Pick two distinct options (prefer from unused)
    const options = pickTwoDistinct(unused.length >= 2 ? unused : all);
    showChoices(options);
});

closeBtn && closeBtn.addEventListener('click', () => closeModal());
modal && modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

function pickTwoDistinct(arr) {
    if (!arr || arr.length === 0) return [];
    if (arr.length === 1) return [arr[0], arr[0]]; // fallback: duplicate
    const firstIdx = Math.floor(Math.random() * arr.length);
    let secondIdx = Math.floor(Math.random() * arr.length);
    while (secondIdx === firstIdx) {
        secondIdx = Math.floor(Math.random() * arr.length);
    }
    return [arr[firstIdx], arr[secondIdx]];
}

function showChoices(options) {
    if (!modal || !container) return;
    container.innerHTML = '';
    options.forEach(opt => {
        const card = document.createElement('div');
        card.className = 'random-choice-card';
        const title = document.createElement('h3');
        title.textContent = opt.name || 'Unnamed Recipe';
        const desc = document.createElement('p');
        desc.textContent = opt.description || (opt.ingredients ? opt.ingredients.slice(0, 3).join(', ') : '');
        const chooseBtn = document.createElement('button');
        chooseBtn.className = 'choose';
        chooseBtn.textContent = 'Choose';

        // Clicking the card or button picks this recipe
        const pickHandler = () => {
            const containerState = getState('group');
            if (!containerState) {
                // If no group selected, fallback to top-level mealplan container
                addMealplanItem(getMealplanData(), { type: 'recipe', recipeId: opt.id });
            } else {
                addMealplanItem(containerState, { type: 'recipe', recipeId: opt.id });
            }
            closeModal();
        };

        card.addEventListener('click', pickHandler);
        chooseBtn.addEventListener('click', (e) => { e.stopPropagation(); pickHandler(); });

        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(chooseBtn);
        container.appendChild(card);
    });
    openModal();
}

function openModal() {
    if (!modal) return;
    modal.style.display = 'flex';
}

function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
}

function flattenRecipes(item) {
    if (item.type === 'recipe') return [item.recipeId];
    if (item.items) return item.items.flatMap(flattenRecipes);
    return [];
}