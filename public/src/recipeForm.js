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

function findRecipeObject(value) {
    if (!value || typeof value !== 'object') return null;

    if (Array.isArray(value)) {
        for (const item of value) {
            const match = findRecipeObject(item);
            if (match) return match;
        }
        return null;
    }

    if (value['@type'] === 'Recipe') {
        return value;
    }

    if (Array.isArray(value['@graph'])) {
        for (const item of value['@graph']) {
            const match = findRecipeObject(item);
            if (match) return match;
        }
    }

    return null;
}

function normalizeIngredient(item) {
    if (typeof item !== 'string') {
        item = item && typeof item === 'object' ? (item.text || item.name || '') : '';
    }

    let clean = String(item).replace(/\s+/g, ' ').trim();
    if (!clean) return '';

    clean = clean.replace(/^(?:-\s*|\*\s*|•\s*)/g, '');
    clean = clean.replace(/\s*[,;]\s*(?=(?:\d|[A-Za-z]))/g, ', ');
    clean = clean.replace(/\s*\(.*?\)\s*/g, ' ').trim();

    if (clean.length > 80) clean = clean.slice(0, 80).trim();

    // Split obvious multi-ingredient strings like "1 onion, 2 carrots, 1 tsp salt" into separate entries.
    const splitCandidates = clean.split(/\s*,\s*(?=(?:\d+\s+|\d+\.?\d*\s*|[A-Za-z]))/);
    const parts = splitCandidates
        .map(part => part.replace(/\s+/g, ' ').trim())
        .filter(part => part && part.length > 1);

    return parts.length > 1 ? parts : [clean].filter(Boolean);
}

function normalizeInstructions(value) {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === 'string') return item.trim();
                if (item && typeof item === 'object') {
                    if (typeof item.text === 'string') return item.text.trim();
                    if (typeof item.name === 'string') return item.name.trim();
                }
                return '';
            })
            .filter(Boolean)
            .map((text) => text.replace(/\s+/g, ' ').trim())
            .filter((text) => text.length > 0);
    }

    if (typeof value === 'string') return [value.replace(/\s+/g, ' ').trim()].filter(Boolean);

    if (typeof value === 'object') {
        if (typeof value.text === 'string') return [value.text.replace(/\s+/g, ' ').trim()].filter(Boolean);
        if (typeof value.name === 'string') return [value.name.replace(/\s+/g, ' ').trim()].filter(Boolean);
    }

    return [];
}

function parseRecipeFromHtml(htmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const jsonLdScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));

    for (const script of jsonLdScripts) {
        try {
            const parsedJson = JSON.parse(script.textContent || '');
            const recipe = findRecipeObject(parsedJson);
            if (!recipe) continue;

            const name = typeof recipe.name === 'string' ? recipe.name.trim() : '';
            const ingredientList = Array.isArray(recipe.recipeIngredient)
                ? recipe.recipeIngredient.flatMap((item) => normalizeIngredient(item))
                : [];
            const instructions = normalizeInstructions(recipe.recipeInstructions);

            if (!name && ingredientList.length === 0 && instructions.length === 0) continue;

            return { name, ingredients: ingredientList, instructions };
        } catch (e) {
            // Ignore malformed JSON-LD blocks and continue to the next script.
        }
    }

    return null;
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
