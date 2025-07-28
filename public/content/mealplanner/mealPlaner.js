import { getAllRecipes, getMealplanData, setMealplanChangeListener, addMealplanItem, removeMealplanItem, updateMealplanItem } from "./dataHandler.js";
import { openRecipeModal } from "./recipeSelector.js";


// --- Render the meal plan recursively ---
export function renderMealplan() {
    const html_object = document.getElementById('meal-plan-container');
    html_object.innerHTML = '';
    html_object.appendChild(renderMealplanContainer(getMealplanData()));
};

// Register change listener to auto-render on data change
setMealplanChangeListener(renderMealplan);

function renderMealplanContainer(object) {
    let el = document.createElement('div')
    el.className = object.type

    if (object.type === 'mealplan') {
        if (object.items && !(object.items.length === 0)) {
            object.items.forEach((item) => {
                el.appendChild(renderMealplanContainer(item));
            })
        }
        el.appendChild(plusButton(object))
        return el
    }

    else if (object.type === 'day' || object.type === 'meal' || object.type === 'misc_group') {
        let headingRow = document.createElement('div');
        headingRow.appendChild(textInput(object));
        headingRow.appendChild(recipeListButton(object));
        headingRow.appendChild(removeButton(object));

        el.appendChild(headingRow);

        // Children
        if (object.items || !(object.items.length === 0)) {
            object.items.forEach((item) => {
                el.appendChild(renderMealplanContainer(item));
            })
        }
        el.appendChild(plusButton(object))

        return el
    }

    else if (object.type === 'recipe') {
        const recipe = getAllRecipes().find(r => r.id === object.recipeId);
        const recipeNameDiv = document.createElement('span');
        recipeNameDiv.textContent = recipe ? recipe.name : 'Unknown Recipe';
        el.appendChild(recipeNameDiv);
        el.appendChild(recipeListButton(object))
        el.appendChild(removeButton(object));
        return el
    }

    else if (object.type === 'other' || object.type === 'misc') {
        el.appendChild(textInput(object));
        el.appendChild(recipeListButton(object));
        el.appendChild(removeButton(object));
        return el
    }
}

function textInput(object) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = object.name || '';
    switch (object.type) {
        case 'day':
            input.placeholder = "Day Name";
            break;
        case 'meal':
            input.placeholder = "Meal Name";
            break;
        case 'other':
            input.placeholder = "Note / Other...";
            break;
    }

    input.className = 'mealplan-input';
    input.onblur = e => {
        updateMealplanItem(object, { name: input.value });
    };
    return input;
}

function plusButton(object) {
    const plusBtn = document.createElement('div');
    plusBtn.className = 'icon-button plus-btn';
    plusBtn.innerHTML = '<img src="../../icons/plus.png" alt="Add">';
    plusBtn.onclick = e => {
        addItem(object);
    };
    return plusBtn;
}

function removeButton(object) {
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '<img src="../../icons/delete.png" alt="Remove">';
    removeBtn.className = 'icon-button remove-btn';
    removeBtn.onclick = () => {
        removeMealplanItem(object);
    };
    return removeBtn;
}

function recipeListButton(object) {
    const recipeBtn = document.createElement('button');
    recipeBtn.innerHTML = '<img src="../../icons/notebook.png" alt="Recipe">';
    recipeBtn.className = 'icon-button recipe-btn';
    recipeBtn.onclick = () => {
        openRecipeModal(object);
    }
    return recipeBtn;
}

function addItem(object) {

    if (object.type === 'mealplan') {
        addMealplanItem(object, { type: 'day', name: '', items: [] });
    }

    else if (object.type === 'day') {
        addMealplanItem(object, { type: 'meal', name: '', items: [] });
    }

    else if (object.type === 'meal') {
        addMealplanItem(object, { type: 'other', recipeId: '', items: [] });
    }
}
