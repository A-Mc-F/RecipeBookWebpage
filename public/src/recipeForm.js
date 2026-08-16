import { getRecipeByID, addRecipe, fetchAllRecipes } from "./dataHandler.js";
import { renderRecipeBook } from "./recipeBookRenderer.js";
import { renderMealplan } from "./mealPlanRenderer.js";


document.getElementById('new-recipe-btn').addEventListener('click', function () {
    clearRecipeFormFields()
    document.getElementById('recipe-form').style.display = 'block'
});

//function to clear the fields in the modal
function clearRecipeFormFields() {
    document.getElementById('recipe-name').value = '';
    document.getElementById('recipe-ingredients').value = '';
    document.getElementById('recipe-instructions').value = '';
    // Add more fields here if your form has them
}

function fillRecipeFormFields(recipeId) {
    // Assuming you have a way to get the recipe data by ID, e.g., from a global array or API
    const recipe = getRecipeByID(recipeId); // Implement getRecipeById as needed
    if (recipe) {
        document.getElementById('recipe-name').value = recipe.name || '';
        document.getElementById('recipe-ingredients').value = recipe.ingredients || '';
        document.getElementById('recipe-instructions').value = recipe.instructions || '';
        // Add more fields here if your form has them
    }
}

async function fetchHtmlThroughProxy(url) {
    // Try AllOrigins first, then fallback to jina.ai text proxy
    const proxies = [
        (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
        (u) => `https://r.jina.ai/http://${u.replace(/^https?:\/\//, '')}`
    ];
    let lastErr = null;
    for (const p of proxies) {
        try {
            const urlToFetch = p(url);
            const resp = await fetch(urlToFetch);
            if (!resp.ok) throw new Error('Failed to fetch URL via proxy: ' + resp.status);
            const text = await resp.text();
            if (text && text.length > 0) return text;
        } catch (e) {
            lastErr = e;
            // try next proxy
        }
    }
    throw lastErr || new Error('All proxies failed');
}

function parseRecipeFromHtml(htmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const wprmIngredientEls = Array.from(
        doc.querySelectorAll('ul[class^="wprm"], ul[class*=" wprm"], li.wprm-recipe-ingredient')
    ).filter((el) => {
        const className = el.className || '';
        return typeof className === 'string' && className.includes('wprm');
    });

    const ingredients = wprmIngredientEls
        .map((ingredientEl) => {
            const amount = ingredientEl.querySelector('.wprm-recipe-ingredient-amount')?.textContent?.trim();
            const name = ingredientEl.querySelector('.wprm-recipe-ingredient-name')?.textContent?.trim();
            return [amount, name].filter(Boolean).join(' ') || null;
        })
        .filter(Boolean);

    const instructions = Array.from(
        doc.querySelectorAll('.wprm-recipe-instruction-text, .wprm-recipe-instructions li, .wprm-recipe-instructions p')
    )
        .map((el) => el.textContent.trim())
        .filter(Boolean);

    const name = doc.querySelector('.wprm-recipe-name')?.textContent?.trim() || '';

    if (!ingredients.length && !name && instructions.length === 0) {
        return null;
    }

    return { name, ingredients, instructions };
}

async function importRecipeFromUrl(url) {
    try {
        if (!url) throw new Error('No URL provided');
        const html = await fetchHtmlThroughProxy(url);
        const parsed = parseRecipeFromHtml(html);
        if (!parsed) throw new Error('No recipe data found on that page');
        // Populate form for user review
        document.getElementById('recipe-name').value = parsed.name || '';
        document.getElementById('recipe-ingredients').value = (parsed.ingredients || []).join('\n');
        document.getElementById('recipe-instructions').value = (parsed.instructions || []).join('\n');

        alert('Recipe imported into form. Review and click Done to save.');
    } catch (err) {
        console.error('Import error:', err);
        alert('Import failed: ' + err.message);
    }
}

// Wire import buttons
// Wire Import button: disable while importing and add visual throb
const importBtn = document.getElementById('import-btn');
let _isImporting = false;
importBtn.addEventListener('click', async () => {
    if (_isImporting) return;
    const url = document.getElementById('import-url').value.trim();
    if (!url) return alert('Please enter a URL to import from.');
    try {
        _isImporting = true;
        importBtn.disabled = true;
        importBtn.classList.add('importing');
        await importRecipeFromUrl(url);
    } finally {
        _isImporting = false;
        importBtn.disabled = false;
        importBtn.classList.remove('importing');
    }
});

async function submitRecipeForm() {
    const name = document.getElementById('recipe-name').value.trim();
    const ingredients = document.getElementById('recipe-ingredients').value
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const instructions = document.getElementById('recipe-instructions').value
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (!name || !ingredients || !instructions) {
        alert("Please fill in all fields.");
        return;
    }

    const recipe = {
        "name": name,
        "ingredients": ingredients,
        "instructions": instructions
        // Add more fields if needed
    };

    try {
        await addRecipe(recipe);
        alert("Recipe added successfully!");
        document.getElementById('recipe-form').style.display = 'none';
        clearRecipeFormFields();
    } catch (error) {
        alert("Error adding recipe: " + error.message);
    }

    await fetchAllRecipes()

    renderRecipeBook()
    renderMealplan()

}

document.getElementById('done-btn').addEventListener('click', submitRecipeForm);
