
import { getMealplanData } from "./dataHandler.js";

// --- Shopping List Logic ---
async function renderShoppingList() {
    const mealPlanData = getMealplanData();
    // Flatten all recipes from the nested structure
    function flattenRecipes(items) {
        let ids = [];
        for (const item of items) {
            if (item.type === 'recipe') ids.push(item.recipeId);
            if (item.items) ids = ids.concat(flattenRecipes(item.items));
        }
        return ids;
    }
    const recipeIds = flattenRecipes(mealPlanData);

    // Gather ingredients grouped by recipe
    let recipeIngredientMap = [];
    for (const id of recipeIds) {
        const recipeDoc = await getDoc(doc(db, 'recipes', id));
        if (recipeDoc.exists()) {
            const data = recipeDoc.data();
            recipeIngredientMap.push({
                name: data.name,
                id: id,
                type: data.type || "Other",
                ingredients: Array.isArray(data.ingredients) ? data.ingredients : []
            });
        }
    }

    // Load any previously added custom items for this session
    let customItems = window._customShoppingItems || [];

    // Save meal plan for this user (by username)
    if (currentUsername) {
        await setDoc(doc(db, 'mealPlans', currentUsername), {
            username: currentUsername,
            recipeIds: recipeIds,
            customItems: customItems,
            timestamp: new Date()
        });
    }

    // --- Shopping List Rendering Function ---
    function renderShoppingList(sortMode) {
        let shoppingListHtml = '';

        if (sortMode === "recipe") {
            recipeIngredientMap.forEach(recipe => {
                shoppingListHtml += `<h3>${recipe.name}</h3><ul class="shopping-list-group" data-recipe-id="${recipe.id}">`;
                recipe.ingredients.forEach(ingredient => {
                    shoppingListHtml += `<li onclick="toggleStrikethrough(this)">${ingredient}</li>`;
                });
                shoppingListHtml += `</ul>`;
            });
        } else if (sortMode === "alpha") {
            // Flatten all ingredients, then sort alphabetically
            let allIngredients = [];
            recipeIngredientMap.forEach(recipe => {
                recipe.ingredients.forEach(ingredient => {
                    allIngredients.push({ ingredient, recipe: recipe.name });
                });
            });
            allIngredients.sort((a, b) => a.ingredient.localeCompare(b.ingredient));
            shoppingListHtml += `<h3>All Ingredients (A-Z)</h3><ul class="shopping-list-group">`;
            allIngredients.forEach(item => {
                shoppingListHtml += `<li onclick="toggleStrikethrough(this)">${item.ingredient} <span style="color:gray;font-size:0.9em;">(${item.recipe})</span></li>`;
            });
            shoppingListHtml += `</ul>`;
        } else if (sortMode === "type") {
            // Group by type/category if available
            let typeMap = {};
            recipeIngredientMap.forEach(recipe => {
                const type = recipe.type || "Other";
                if (!typeMap[type]) typeMap[type] = [];
                recipe.ingredients.forEach(ingredient => {
                    typeMap[type].push({ ingredient, recipe: recipe.name });
                });
            });
            Object.keys(typeMap).sort().forEach(type => {
                shoppingListHtml += `<h3>${type}</h3><ul class="shopping-list-group">`;
                typeMap[type].forEach(item => {
                    shoppingListHtml += `<li onclick="toggleStrikethrough(this)">${item.ingredient} <span style="color:gray;font-size:0.9em;">(${item.recipe})</span></li>`;
                });
                shoppingListHtml += `</ul>`;
            });
        }

        // Add custom items as their own group
        if (customItems.length > 0) {
            shoppingListHtml += `<h3>Custom Items</h3><ul class="shopping-list-group custom-items">`;
            customItems.forEach(item => {
                shoppingListHtml += `<li class="custom-item" onclick="toggleStrikethrough(this)">${item}</li>`;
            });
            shoppingListHtml += `</ul>`;
        }

        return shoppingListHtml;
    }

    // Attach handler for adding custom items
    window.addCustomShoppingItem = function () {
        const input = document.getElementById('custom-item-input');
        const value = input.value.trim();
        if (!value) return;
        let ul = document.querySelector('.shopping-list-group.custom-items');
        if (!ul) {
            // If no custom items group exists, create it
            const customGroup = document.createElement('ul');
            customGroup.className = 'shopping-list-group custom-items';
            const heading = document.createElement('h3');
            heading.textContent = 'Custom Items';
            shoppingListPage.insertBefore(heading, input);
            shoppingListPage.insertBefore(customGroup, input);
            ul = customGroup;
        }
        const li = document.createElement('li');
        li.textContent = value;
        li.className = 'custom-item';
        li.onclick = function () { window.toggleStrikethrough(li); };
        ul.appendChild(li);
        input.value = '';
        // Save to session and Firestore
        window._customShoppingItems = window._customShoppingItems || [];
        window._customShoppingItems.push(value);
        // Update Firestore
        if (currentUsername) {
            setDoc(doc(db, 'mealPlans', currentUsername), {
                username: currentUsername,
                recipeIds: recipeIds,
                customItems: window._customShoppingItems,
                timestamp: new Date()
            });
        }
    };

    // Save current custom items for this session
    window._customShoppingItems = customItems;

    // Strikethrough per ingredient (per recipe group)
    window.toggleStrikethrough = function (element) {
        if (element.style.textDecoration === 'line-through') {
            element.style.textDecoration = 'none';
            // Move to top of its group
            element.parentElement.insertBefore(element, element.parentElement.firstChild);
        } else {
            element.style.textDecoration = 'line-through';
            // Move to bottom of its group
            element.parentElement.appendChild(element);
            // If it's a custom item, remove from list and Firestore
            if (element.classList.contains('custom-item')) {
                const itemText = element.textContent;
                window._customShoppingItems = (window._customShoppingItems || []).filter(i => i !== itemText);
                element.remove();
                // Update Firestore

            }
        }
    }
};

// Add a function to load the user's last meal plan
window.loadUserMealPlan = async function () {
    if (!currentUsername) return;
    const mealPlanDoc = await getDoc(doc(db, 'mealPlans', currentUsername));
    let customItems = [];
    if (mealPlanDoc.exists()) {
        const data = mealPlanDoc.data();
        const recipeIds = data.recipeIds || [];
        customItems = data.customItems || [];
        // Clear current meal plan
        const mealPlan = document.getElementById('meal-plan');
        mealPlan.innerHTML = '';
        // For each recipe, fetch its name and add to meal plan UI
        for (const id of recipeIds) {
            const recipeDoc = await getDoc(doc(db, 'recipes', id));
            if (recipeDoc.exists()) {
                const recipe = recipeDoc.data();
                window.addToMealPlan(recipe.name, id);
            }
        }
    }
    // Save custom items for this session
    window._customShoppingItems = customItems;
}

window.toggleStrikethrough = function (element) {
    const parent = element.parentElement;
    if (element.style.textDecoration === 'line-through') {
        element.style.textDecoration = 'none';
        // Move the element to the top of the list
        parent.insertBefore(element, parent.firstChild);
    } else {
        element.style.textDecoration = 'line-through';
        // Move the element to the bottom of the list
        parent.appendChild(element);
    }
}