import { getState, setChangeListener } from "./stateMachine.js";
import { getMealplanData, getRecipeByID, getShoppingChecks, updateShoppingCheck, getMiscShoppingItems, addMiscShoppingItem, removeMiscShoppingItem, setMealplanChangeListener } from "./dataHandler.js";

let sortMode = "alpha";

let miscItemGroupName = "Miscellaneous";


// --- Shopping List Logic ---
export function renderShoppingList(nextSortMode = sortMode) {
    if (getState('stage') !== 'Shop') {
        return
    }
    console.log('rendering Shopping list')

    if (nextSortMode === 'alpha' || nextSortMode === 'recipe') {
        sortMode = nextSortMode;
    }

    const shoppingListPage = document.getElementById('shopping-list');
    if (!shoppingListPage) return;
    shoppingListPage.innerHTML = ''; // Clear existing content

    // Load persisted checkbox state (shared via mealplan when joined)
    const persistedChecks = getShoppingChecks() || {};
    const miscItems = getMiscShoppingItems().map(item => typeof item === 'string'
        ? { id: item, text: item }
        : item);

    /** @type {Mealplan} */
    const mealplanData = getMealplanData() || { name: '', type: 'mealplan', items: [] };

    const isMealplanLoaded = mealplanData && Array.isArray(mealplanData.items);

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

    let recipeIngredientMap = flattenRecipes(isMealplanLoaded ? mealplanData.items : []);
    if (miscItems.length > 0) {
        recipeIngredientMap.push({
            name: miscItemGroupName,
            ingredients: miscItems
        });
    }

    // If there are no ingredients, show a clear placeholder and stop.
    // If a plan is still loading, avoid flashing a false empty state by keeping the page blank.
    if (!isMealplanLoaded) {
        return;
    }

    if (!recipeIngredientMap || recipeIngredientMap.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.color = 'rgba(255,255,255,0.8)';
        emptyMsg.style.padding = '12px';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.textContent = 'No shopping items';
        shoppingListPage.appendChild(emptyMsg);
        return;
    }

    // --- Shopping List Rendering ---

    if (sortMode === "recipe") {
        recipeIngredientMap.forEach(recipe => {
            const heading = document.createElement('h3');
            heading.textContent = recipe.name;
            shoppingListPage.appendChild(heading);

            const ul = document.createElement('ul');
            ul.className = 'shopping-list-group';

            recipe.ingredients.forEach(ingredient => {
                const li = recipe.name === miscItemGroupName
                    ? createMiscListItem(ingredient, persistedChecks)
                    : createIngredientListItem(ingredient, persistedChecks);
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
            const ingA = typeof a.ingredient === 'string' ? a.ingredient : a.ingredient.text;
            const ingB = typeof b.ingredient === 'string' ? b.ingredient : b.ingredient.text;
            return ingA.localeCompare(ingB);
        });

        allIngredients.forEach(item => {
            const ingredientText = typeof item.ingredient === 'string' ? item.ingredient : item.ingredient.text;
            const text = `${ingredientText} <span style="color:gray;font-size:0.9em;">(${item.recipe})</span>`;
            const li = item.recipe === miscItemGroupName
                ? createMiscListItem(item.ingredient, persistedChecks)
                : createIngredientListItem(text, persistedChecks, /*isHtml=*/true);
            shoppingListPage.appendChild(li);
        });
    }

    // Add copy button at top of shopping list
    addCopyButton(shoppingListPage);
}

function handleMiscShoppingSubmit() {
    const input = document.getElementById('misc-item-input');
    if (!input) return;
    const value = input.value.trim();
    if (!value) return;
    addMiscShoppingItem(value);
    input.value = '';
    renderShoppingList();
}


function createIngredientListItem(text, persistedChecks, isHtml = false) {
    const li = document.createElement('li');
    li.className = 'shopping-item';

    const key = isHtml ? stripHtml(text) : text;
    const isChecked = !!persistedChecks[key];

    const label = document.createElement('label');
    label.style.cursor = 'pointer';
    label.style.display = 'block';
    if (isHtml) {
        label.innerHTML = text;
    } else {
        label.textContent = text;
    }

    if (isChecked) {
        label.style.textDecoration = 'line-through';
        label.style.color = 'silver';
    }

    label.addEventListener('click', () => {
        const currentChecked = getComputedStyle(label).textDecoration.includes('line-through');
        const nextValue = !currentChecked;
        updateShoppingCheck(key, nextValue).catch(err => console.error('Failed to update shared check:', err));
        label.style.textDecoration = nextValue ? 'line-through' : 'none';
        label.style.color = nextValue ? 'silver' : '';
    });

    li.appendChild(label);
    return li;
}

function createMiscListItem(item, persistedChecks) {
    const li = createIngredientListItem(item.text, persistedChecks);
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-shopping-item';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        removeMiscShoppingItem(item.id);
    });
    li.appendChild(removeButton);
    return li;
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function addCopyButton(container) {
    // Avoid adding multiple buttons
    if (document.getElementById('copy-to-clipboard-btn')) return;

    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.gap = '8px';
    wrapper.style.alignItems = 'center';
    wrapper.style.padding = '8px 0';

    const clipBtn = document.createElement('button');
    clipBtn.id = 'copy-to-clipboard-btn';
    clipBtn.className = 'cta-button';
    clipBtn.textContent = 'Copy to Clipboard';
    clipBtn.addEventListener('click', async () => {
        await copyToClipboardPlain();
        clipBtn.textContent = 'Copied ✓';
        setTimeout(() => clipBtn.textContent = 'Copy to Clipboard', 1500);
    });

    wrapper.appendChild(clipBtn);
    container.insertBefore(wrapper, container.firstChild);
}

// The Apple Notes-specific clipboard function was removed — use plain clipboard copy only.

async function copyToClipboardPlain() {
    // Format lines as "- [ ] Item" or "- [x] Item" so Apple Notes recognizes checklists
    const plain = Array.from(document.querySelectorAll('.shopping-item label')).map(l => {
        const checked = getComputedStyle(l).textDecoration.includes('line-through');
        const chk = checked ? '[x]' : '[ ]';
        return `- ${chk} ${l.textContent}`;
    }).join('\n');

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(plain);
        } else {
            const ta = document.createElement('textarea');
            ta.value = plain;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
        }
    } catch (e) {
        console.error('plain copy failed', e);
    }
}


setChangeListener('stage', renderShoppingList)

const miscShoppingForm = document.getElementById('misc-shopping-form');
if (miscShoppingForm) {
    miscShoppingForm.addEventListener('submit', (event) => {
        event.preventDefault();
        handleMiscShoppingSubmit();
    });
}

// Re-render shopping list when the shared mealplan or checks change
setMealplanChangeListener(() => renderShoppingList())

renderShoppingList()