import { } from "./src/stageSelection.js"
import { } from "./src/recipeBookRenderer.js"
import { renderMealplan } from "./src/mealPlanRenderer.js"
import { } from "./src/shoppingListRenderer.js"
import { } from "./src/randButton.js"
import { } from "./src/recipeForm.js"
import { setMealplanName, leaveMealplan, getMealplanName, setMealplanChangeListener } from "./src/dataHandler.js"
import { setChangeListener, getState } from "./src/stateMachine.js"

// Wire the join UI
const joinBtn = document.getElementById('join-mealplan-btn');
const leaveBtn = document.getElementById('leave-mealplan-btn');
const input = document.getElementById('mealplan-code-input');
const label = document.getElementById('mealplan-label');
const mealplanJoinUi = document.getElementById('mealplan-join-ui');
const mealPlanContainer = document.getElementById('meal-plan');
const randomRecipeContainer = document.getElementById('random-recipe-container');

function updateUIForJoin(name) {
    if (name) {
        label.textContent = `Plan: ${name}`;
        input.style.display = 'none';
        joinBtn.style.display = 'none';
        leaveBtn.style.display = '';
        // shrink join UI so the meal plan and random button are visible
        if (mealplanJoinUi) mealplanJoinUi.classList.remove('expanded');
        if (mealPlanContainer) mealPlanContainer.style.display = '';
        if (randomRecipeContainer) randomRecipeContainer.style.display = '';
    } else {
        label.textContent = 'Plan: (not joined)';
        input.style.display = '';
        joinBtn.style.display = '';
        leaveBtn.style.display = 'none';
        // expand join UI to fill the panel and hide the meal plan list and random button
        if (mealplanJoinUi) mealplanJoinUi.classList.add('expanded');
        if (mealPlanContainer) mealPlanContainer.style.display = 'none';
        if (randomRecipeContainer) randomRecipeContainer.style.display = 'none';
    }
}

joinBtn.addEventListener('click', () => {
    const code = input.value.trim();
    if (!code) return alert('Please enter a codeword to join a mealplan.');
    setMealplanName(code);
    updateUIForJoin(code);
});

leaveBtn.addEventListener('click', () => {
    leaveMealplan();
    updateUIForJoin(null);
});

window.addEventListener('beforeunload', () => {
    try { leaveMealplan(); } catch (e) { /* ignore */ }
});

// Optional: re-render when mealplan changes
setMealplanChangeListener((mp) => {
    renderMealplan();
});

// Show join UI only when on the Plan stage
function updateJoinUIVisibility() {
    const joinUi = document.getElementById('mealplan-join-ui');
    if (!joinUi) return;
    const stage = getState('stage');
    if (stage === 'Plan') {
        joinUi.style.display = '';
    } else {
        joinUi.style.display = 'none';
    }
}

setChangeListener('stage', updateJoinUIVisibility);
// Initialize visibility
updateJoinUIVisibility();
// Initialize current label based on existing state
try { updateUIForJoin(getMealplanName()); } catch (e) { /* ignore */ }