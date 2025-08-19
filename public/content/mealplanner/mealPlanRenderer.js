import { recipeCard } from "../../src/recipeRenderer.js";
import { getState, setChangeListener, setState } from "../../stateMachine.js";
import { getAllRecipes, getMealplanData, setMealplanChangeListener, addMealplanItem, removeMealplanItem, updateMealplanItem } from "./dataHandler.js";

// --- Render the meal plan recursively ---
export function renderMealplan() {
    if (getState('stage') !== 'Plan') {
        return
    }
    console.log('rendering Mealplan')
    const html_object = document.getElementById('meal-plan');
    html_object.innerHTML = '';
    html_object.appendChild(renderMealplanContainer(getMealplanData()));
    setState('group', getMealplanData())
};

// Register change listener to auto-render on data change
setMealplanChangeListener(renderMealplan);

function renderMealplanContainer(object) {
    //-helper
    let spacer = document.createElement('span')
    spacer.style.flexGrow = 1
    //-helper

    let el = document.createElement('div')
    el.className = `${object.type} mealplan-item`;
    el.setAttribute('tag', 'selectable')


    switch (object.type) {
        case 'mealplan':
            {
                let headingRow = document.createElement('div');
                headingRow.className = 'heading-row'
                let mealplanName = document.createElement('h3')
                mealplanName.innerText = object.name
                headingRow.appendChild(mealplanName);
                // headingRow.appendChild(spacer)
                el.appendChild(headingRow)

                if (object.items && !(object.items.length === 0)) {
                    object.items.forEach((item) => {
                        el.appendChild(renderMealplanContainer(item));
                    })
                }

                // el.appendChild(plusButton(object))

                return el
            }
        case 'day':
            {
                let headingRow = document.createElement('div');
                headingRow.className = 'heading-row'
                let objectName = document.createElement('h5');
                objectName.innerText = object.name;
                headingRow.appendChild(objectName);
                // headingRow.appendChild(spacer)
                // headingRow.appendChild(recipeListButton(object));
                // headingRow.appendChild(removeButton(object));

                el.appendChild(headingRow);

                if (object.items || !(object.items.length === 0)) {
                    object.items.forEach((item) => {
                        el.appendChild(renderMealplanContainer(item));
                    })
                }

                let dropBox = document.createElement('h3')
                dropBox.className = 'drop-box'
                dropBox.innerText = 'Empty'
                dropBox.setAttribute('tag', 'selectable')
                dropBox.onclick = e => {
                    selectGroup(object)
                }
                el.appendChild(dropBox)

                return el
            }
        case 'meal':
            {
                let headingRow = document.createElement('div');
                headingRow.className = 'heading-row'
                let objectName = document.createElement('h6');
                objectName.innerText = object.name;
                headingRow.appendChild(objectName);
                // headingRow.appendChild(spacer)
                // headingRow.appendChild(recipeListButton(object));
                // headingRow.appendChild(removeButton(object));
                el.appendChild(headingRow);

                if (object.items || !(object.items.length === 0)) {
                    object.items.forEach((item) => {
                        el.appendChild(renderMealplanContainer(item));
                    })
                }

                let dropBox = document.createElement('h3')
                dropBox.className = 'drop-box'
                dropBox.innerText = 'Empty'
                dropBox.setAttribute('tag', 'selectable')
                dropBox.onclick = e => {
                    selectGroup(object)
                }
                el.appendChild(dropBox)

                // el.appendChild(plusButton(object))

                return el
            }
        case 'misc_group':
            {
                let headingRow = document.createElement('div');
                headingRow.className = 'heading-row'
                let objectName = document.createElement('h6');
                objectName.innerText = object.name;
                headingRow.appendChild(objectName);
                // headingRow.appendChild(spacer)
                // headingRow.appendChild(recipeListButton(object));
                // headingRow.appendChild(removeButton(object));

                el.appendChild(headingRow);

                // Children
                if (object.items || !(object.items.length === 0)) {
                    object.items.forEach((item) => {
                        el.appendChild(renderMealplanContainer(item));
                    })
                }

                // el.appendChild(plusButton(object))

                return el
            }
        case 'recipe':
            {
                const recipe = getAllRecipes().find(r => r.id === object.recipeId);
                el.appendChild(recipeCard(recipe));
                el.appendChild(removeButton(object));
                console.log(`tried adding recipe ${recipe.name}`)
                return el
            }
        case 'other':
            {
                let headingRow = document.createElement('div');
                headingRow.className = 'heading-row'
                headingRow.appendChild(textInput(object));
                headingRow.appendChild(spacer)
                headingRow.appendChild(recipeListButton(object));
                headingRow.appendChild(removeButton(object));
                el.appendChild(headingRow)
                return el
            }
        case 'misc':
            {
                let headingRow = document.createElement('div');
                headingRow.className = 'heading-row'
                headingRow.appendChild(textInput(object));
                headingRow.appendChild(spacer)
                headingRow.appendChild(recipeListButton(object));
                headingRow.appendChild(removeButton(object));
                el.appendChild(headingRow)
                return el
            }
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
        //object.name = input.value
        updateMealplanItem(object, { name: input.value });
    };
    return input;
}

function selectGroup(group) {
    setState('group', group)
    if (getState('recipe') !== null) {
        let recipeObj = { type: 'recipe', name: getState('recipe').name, recipeId: getState('recipe').id }
        addMealplanItem(group, recipeObj)
    }
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
        //openRecipeModal(object);
    }
    return recipeBtn;
}

function addItem(object) {
    switch (object.type) {
        case 'mealplan':
            addMealplanItem(object, { type: 'day', name: '', items: [] });
            break;
        case 'day':
            addMealplanItem(object, { type: 'meal', name: '', items: [] });
            break;

        case 'meal':
            addMealplanItem(object, { type: 'other', recipeId: '', items: [] });
            break;
    }
}

setChangeListener('stage', renderMealplan)

renderMealplan()