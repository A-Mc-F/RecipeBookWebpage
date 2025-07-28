import { getMealplanData, addMealplanItem, getMealplanItem, getRecipeByID } from "./dataHandler.js";

let SortMode = "recipe"; // Default sort mode

let miscItemGroupName = "Miscellaneous";
let miscItemGroupType = "misc_group"; // Type for the Miscellaneous group
let miscItemType = "misc";


// --- Shopping List Logic ---
export function renderShoppingList(sortMode = SortMode) {
    SortMode = sortMode; // Update global sort mode

    const shoppingListPage = document.getElementById('shopping-list-container');
    shoppingListPage.innerHTML = ''; // Clear existing content

    /** @type {Mealplan} */
    const mealplanData = getMealplanData();

    // Flatten all recipes from the nested structure
    function flattenRecipes(itemArray) {
        let map = [];
        let miscIngredients = [];

        for (let item of itemArray) {
            // If the item has nested items, recurse
            if (item.items && Array.isArray(item.items)) {
                let nestedMap = flattenRecipes(item.items);

                // Merge nested recipes and misc ingredients
                let childRecipes = nestedMap.filter(r => r.name !== miscItemGroupName);
                let childMisc = nestedMap.filter(r => r.name === miscItemGroupName);
                map = map.concat(childRecipes);
                for (let nestedMiscItem of childMisc) {
                    miscIngredients = miscIngredients.concat(nestedMiscItem.ingredients);
                }
            } else if (item.type === 'recipe') {
                let recipe = getRecipeByID(item.recipeId)
                if (recipe) {
                    map.push({
                        name: recipe.name,
                        ingredients: recipe.ingredients
                    });
                }
            } else if (item.type === miscItemType || item.type === 'other') {
                // Add misc/other items to the miscIngredients array
                miscIngredients.push(item.text);
            }
        }

        // At the top level, add the Miscellaneous group if there are any misc ingredients
        if (miscIngredients.length > 0) {
            map.push({
                name: miscItemGroupName,
                ingredients: miscIngredients
            });
        }

        return map;
    }

    let recipeIngredientMap = flattenRecipes(mealplanData.items);

    // --- Shopping List Rendering ---

    if (SortMode === "recipe") {
        recipeIngredientMap.forEach(recipe => {
            const heading = document.createElement('h3');
            heading.textContent = recipe.name;
            shoppingListPage.appendChild(heading);

            const ul = document.createElement('ul');
            ul.className = 'shopping-list-group';

            recipe.ingredients.forEach(ingredient => {
                const li = document.createElement('li');
                li.textContent = ingredient;
                li.onclick = function () { toggleStrikethrough(li); };
                ul.appendChild(li);
            });

            shoppingListPage.appendChild(ul);
        });


    } else if (sortMode === "alpha") {
        // Flatten all ingredients, then sort alphabetically
        let allIngredients = [];
        recipeIngredientMap.forEach(recipe => {
            recipe.ingredients.forEach(ingredient => {
                allIngredients.push({ ingredient: ingredient, recipe: recipe.name });
            });
        });

        allIngredients.sort((a, b) => {
            const ingA = a.ingredient || "";
            const ingB = b.ingredient || "";
            return ingA.localeCompare(ingB);
        });

        allIngredients.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `${item.ingredient} <span style="color:gray;font-size:0.9em;">(${item.recipe})</span>`;
            li.onclick = function () { toggleStrikethrough(li); };
            shoppingListPage.appendChild(li);
        });
    }
}

window.addMiscShoppingItem = function () {
    const input = document.getElementById('misc-item-input');
    const value = input.value.trim();
    if (!value) return;

    // Add to mealplanData as an "Other" object in the Miscellaneous meal group
    let searchResult = getMealplanItem(miscItemGroupType, miscItemGroupName);
    let miscContainerItem = searchResult.item

    if (!miscContainerItem) {
        let miscMealGroup = { type: miscItemGroupType, name: miscItemGroupName, items: [{ type: miscItemType, text: value }] };
        addMealplanItem([], miscMealGroup);
    }
    else {
        addMealplanItem(miscContainerItem, { type: miscItemType, text: value });
    }
    input.value = ''; // Clear input field
    renderShoppingList();
}


// Strikethrough per ingredient (per recipe group)
function toggleStrikethrough(element) {
    if (element.style.textDecoration === 'line-through') {
        element.style.textDecoration = 'none';
        element.parentElement.insertBefore(element, element.parentElement.firstChild);
    } else {
        element.style.textDecoration = 'line-through';
        element.parentElement.appendChild(element);
    }
}
