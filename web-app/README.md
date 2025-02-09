# Meal Planner Web Application

This is a web application for meal planning, converted from a C# desktop application.

## Directory Structure

- `public/`: Contains HTML, CSS, and client-side JavaScript files.
- `src/`: Contains server-side JavaScript files and database functionality.
- `package.json`: Contains project metadata and dependencies.

## How to Run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the application

```
npm start
```

Collecting workspace information

Sure, I'll provide the necessary HTML and JavaScript code to match the functionality and layouts defined in the `C-Sharp Code` folder. Here is the updated code for the web application:

###

index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Meal Planner</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1>Welcome to Meal Planner</h1>
    <nav>
      <ul>
        <li><a href="recipe-book.html">Recipe Book</a></li>
        <li><a href="meal-planner.html">Meal Planner</a></li>
      </ul>
    </nav>
  </body>
</html>
```

###

recipe-book.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Recipe Book</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1>Recipe Book</h1>
    <div>
      <button onclick="newRecipeBook()">New Recipe Book</button>
      <button onclick="loadRecipeBook()">Load Recipe Book</button>
      <button onclick="saveRecipeBook()">Save Recipe Book</button>
      <button onclick="importRecipe()">Import Online Recipe</button>
      <button onclick="addRecipe()">Add New Recipe</button>
      <button onclick="modifyRecipe()">Modify Recipe</button>
      <button onclick="removeRecipe()">Remove Recipe</button>
    </div>
    <label>Recipe List</label>
    <ul id="recipe-list"></ul>
    <textarea id="recipe-info" readonly>Recipe Information</textarea>
    <script src="recipeBook.js"></script>
  </body>
</html>
```

###

meal-planner.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Meal Planner</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1>Meal Planner</h1>
    <button onclick="selectRecipes()">Select My Own</button>
    <button onclick="generateRecipes()">Surprise Me!</button>
    <div class="panel" id="selected-recipes"></div>
    <label>Ingredients</label>
    <ul id="ingredients-list"></ul>
    <button onclick="acceptMealPlan()">Accept Meal Plan</button>
    <script src="mealPlanner.js"></script>
  </body>
</html>
```

###

select-recipes.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Select Recipes</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1>Select Recipes</h1>
    <ul id="recipe-selection-list"></ul>
    <button onclick="confirmSelection()">Confirm Selection</button>
    <script src="selectRecipes.js"></script>
  </body>
</html>
```

###

recipe-manager.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Recipe Manager</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1>Recipe Manager</h1>
    <form id="recipe-form">
      <label for="recipe-name">Name:</label>
      <input type="text" id="recipe-name" name="recipe-name" />
      <label for="difficulty">Difficulty:</label>
      <select id="difficulty" name="difficulty">
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>
      <label for="ingredients">Ingredients:</label>
      <textarea id="ingredients" name="ingredients"></textarea>
      <label for="instructions">Instructions:</label>
      <textarea id="instructions" name="instructions"></textarea>
      <label for="num-of-dishes">Number of Dishes:</label>
      <input type="number" id="num-of-dishes" name="num-of-dishes" />
      <label for="cooking-time">Cooking Time (minutes):</label>
      <input type="number" id="cooking-time" name="cooking-time" />
      <button type="button" onclick="confirmRecipe()">Confirm</button>
    </form>
    <script src="recipeManager.js"></script>
  </body>
</html>
```

###

recipe-import.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Import Recipe</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1>Import Recipe</h1>
    <form id="import-form">
      <label for="recipe-url">Recipe URL:</label>
      <input type="url" id="recipe-url" name="recipe-url" />
      <button type="button" onclick="importRecipe()">Import</button>
    </form>
    <script src="recipeImport.js"></script>
  </body>
</html>
```

###

servings-by-day.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Servings By Day</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1>Servings By Day</h1>
    <label id="recipe-name-label">Recipe Name</label>
    <label for="servings">Servings:</label>
    <input
      type="number"
      id="servings"
      name="servings"
      min="1"
      max="20"
      value="2"
    />
    <script src="servingsByDay.js"></script>
  </body>
</html>
```

###

styles.css

```css
body {
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
}

nav ul {
  list-style-type: none;
  padding: 0;
  text-align: center;
}

nav ul li {
  display: inline;
  margin: 0 10px;
}

.panel {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 10px 0;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

form label,
form input,
form select,
form textarea,
form button {
  margin: 5px 0;
}
```

###

app.js

```js
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the application
});
```

###

recipeBook.js

```js
function newRecipeBook() {
  // Implement new recipe book functionality
  alert("New Recipe Book");
}

function loadRecipeBook() {
  // Implement load recipe book functionality
  alert("Load Recipe Book");
}

function saveRecipeBook() {
  // Implement save recipe book functionality
  alert("Save Recipe Book");
}

function importRecipe() {
  // Implement import recipe functionality
  alert("Import Online Recipe");
}

function addRecipe() {
  // Implement add new recipe functionality
  alert("Add New Recipe");
}

function modifyRecipe() {
  // Implement modify recipe functionality
  alert("Modify Recipe");
}

function removeRecipe() {
  // Implement remove recipe functionality
  alert("Remove Recipe");
}
```

###

mealPlanner.js

```js
function selectRecipes() {
  // Implement select recipes functionality
  alert("Select My Own Recipes");
}

function generateRecipes() {
  // Implement generate recipes functionality
  alert("Surprise Me!");
}

