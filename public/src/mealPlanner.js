import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore";

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

async function fetchRecipes() {
    const recipesCol = collection(db, 'recipes');
    const recipesSnapshot = await getDocs(query(recipesCol, limit(8)));
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
    const recipesCol = collection(db, 'recipes');
    const recipesSnapshot = await getDocs(recipesCol);
    const allRecipes = [];
    recipesSnapshot.forEach(doc => {
        const recipe = doc.data();
        allRecipes.push({ name: recipe.name, id: doc.id });
    });
    const mealPlan = document.getElementById('meal-plan');
    const currentRecipes = Array.from(mealPlan.children).map(item => item.querySelector('span').innerText);
    const availableRecipes = allRecipes.filter(recipe => !currentRecipes.includes(recipe.name));
    if (availableRecipes.length > 0) {
        const randomRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
        addToMealPlan(randomRecipe.name, randomRecipe.id);
    }
}

window.confirmMealPlan = function() {
    const mealPlan = document.getElementById('meal-plan');
    const recipeItems = Array.from(mealPlan.children);
    const recipeIds = recipeItems.map(item => item.querySelector('.hidden-id').innerText);
    console.log(recipeIds);
}

document.addEventListener('DOMContentLoaded', fetchRecipes);
