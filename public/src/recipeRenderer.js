import { setState, getState } from "./stateMachine.js";
import { addMealplanItem } from "./dataHandler.js";

export function recipeCard(recipe) {
    let card = document.createElement('div');
    card.setAttribute('tag', 'selectable')
    card.className = 'recipe-card glass-card'
    card.onclick = e => {
        selectRecipe(recipe);
    }
    card.innerText = recipe.name;

    return card
}

function selectRecipe(recipe) {
    setState('recipe', recipe)
    switch (getState('stage')) {
        case 'Book':
            {
                if (getState('group') !== null) {
                    let recipeObj = { type: 'recipe', name: getState('recipe').name, recipeId: getState('recipe').id }
                    addMealplanItem(getState('group'), recipeObj)
                    console.log(`added ${recipeObj.name} to meal plan`)
                }
                break;
            }
        case 'Plan': {

        }
        case 'Shop': {

        }
    }
}