function acceptMealPlan() {
  // Implement accept meal plan functionality
  alert("Accept Meal Plan");
}
```

###

selectRecipes.js

```js
function confirmSelection() {
  // Implement confirm selection functionality
  alert("Confirm Selection");
}
```

###

recipeManager.js

```js
function confirmRecipe() {
  // Implement confirm recipe functionality
  alert("Confirm Recipe");
}
```

###

recipeImport.js

```js
function importRecipe() {
  // Implement import recipe functionality
  alert("Import Recipe");
}
```

###

servingsByDay.js

```js
// Implement servings by day functionality if needed
```

###

database.js

```js
const recipes = [];

function getRecipes() {
  return recipes;
}

function addRecipe(title, ingredients, instructions) {
  recipes.push({ title, ingredients, instructions });
}

module.exports = { getRecipes, addRecipe };
```

###

package.json

```json
{
  "name": "meal-planner-web-app",
  "version": "1.0.0",
  "description": "A web application for meal planning",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js"
  },
  "dependencies": {
    "express": "^4.17.1",
    "mongodb": "^3.6.3"
  }
}
```

###

README.md

````md
# Meal Planner Web Application

This is a web application for meal planning, converted from a C# desktop application.

## Directory Structure

- `public/`: Contains HTML, CSS, and client-side JavaScript files.
- `src/`: Contains server-side JavaScript files and database functionality.
- `package.json`: Contains project metadata and dependencies.

## How to Run

1. Install dependencies:
   ```bash
   npm install
   ```
````

2. Start the application:

   ```bash
   npm start
   ```

3. Open `http://localhost:3000` in your web browser to access the application.

# application into a web application, we need to break down the requirements into several components: HTML files for the forms, JavaScript for client-side functionality, and a backend to handle data storage and retrieval. Below is a simplified structure for a recipe book web application.

### Project Structure

```
recipe-book-web-app/
│
├── index.html
├── add-recipe.html
├── view-recipes.html
├── styles.css
├── script.js
├── server.js
└── database.js
```

### 1. HTML Files

#### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="styles.css" />
    <title>Recipe Book</title>
  </head>
  <body>
    <h1>Welcome to the Recipe Book</h1>
    <nav>
      <a href="add-recipe.html">Add Recipe</a>
      <a href="view-recipes.html">View Recipes</a>
    </nav>
  </body>
</html>
```

#### `add-recipe.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="styles.css" />
    <title>Add Recipe</title>
  </head>
  <body>
    <h1>Add a New Recipe</h1>
    <form id="recipeForm">
      <label for="title">Recipe Title:</label>
      <input type="text" id="title" name="title" required />

      <label for="ingredients">Ingredients:</label>
      <textarea id="ingredients" name="ingredients" required></textarea>

      <label for="instructions">Instructions:</label>
      <textarea id="instructions" name="instructions" required></textarea>

      <button type="submit">Add Recipe</button>
    </form>
    <script src="script.js"></script>
  </body>
</html>
```

#### `view-recipes.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="styles.css" />
    <title>View Recipes</title>
  </head>
  <body>
    <h1>Recipe List</h1>
    <ul id="recipeList"></ul>
    <script src="script.js"></script>
  </body>
</html>
```

### 2. CSS File

#### `styles.css`

```css
body {
  font-family: Arial, sans-serif;
}

nav {
  margin-bottom: 20px;
}

nav a {
  margin-right: 15px;
}
```

### 3. JavaScript File

#### `script.js`

```javascript
document
  .getElementById("recipeForm")
  ?.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const ingredients = document.getElementById("ingredients").value;
    const instructions = document.getElementById("instructions").value;

    fetch("/add-recipe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, ingredients, instructions }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert("Recipe added successfully!");
        window.location.href = "view-recipes.html";
      })
      .catch((error) => console.error("Error:", error));
  });

function loadRecipes() {
  fetch("/get-recipes")
    .then((response) => response.json())
    .then((data) => {
      const recipeList = document.getElementById("recipeList");
      data.forEach((recipe) => {
        const li = document.createElement("li");
        li.textContent = `${recipe.title}: ${recipe.ingredients}`;
        recipeList.appendChild(li);
      });
    })
    .catch((error) => console.error("Error:", error));
}

document.addEventListener("DOMContentLoaded", loadRecipes);
```

### 4. Backend Code

#### `server.js`

```javascript
const express = require("express");
const bodyParser = require("body-parser");
const { getRecipes, addRecipe } = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/add-recipe", (req, res) => {
  const { title, ingredients, instructions } = req.body;
  addRecipe(title, ingredients, instructions);
  res.json({ message: "Recipe added" });
});

app.get("/get-recipes", (req, res) => {
  const recipes = getRecipes();
  res.json(recipes);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

#### `database.js`

```javascript
let recipes = [];

function getRecipes() {
  return recipes;
}

function addRecipe(title, ingredients, instructions) {
  recipes.push({ title, ingredients, instructions });
}

module.exports = { getRecipes, addRecipe };
```

### Instructions to Run the Application

1. **Install Node.js**: Make sure you have Node.js installed on your machine.
2. **Create the Project Structure**: Create the folders and files as shown above.
3. **Install Express**: Run `npm init -y` and then `npm install express body-parser`.
4. **Run the Server**: In the terminal, navigate to the project directory and run `node server.js`.
5. **Access the Application**: Open your web browser and go to `http://localhost:3000`.

### Note

This is a basic implementation. In a production environment, you would want to use a proper database (like MongoDB, PostgreSQL, etc.) instead of an in-memory array for storing recipes. Additionally, you would implement error handling, input validation, and possibly user authentication.
