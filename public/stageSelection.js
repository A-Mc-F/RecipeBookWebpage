import { renderRecipeBook } from "./src/recipeBook.js";
import { renderMealplan } from "./content/mealplanner/mealPlanRenderer.js"
import { renderShoppingList } from "./content/mealplanner/shoppingList.js";
import { getState, setChangeListener, setState } from "./stateMachine.js";

// --- Slider (Radio) Event Listener ---
const selectors = document.querySelectorAll('div.stage-selector');
selectors.forEach(selector => {
    console.log(`Assigning function to ${selector.id}`)
    selector.addEventListener('click', function () {
        setState('stage', selector.id);
    });
});

// --- Display content based on selected mode ---
export function displayContent() {
    const stage = getState('stage')
    console.log(`Changing to ${stage}`)
    switch (stage) {
        case 'Book':
            hidePanels();
            document.getElementById('book-panel').classList.add('active');
            document.getElementById('Book').classList.add('active');
            renderRecipeBook();
            console.log('Now showing book')
            break;
        case 'Plan':
            hidePanels();
            document.getElementById('plan-panel').classList.add('active');
            document.getElementById('Plan').classList.add('active');
            renderMealplan();
            console.log('Now showing plan')
            break;
        case 'Shop':
            hidePanels();
            document.getElementById('shop-panel').classList.add('active');
            document.getElementById('Shop').classList.add('active');
            renderShoppingList();
            console.log('Now showing shop')
            break;
    }
}

setChangeListener('stage', displayContent)

function hidePanels() {
    document.getElementById('book-panel').classList.remove('active');
    document.getElementById('plan-panel').classList.remove('active');
    document.getElementById('shop-panel').classList.remove('active');

    document.getElementById('Book').classList.remove('active');
    document.getElementById('Plan').classList.remove('active');
    document.getElementById('Shop').classList.remove('active');
}

setState('stage', 'Book')