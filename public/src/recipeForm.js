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

function parseRecipeFromText(text) {
    const result = { name: '', ingredients: [], instructions: [] };
    // Title
    const titleMatch = text.match(/^Title:\s*(.+)$/m);
    if (titleMatch) result.name = titleMatch[1].trim();

    // Ingredients section
    const ingStart = text.search(/## Ingredients/i);
    const howStart = text.search(/## How to make/i);
    if (ingStart >= 0) {
        const ingBlock = (howStart > ingStart) ? text.slice(ingStart, howStart) : text.slice(ingStart);
        const lines = ingBlock.split(/\r?\n/).map(s => s.trim());
        for (const line of lines) {
            if (/^[\*\-\u25A1\u25A0\u25CB\u25CF\d\.]/.test(line) || line.startsWith('*') || line.startsWith('▢')) {
                // clean leading bullets and emphasis
                const cleaned = line.replace(/^[\*\-\s▢▣\d\.]+/, '').replace(/\*\*/g, '').trim();
                if (cleaned.length > 0) result.ingredients.push(cleaned);
            }
        }
    }

    // Instructions section
    const instrStart = text.search(/## How to make/i);
    const serveStart = text.search(/## What to serve/i);
    if (instrStart >= 0) {
        const instrBlock = (serveStart > instrStart) ? text.slice(instrStart, serveStart) : text.slice(instrStart);
        // split on numbered lines or blank lines
        const parts = instrBlock.split(/\n\s*\d+\.|\n\s*\n/).map(s => s.replace(/^\d+\.|^\*+/, '').trim()).filter(Boolean);
        result.instructions = parts.map(s => s.replace(/\*\*/g, '').trim()).filter(Boolean);
    }
    // final cleanup
    if (!result.name) {
        const firstLine = text.split(/\r?\n/)[0];
        if (firstLine && firstLine.length < 120) result.name = firstLine.trim();
    }
    return result;
}

function parseRecipeFromHtml(htmlText) {
    // If the fetched text looks like plain markdown/text (jina.ai), parse it differently
    if (!/<html/i.test(htmlText) && /Title:\s*/i.test(htmlText)) {
        return parseRecipeFromText(htmlText);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // Try JSON-LD first
    const ldScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
    for (const s of ldScripts) {
        try {
            const json = JSON.parse(s.textContent);
            const candidates = Array.isArray(json) ? json : [json];
            for (const cand of candidates) {
                if (!cand) continue;
                if (cand['@type'] === 'Recipe' || (Array.isArray(cand['@type']) && cand['@type'].includes('Recipe'))) {
                    const name = cand.name || cand.headline || '';
                    const ingredients = cand.recipeIngredient || cand.ingredients || [];
                    let instructions = [];
                    if (cand.recipeInstructions) {
                        if (typeof cand.recipeInstructions === 'string') {
                            instructions = cand.recipeInstructions.split(/\n+/).map(s => s.trim()).filter(Boolean);
                        } else if (Array.isArray(cand.recipeInstructions)) {
                            instructions = cand.recipeInstructions.map(instr => {
                                if (typeof instr === 'string') return instr;
                                if (instr.text) return instr.text;
                                if (instr['@type'] === 'HowToStep' && instr.text) return instr.text;
                                return '';
                            }).filter(Boolean);
                        }
                    }
                    return { name, ingredients, instructions };
                }
            }
        } catch (e) {
            // ignore JSON parse errors
        }
    }

    // Fallback: look for typical selectors
    const title = (doc.querySelector('h1') || doc.querySelector('title'))?.textContent?.trim() || '';
    const ingredientEls = doc.querySelectorAll('[class*=ingredient], [itemprop*=ingredient], li');
    const ingredients = Array.from(ingredientEls).map(el => el.textContent.trim()).filter(Boolean);
    const instrEls = doc.querySelectorAll('[class*=instruction], [itemprop*=recipeInstructions], .steps, .method, p');
    const instructions = Array.from(instrEls).map(el => el.textContent.trim()).filter(Boolean).slice(0, 30);

    if (!title && ingredients.length === 0 && instructions.length === 0) return null;
    return { name: title, ingredients, instructions };
}

async function importRecipeFromUrl(url, addDirect = false) {
    try {
        if (!url) throw new Error('No URL provided');
        const html = await fetchHtmlThroughProxy(url);
        const parsed = parseRecipeFromHtml(html);
        if (!parsed) throw new Error('No recipe data found on that page');

        // Populate form
        document.getElementById('recipe-name').value = parsed.name || '';
        document.getElementById('recipe-ingredients').value = (parsed.ingredients || []).join('\n');
        document.getElementById('recipe-instructions').value = (parsed.instructions || []).join('\n');

        if (addDirect) {
            const recipe = { name: parsed.name || 'Imported Recipe', ingredients: parsed.ingredients || [], instructions: parsed.instructions || [] };
            await addRecipe(recipe);
            alert('Imported and added recipe successfully');
            document.getElementById('recipe-form').style.display = 'none';
            // refresh local cache and UI
            await fetchAllRecipes();
            renderRecipeBook();
            renderMealplan();
        } else {
            alert('Recipe imported into form. Review and click Done to save.');
        }
    } catch (err) {
        console.error('Import error:', err);
        alert('Import failed: ' + err.message);
    }
}

// Wire import buttons
document.getElementById('import-btn').addEventListener('click', () => {
    const url = document.getElementById('import-url').value.trim();
    importRecipeFromUrl(url, false);
});

document.getElementById('import-add-btn').addEventListener('click', () => {
    const url = document.getElementById('import-url').value.trim();
    importRecipeFromUrl(url, true);
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
