import { getAllRecipes, getMealplanData, setMealPlanChangeListener, addMealPlanItem, removeMealPlanItem, updateMealPlanItem } from "./dataHandler.js";
import { openRecipeModal } from "./recipeSelector.js";


// --- Render the meal plan recursively ---
export function renderMealPlan() {
    const html_object = document.getElementById('meal-plan-editor');
    html_object.innerHTML = '';
    const mealplanData = getMealplanData();
    renderMealPlanContainer(html_object, mealplanData, []);
};

// Register change listener to auto-render on data change
setMealPlanChangeListener(renderMealPlan);


function renderMealPlanContainer(html_element, container, parentPath = []) {
    html_element.innerHTML = '';

    container.items.forEach((item, idx) => {
        const path = parentPath.concat(idx);
        let el = document.createElement('div');
        el.className = 'mealplan-item mealplan-' + item.type;

        // Create a flex row container for inline content + remove button
        const row = document.createElement('div');
        row.className = 'mealplan-item-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '0.5em';

        if (item.type === 'day' || item.type === 'meal') {
            // Editable name
            const input = document.createElement('input');
            input.type = 'text';
            input.value = item.name || '';
            input.placeholder = item.type === 'day' ? 'Day Name' : 'Meal Name';
            input.className = 'mealplan-group-input';
            input.oninput = e => {
                updateMealPlanItem(parentPath, idx, { name: input.value });
            };
            row.appendChild(input);

            // Remove button inline
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<img src="../../icons/delete.png" alt="Remove">';
            removeBtn.className = 'icon-button remove-btn';
            removeBtn.onclick = () => {
                removeMealPlanItem(parentPath, idx);
            };
            row.appendChild(removeBtn);

            el.appendChild(row);

            // Children
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'mealplan-group-children';
            renderMealPlanContainer(childrenDiv, item, path);
            el.appendChild(childrenDiv);
        } else if (item.type === 'recipe') {
            const recipe = getAllRecipes().find(r => r.id === item.recipeId);
            const recipeDiv = document.createElement('div');
            recipeDiv.className = 'mealplan-recipe';
            recipeDiv.textContent = recipe ? recipe.name : 'Unknown Recipe';
            row.appendChild(recipeDiv);

            // Remove button inline
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<img src="../../icons/delete.png" alt="Remove">';
            removeBtn.className = 'icon-button remove-btn';
            removeBtn.onclick = () => {
                removeMealPlanItem(parentPath, idx);
            };
            row.appendChild(removeBtn);

            el.appendChild(row);
        } else if (item.type === 'other') {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = item.text || '';
            input.placeholder = 'Other...';
            input.className = 'mealplan-other-input';
            input.oninput = e => {
                updateMealPlanItem(parentPath, idx, { text: input.value });
            };
            row.appendChild(input);

            // Remove button inline
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<img src="../../icons/delete.png" alt="Remove">';
            removeBtn.className = 'icon-button remove-btn';
            removeBtn.onclick = () => {
                removeMealPlanItem(parentPath, idx);
            };
            row.appendChild(removeBtn);

            el.appendChild(row);
        }

        html_element.appendChild(el);
    });

    // Plus tile at the end
    const plusTile = document.createElement('div');
    plusTile.className = 'mealplan-plus-tile';
    plusTile.innerHTML = '<img src="../../icons/plus.png" alt="Add">';
    plusTile.onclick = e => {
        showAddItemMenu(plusTile, container, parentPath);
    };
    html_element.appendChild(plusTile);
}

// --- Show add-item menu ---
export function showAddItemMenu(tile, container, parentPath) {
    closeAddItemListMenu();
    const menu = document.createElement('div');
    menu.className = 'add-item-menu';

    // Determine allowed types based on context
    let allowed = ['day', 'meal', 'recipe', 'other'];
    if (parentPath.length > 0) {
        // If inside a day, allow meal, recipe, other
        if (container.type === 'day') allowed = ['meal', 'recipe', 'other'];
        // If inside a meal, allow recipe, other
        if (container.type === 'meal') allowed = ['recipe', 'other'];
    }

    if (allowed.includes('day')) {
        const btn = document.createElement('button');
        btn.textContent = 'Day';
        btn.onclick = () => {
            addMealPlanItem(parentPath, { type: 'day', name: '', items: [] });
        };
        menu.appendChild(btn);
    }
    if (allowed.includes('meal')) {
        const btn = document.createElement('button');
        btn.textContent = 'Meal';
        btn.onclick = () => {
            addMealPlanItem(parentPath, { type: 'meal', name: '', items: [] });
        };
        menu.appendChild(btn);
    }
    if (allowed.includes('recipe')) {
        const btn = document.createElement('button');
        btn.textContent = 'Recipe';
        btn.onclick = () => {
            openRecipeModal(parentPath);
            closeAddItemListMenu(); // Close menu after opening modal
        };
        menu.appendChild(btn);
    }
    if (allowed.includes('other')) {
        const btn = document.createElement('button');
        btn.textContent = 'Other';
        btn.onclick = () => {
            addMealPlanItem(parentPath, { type: 'other', text: '' });
        };
        menu.appendChild(btn);
    }

    tile.appendChild(menu);

    // Close menu on click outside
    setTimeout(() => {
        document.addEventListener('click', closeAddItemListMenu, { once: true });
    }, 10);

    menu.onclick = e => e.stopPropagation();
}

function closeAddItemListMenu() {
    document.querySelectorAll('.add-item-menu').forEach(m => m.remove());
}

// --- Helper: get item by path ---
function getItemByPath(arr, path) {
    let item = arr;
    for (let idx of path) item = item[idx].items || item[idx];
    return item;
}
