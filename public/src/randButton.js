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
    if (!options || options.length === 0) return;

    function makeCard(opt) {
        const card = document.createElement('div');
        card.className = 'random-choice-card';
        const title = document.createElement('h3');
        title.textContent = opt.name || 'Unnamed Recipe';

        const pickHandler = () => {
            const containerState = getState('group');
            if (!containerState) {
                addMealplanItem(getMealplanData(), { type: 'recipe', recipeId: opt.id });
            } else {
                addMealplanItem(containerState, { type: 'recipe', recipeId: opt.id });
            }
            closeModal();
        };

        card.addEventListener('click', pickHandler);
        card.appendChild(title);
        return card;
    }

    // Append first card
    container.appendChild(makeCard(options[0]));

    // If there is a second option, insert an 'or' separator then the second card
    if (options.length >= 2) {
        const orEl = document.createElement('div');
        orEl.className = 'random-or';
        orEl.textContent = 'or';
        container.appendChild(orEl);
        container.appendChild(makeCard(options[1]));
    }
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