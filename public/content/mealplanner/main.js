import { setMealplanName } from "./dataHandler.js";
import { renderMealPlan } from "./mealPlaner.js";

document.getElementById('load-mealplan-btn').addEventListener('click', function () {
    const mealplanInput = document.getElementById('mealplanname-input').value.trim();
    if (!mealplanInput) {
        alert("Mealplan name is required!");
        return;
    }
    setMealplanName(mealplanInput);
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    displayContent('Plan');
});

// --- Slider (Radio) Event Listener ---
const radios = document.querySelectorAll('input[name="stage"]');
radios.forEach(radio => {
    radio.addEventListener('change', function () {
        const mode = document.querySelector('input[name="stage"]:checked').value;
        displayContent(mode);
    });
});

// --- Display content based on selected mode ---
function displayContent(mode) {
    if (mode === 'Plan') {
        document.getElementById('shopping-list').style.display = 'none';
        document.getElementById("meal-plan-editor").style.display = 'block';
        renderMealPlan();
    } else if (mode === 'Shop') {
        document.getElementById('meal-plan-editor').style.display = 'none';
        document.getElementById('shopping-list').style.display = 'block';
        //renderShoppingList();
    }
}
