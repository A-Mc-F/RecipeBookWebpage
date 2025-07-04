import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit, getDoc, doc, getDocsFromServer, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { RecipeObject, recipeConverter } from './recipeObject.js';

const firebaseConfig = {
    apiKey: "AIzaSyB7fE3GsZIxyfE7twzsUnycLCk4tx0xzU4",
    authDomain: "mealplanner-e91be.firebaseapp.com",
    projectId: "mealplanner-e91be",
    storageBucket: "mealplanner-e91be.firebasestorage.app",
    messagingSenderId: "46200749310",
    appId: "1:46200749310:web:9a99f7d4e6d225ccff39af"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const recipesCol = collection(db, 'recipes');
const mealPlansCol = collection(db, 'mealPlans'); // Add a collection for meal plans
let currentUser = null;
let currentUsername = null;


async function fetchRecipes() {
    const recipesSnapshot = await getDocs(query(recipesCol));
    const recipeList = document.getElementById('recipe-list');
    recipeList.innerHTML = '';
    recipesSnapshot.forEach(doc => {
        const recipe = doc.data();
        const recipeItem = document.createElement('div');
        recipeItem.className = 'recipe-item';
        recipeItem.innerHTML = `
            <span>${recipe.name}</span>
            <button class="icon-button" onclick="addToMealPlan('${recipe.name}', '${doc.id}')"><img src="../icons/plus.png" alt="Add To Meal Plan"></button>
        `;
        recipeList.appendChild(recipeItem);
    });
}

window.addToMealPlan = function(name, id) {
    const mealPlan = document.getElementById('meal-plan');
    const recipeItem = document.createElement('div');
    recipeItem.className = 'recipe-item';
    recipeItem.innerHTML = `
        <span>${name}</span>
        <span class="hidden-id">${id}</span>
        <button class="icon-button" onclick="removeFromMealPlan(this)"><img src="../icons/delete.png" alt="Remove From Meal Plan"></button>
    `;
    mealPlan.appendChild(recipeItem);
}

window.removeFromMealPlan = function(button) {
    const recipeItem = button.parentElement;
    recipeItem.remove();
}

window.randomRecipe = async function() {
    const recipesSnapshot = await getDocsFromServer(query(recipesCol));
    const allRecipes = [];
    recipesSnapshot.forEach(doc => {
        const recipe = doc.data();
        allRecipes.push({ name: recipe.name, id: doc.id });
    });
    const mealPlan = document.getElementById('meal-plan');
    const currentRecipeIds = Array.from(mealPlan.children).map(item => item.querySelector('.hidden-id').innerText);
    const availableRecipes = allRecipes.filter(recipe => !currentRecipeIds.includes(recipe.id));

    console.log('Current Recipe IDs:', currentRecipeIds);
    console.log('Available Recipes:', availableRecipes);

    if (availableRecipes.length > 0) {
        const randomRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
        addToMealPlan(randomRecipe.name, randomRecipe.id);
    }
    else
    {
        alert('No more unique recipes to add! You must be hungry!🫃');
    }
}

window.confirmMealPlan = async function() {
    const mealPlan = document.getElementById('meal-plan');
    const recipeItems = Array.from(mealPlan.children);
    const recipeIds = recipeItems.map(item => item.querySelector('.hidden-id').innerText);

    let ingredients = [];
    for (const id of recipeIds) {
        // Fetch each recipe's ingredients
        const recipeDoc = await getDoc(doc(db, 'recipes', id));
        if (recipeDoc.exists()) {
            const data = recipeDoc.data();
            if (Array.isArray(data.ingredients)) {
                ingredients.push(...data.ingredients);
            }
        }
    }
    // Sort alphabetically but keep duplicates
    ingredients = ingredients.sort((a, b) => a.localeCompare(b));

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

    const shoppingListPage = document.createElement('div');
    shoppingListPage.id = 'shopping-list-page';
    shoppingListPage.innerHTML = `
        <h1>Shopping List</h1>
        <ul id="shopping-list">
            ${ingredients.map((ingredient) => `<li onclick="toggleStrikethrough(this)">${ingredient}</li>`).join('')}
            ${customItems.map((item) => `<li class="custom-item" onclick="toggleStrikethrough(this)">${item}</li>`).join('')}
        </ul>
        <input type="text" id="custom-item-input" placeholder="Add custom item..." />
        <button onclick="addCustomShoppingItem()">Add Item</button>
        <button onclick="goBackToMealPlanner()">Back to Meal Planner</button>
    `;
    document.body.innerHTML = '';
    document.body.appendChild(shoppingListPage);

    // Attach handler for adding custom items
    window.addCustomShoppingItem = function() {
        const input = document.getElementById('custom-item-input');
        const value = input.value.trim();
        if (!value) return;
        const ul = document.getElementById('shopping-list');
        const li = document.createElement('li');
        li.textContent = value;
        li.className = 'custom-item';
        li.onclick = function() { window.toggleStrikethrough(li); };
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

    // Update toggleStrikethrough to remove custom items if striked out
    window.toggleStrikethrough = function(element) {
        const parent = element.parentElement;
        if (element.style.textDecoration === 'line-through') {
            element.style.textDecoration = 'none';
            parent.insertBefore(element, parent.firstChild);
        } else {
            element.style.textDecoration = 'line-through';
            parent.appendChild(element);
            // If it's a custom item, remove from list and Firestore
            if (element.classList.contains('custom-item')) {
                const itemText = element.textContent;
                window._customShoppingItems = (window._customShoppingItems || []).filter(i => i !== itemText);
                element.remove();
                // Update Firestore
                if (currentUsername) {
                    setDoc(doc(db, 'mealPlans', currentUsername), {
                        username: currentUsername,
                        recipeIds: recipeIds,
                        customItems: window._customShoppingItems,
                        timestamp: new Date()
                    });
                }
            }
        }
    };
}

// Add a function to load the user's last meal plan
window.loadUserMealPlan = async function() {
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

window.toggleStrikethrough = function(element) {
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

window.goBackToMealPlanner = function() {
    location.reload();
}

// Remove old loginResolve/loginPromise and keep only loadMealplanResolve/loadMealplanPromise
let loadMealplanResolve;
let loadMealplanPromise = new Promise(resolve => { loadMealplanResolve = resolve; });

// Only keep this version of loginWithUsername
window.loginWithUsername = async function() {
    const usernameInput = document.getElementById('username-input');
    const username = usernameInput.value.trim();
    if (!username) {
        alert("Mealplan name is required!");
        return;
    }
    currentUsername = username;
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = '';
    document.getElementById('confirm-btn').style.display = '';
    loadMealplanResolve();
    await fetchRecipes();
    await window.loadUserMealPlan();
};

// Only keep this version of promptForUsernameAndLogin
async function promptForUsernameAndLogin() {
    document.getElementById('login-section').style.display = '';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('confirm-btn').style.display = 'none';
    await loadMealplanPromise;
}

onAuthStateChanged(auth, async (user) => {
    // Remove all logic that depends on user auth for meal plan
    currentUser = user;
    // Always show load mealplan prompt on page load
    currentUsername = null;
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('confirm-btn').style.display = 'none';
    document.getElementById('login-section').style.display = '';
});