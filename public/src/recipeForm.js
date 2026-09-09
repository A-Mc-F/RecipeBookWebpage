import { addRecipe, fetchAllRecipes } from "./dataHandler.js";
import { renderRecipeBook } from "./recipeBookRenderer.js";
import { renderMealplan } from "./mealPlanRenderer.js";


document.getElementById('new-recipe-btn').addEventListener('click', function () {
    clearRecipeFormFields()
    document.getElementById('recipe-form').style.display = 'block'
});

const recipeModal = document.getElementById('recipe-form');
const recipeModalClose = document.getElementById('recipe-modal-close');

recipeModalClose.addEventListener('click', () => {
    recipeModal.style.display = 'none';
});

recipeModal.addEventListener('click', (event) => {
    if (event.target === recipeModal) recipeModal.style.display = 'none';
});

//function to clear the fields in the modal
function clearRecipeFormFields() {
    document.getElementById('recipe-name').value = '';
    document.getElementById('recipe-ingredients').value = '';
    document.getElementById('recipe-instructions').value = '';
    // Add more fields here if your form has them
}

async function fetchHtmlThroughProxy(url) {
    // Jina's HTML mode preserves the recipe card and is CORS-readable.
    const proxies = [
        {
            url: (u) => `https://r.jina.ai/http://${u.replace(/^https?:\/\//, '')}`,
            options: { headers: { 'x-respond-with': 'html' } }
        },
        (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    ];
    let lastErr = null;
    for (const p of proxies) {
        try {
            const proxy = typeof p === 'function' ? { url: p(url) } : { ...p, url: p.url(url) };
            const resp = await fetch(proxy.url, proxy.options);
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

function getRecipePrintUrl(url) {
    const parsedUrl = new URL(url);
    const slug = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');
    if (!slug || slug.startsWith('wprm_print/')) return url;
    return `${parsedUrl.origin}/wprm_print/${slug}`;
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

    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (types.includes('Recipe')) {
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
    clean = clean.replace(/\s*\([^)]*\)/g, '');
    clean = clean.replace(/\s*,\s*(?:cut|chopped|sliced|diced|minced|trimmed|peeled|cored|deseeded|separated|softened|melted|divided|to serve|for serving|optional)\b.*$/i, '');
    clean = clean.replace(/\s*,\s*(?:or|plus)\s+(?:any|other|regular|low|high|fresh|frozen)\b.*$/i, '');
    return [clean.replace(/\s+/g, ' ').replace(/\s+,/g, ',').trim()].filter(Boolean);
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
                    if (Array.isArray(item.itemListElement)) {
                        return normalizeInstructions(item.itemListElement).join(' ');
                    }
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

            return {
                name,
                ingredients: ingredientList,
                instructions
            };
        } catch (e) {
            // Ignore malformed JSON-LD blocks and continue to the next script.
        }
    }

    const name = doc.querySelector('.wprm-recipe-name')?.textContent.trim() ||
        doc.querySelector('title')?.textContent.replace(/\s+-\s+RecipeTin Eats.*$/i, '').trim() || '';
    const ingredients = Array.from(doc.querySelectorAll('.wprm-recipe-ingredient'))
        .map((item) => normalizeIngredient(item.textContent))
        .flat();
    const instructions = Array.from(doc.querySelectorAll('.wprm-recipe-instruction'))
        .map((item) => item.textContent.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    if (name && ingredients.length > 0 && instructions.length > 0) {
        return { name, ingredients, instructions };
    }

    return null;
}

async function importRecipeFromUrl(url) {
    try {
        if (!url) throw new Error('No URL provided');
        let html;
        let parsed;
        try {
            html = await fetchHtmlThroughProxy(getRecipePrintUrl(url));
            parsed = parseRecipeFromHtml(html);
            if (!parsed) throw new Error('Print recipe data not found');
        } catch (printError) {
            html = await fetchHtmlThroughProxy(url);
            parsed = parseRecipeFromHtml(html);
        }
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

    if (!name || ingredients.length === 0 || instructions.length === 0) {
        alert("Please fill in all fields.");
        return;
    }

    const recipe = {
        "name": name,
        "ingredients": ingredients,
        "instructions": instructions,
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
