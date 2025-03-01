import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, getDoc, setDoc } from "firebase/firestore";

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

async function loadRecipeBook() {
    const recipesQuery = collection(db, 'recipes');
    const recipesCollection = await getDocs(recipesQuery);
    const recipeTableBody = document.getElementById('recipe-table').getElementsByTagName('tbody')[0];
    recipeTableBody.innerHTML = ''; // Clear existing table rows

    recipesCollection.forEach((doc) => {
        const recipe = doc.data();
        const row = recipeTableBody.insertRow();

        const titleCell = row.insertCell(0);
        const optionsCell = row.insertCell(1);

        titleCell.textContent = recipe.name;
        optionsCell.innerHTML = `<div class="button-container"><button class="icon-button" onclick="modifyRecipe('${doc.id}')"><img src="../icons/edit.png" alt="Edit the recipe"></button><button class="icon-button" onclick="deleteRecipe('${doc.id}')"><img src="../icons/delete.png" alt="Delete the recipe"></button></div>`;
    });
}

window.loadRecipeBook = loadRecipeBook;
loadRecipeBook();

window.openPopup = function() {
    const modal = document.getElementById('modify-recipe-modal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error('Modal element not found');
    }
}

window.closePopup = function() {
    const modal = document.getElementById('modify-recipe-modal');
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error('Modal element not found');
    }
}

window.addRecipe = function() {
    const titleElement = document.getElementById('popup-title');
    const formElement = document.getElementById('modify-recipe-form');
    const ingredientsList = document.getElementById('ingredients-list');
    const instructionsList = document.getElementById('instructions-list');

    if (titleElement && formElement && ingredientsList && instructionsList) {
        titleElement.textContent = 'Add Recipe';
        formElement.reset();
        ingredientsList.innerHTML = '<input type="text" name="ingredients">';
        instructionsList.innerHTML = '<input type="text" name="instructions">';
        openPopup();
    } else {
        console.error(`One or more elements not found ${titleElement} ${formElement} ${ingredientsList} ${instructionsList}`);
    }
};

window.modifyRecipe = async function (recipeId) {
    const titleElement = document.getElementById('popup-title');
    const recipeNameElement = document.getElementById('recipe-name');
    const ingredientsList = document.getElementById('ingredients-list');
    const instructionsList = document.getElementById('instructions-list');

    if (titleElement && recipeNameElement && ingredientsList && instructionsList) {
        titleElement.textContent = 'Modify Recipe';
        const recipeData = await getRecipeData(recipeId);
        recipeNameElement.value = recipeData.name;
        ingredientsList.innerHTML = '';
        recipeData.ingredients.forEach(ingredient => {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = 'ingredients';
            input.value = ingredient;
            ingredientsList.appendChild(input);
        });
        instructionsList.innerHTML = '';
        recipeData.instructions.forEach(instruction => {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = 'instructions';
            input.value = instruction;
            instructionsList.appendChild(input);
        });
        openPopup();
    } else {
        console.error(`One or more elements not found ${titleElement} ${recipeNameElement} ${ingredientsList} ${instructionsList}`);
    }
};

window.deleteRecipe = async function(recipeId) {
    if (confirm(`Are you sure you want to delete ${recipeId}?`)) {
        await deleteDoc(doc(db, "recipes", recipeId));
        loadRecipeBook();
    }
};

window.addIngredient = function() {
    const ingredientsList = document.getElementById('ingredients-list');
    if (ingredientsList) {
        const ingredientDiv = document.createElement('div');
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'ingredients';
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = 'Remove';
        removeButton.onclick = function() {
            ingredientsList.removeChild(ingredientDiv);
        };
        ingredientDiv.appendChild(input);
        ingredientDiv.appendChild(removeButton);
        ingredientsList.appendChild(ingredientDiv);
    } else {
        console.error('Ingredients list element not found');
    }
};

window.addInstruction = function() {
    const instructionsList = document.getElementById('instructions-list');
    if (instructionsList) {
        const instructionDiv = document.createElement('div');
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'instructions';
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = 'Remove';
        removeButton.onclick = function() {
            instructionsList.removeChild(instructionDiv);
        };
        instructionDiv.appendChild(input);
        instructionDiv.appendChild(removeButton);
        instructionsList.appendChild(instructionDiv);
    } else {
        console.error('Instructions list element not found');
    }
};

window.saveRecipe = async function() {
    const recipeName = document.getElementById('recipe-name').value;
    const ingredients = Array.from(document.getElementsByName('ingredients'))
        .map(input => input.value)
        .filter(value => value.trim() !== '');
    const instructions = Array.from(document.getElementsByName('instructions'))
        .map(input => input.value)
        .filter(value => value.trim() !== '');

    const recipeId = new URLSearchParams(window.location.search).get('id');
    const recipeData = { name: recipeName, ingredients, instructions };

    if (recipeId) {
        await setDoc(doc(db, "recipes", recipeId), recipeData);
    } else {
        await setDoc(doc(collection(db, "recipes")), recipeData);
    }

    closePopup();
    loadRecipeBook();
};

async function getRecipeData(recipeId) {
    const recipeDoc = await getDoc(doc(db, "recipes", recipeId));
    if (recipeDoc.exists()) {
        return recipeDoc.data();
    } else {
        alert("Recipe not found!");
        return null;
    }
}