import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

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
        optionsCell.innerHTML = `
        <div class="button-container">
        <button class="icon-button" onclick="modifyRecipe('${doc.id}')"><img src="../../icons/edit.png" alt="Edit the recipe"></button>
        <button class="icon-button" onclick="deleteRecipe('${doc.id}','${recipe.name}')"><img src="../../icons/delete.png" alt="Delete the recipe"></button>
        </div>
        `;
    });
}

window.loadRecipeBook = loadRecipeBook;
loadRecipeBook();

window.openPopup = function () {
    const modal = document.getElementById('modify-recipe-modal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error('Modal element not found');
    }
}

window.closePopup = function () {
    const modal = document.getElementById('modify-recipe-modal');
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error('Modal element not found');
    }
}

window.openRecipePopup = async function (recipeId = null) {
    const titleElement = document.getElementById('popup-title');
    const formElement = document.getElementById('modify-recipe-form');
    const ingredientsList = document.getElementById('ingredients-list');
    const instructionsList = document.getElementById('instructions-list');

    if (titleElement && formElement && ingredientsList && instructionsList) {
        formElement.reset();
        ingredientsList.innerHTML = '';
        instructionsList.innerHTML = '';

        if (recipeId) {
            titleElement.textContent = 'Modify Recipe';
            const recipeData = await getRecipeData(recipeId);
            document.getElementById('recipe-id').value = recipeId;
            document.getElementById('recipe-name').value = recipeData.name;
            recipeData.ingredients.forEach(ingredient => {
                addListElement('ingredients-list', 'ingredients', ingredient);
            });
            recipeData.instructions.forEach(instruction => {
                addListElement('instructions-list', 'instructions', instruction);
            });
        } else {
            titleElement.textContent = 'Add Recipe';
        }

        openPopup();
    } else {
        console.error(`One or more elements not found ${titleElement} ${formElement} ${ingredientsList} ${instructionsList}`);
    }
};

window.addRecipe = function () {
    openRecipePopup();
};

window.modifyRecipe = function (recipeId) {
    openRecipePopup(recipeId);
};

window.addListElement = function (listId, elementType, value = '') {
    const list = document.getElementById(listId);
    if (list) {
        const div = document.createElement('div');
        div.classList.add('list-element');
        const input = document.createElement('input');
        input.type = 'text';
        input.name = elementType;
        input.value = value;
        const removeButton = document.createElement('button');
        removeButton.classList.add('icon-button');
        removeButton.innerHTML = '<img src="../icons/delete.png">';
        removeButton.onclick = function () {
            list.removeChild(div);
        };
        div.appendChild(input);
        div.appendChild(removeButton);

        list.appendChild(div);
    } else {
        console.error(`${listId} element not found`);
    }
};

window.addBlankIngredient = function (event) {
    event.preventDefault()
    addListElement('ingredients-list', 'ingredients');
};

window.addBlankInstruction = function (event) {
    event.preventDefault()
    addListElement('instructions-list', 'instructions');
};

window.saveRecipe = async function () {
    const recipeId = document.getElementById('recipe-id').value;
    const recipeName = document.getElementById('recipe-name').value;
    const ingredients = Array.from(document.getElementsByName('ingredients'))
        .map(input => input.value)
        .filter(value => value.trim() !== '');
    const instructions = Array.from(document.getElementsByName('instructions'))
        .map(input => input.value)
        .filter(value => value.trim() !== '');

    const recipeData = { name: recipeName, ingredients, instructions };

    if (recipeId) {
        await setDoc(doc(db, "recipes", recipeId), recipeData);
    } else {
        await setDoc(doc(collection(db, "recipes")), recipeData);
    }

    closePopup();
    loadRecipeBook();
};

window.deleteRecipe = async function (recipeId, recipeName) {
    if (confirm(`Are you sure you want to delete ${recipeName}?`)) {
        await deleteDoc(doc(db, "recipes", recipeId));
        loadRecipeBook();
    }
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