import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit, getDoc, doc, getDocsFromServer } from "firebase/firestore";
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
const recipesCol = collection(db, 'recipes');


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

    const ingredients = [];
    for (const id of recipeIds) {
        const docRef = doc(db, 'recipes', id).withConverter(recipeConverter);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const recipe = docSnap.data();
            if (recipe.ingredients) {
                recipe.ingredients.forEach(ingredient => {
                    ingredients.push(`${ingredient} - ${recipe.name}`);
                });
            }
        }
    }

    const shoppingListPage = document.createElement('div');
    shoppingListPage.id = 'shopping-list-page';
    shoppingListPage.innerHTML = `
        <h1>Shopping List</h1>
        <ul id="shopping-list">
            ${ingredients.map((ingredient) => `<li onclick="toggleStrikethrough(this)">${ingredient}</li>`).join('')}
        </ul>
        <button onclick="goBackToMealPlanner()">Back to Meal Planner</button>
    `;
    document.body.innerHTML = '';
    document.body.appendChild(shoppingListPage);
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

document.addEventListener('DOMContentLoaded', fetchRecipes);