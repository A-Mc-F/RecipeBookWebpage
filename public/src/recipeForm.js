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

    // Try JSON-LD first (structured data)
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

    // WP Recipe Maker specific: prefer <ul class="wprm-recipe-ingredients"> when present
    try {
        const wprmIngUl = doc.querySelector('ul.wprm-recipe-ingredients');
        if (wprmIngUl) {
            const ingredients = Array.from(wprmIngUl.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean);
            const wprmInstEl = doc.querySelector('.wprm-recipe-instructions') || doc.querySelector('.wprm-recipe-instructions-wrapper');
            let instructions = [];
            if (wprmInstEl) {
                instructions = Array.from(wprmInstEl.querySelectorAll('li, p')).map(el => el.textContent.trim()).filter(Boolean);
            }
            const name = (doc.querySelector('.wprm-recipe-name') || doc.querySelector('h1') || doc.querySelector('title'))?.textContent?.trim() || '';
            return { name, ingredients, instructions };
        }
    } catch (e) {
        // ignore WPRM-specific extraction errors and continue
    }

    // Helper: find section by heading text and collect following list/paragraph items
    function collectSectionByHeading(regex) {
        const headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5'));
        for (const h of headings) {
            if (regex.test(h.textContent || '')) {
                // Prefer a following UL/OL
                let el = h.nextElementSibling;
                const items = [];
                const seen = new Set();
                while (el && !/^H[1-5]$/i.test(el.tagName)) {
                    if (el.tagName.toLowerCase() === 'ul' || el.tagName.toLowerCase() === 'ol') {
                        for (const li of Array.from(el.querySelectorAll('li'))) {
                            const txt = li.textContent.trim();
                            if (txt && !seen.has(txt)) { items.push(txt); seen.add(txt); }
                        }
                        if (items.length) return items;
                    }
                    // Sometimes ingredients are in multiple <p> tags or <div> with bullets
                    if (el.tagName.toLowerCase() === 'p') {
                        const txt = el.textContent.trim();
                        if (txt && !seen.has(txt)) { items.push(txt); seen.add(txt); }
                    }
                    // If element contains list-like children
                    const nestedLis = el.querySelectorAll && el.querySelectorAll('li');
                    if (nestedLis && nestedLis.length) {
                        for (const li of Array.from(nestedLis)) {
                            const txt = li.textContent.trim();
                            if (txt && !seen.has(txt)) { items.push(txt); seen.add(txt); }
                        }
                        if (items.length) return items;
                    }
                    el = el.nextElementSibling;
                }
            }
        }
        return null;
    }

    // Try targeted heading-based extraction first
    let ingredients = collectSectionByHeading(/ingredient/i) || [];
    let instructions = collectSectionByHeading(/instruction|direction|method|prepar|step|how to/i) || [];

    // Fallbacks: itemprop or class-based selectors
    if (ingredients.length === 0) {
        const ingredientEls = doc.querySelectorAll('[class*=ingredient], [itemprop*=ingredient]');
        for (const el of ingredientEls) {
            const txt = el.textContent.trim();
            if (txt && !ingredients.includes(txt)) ingredients.push(txt);
        }
    }
    if (instructions.length === 0) {
        const instrEls = doc.querySelectorAll('[class*=instruction], [itemprop*=recipeInstructions], .steps, .method');
        for (const el of instrEls) {
            const txt = el.textContent.trim();
            if (txt && !instructions.includes(txt)) instructions.push(txt);
        }
    }

    // Broad fallback: avoid grabbing every <li> on the page; only use li if it appears under a container with "recipe" or "ingredient" in class or within a <article>
    if (ingredients.length === 0) {
        const candidateLis = Array.from(doc.querySelectorAll('article li, [class*=recipe] li, [class*=ingredient] li'));
        for (const li of candidateLis) {
            const txt = li.textContent.trim();
            if (txt && !ingredients.includes(txt)) ingredients.push(txt);
        }
    }

    const title = (doc.querySelector('h1') || doc.querySelector('title'))?.textContent?.trim() || '';

    if (!title && ingredients.length === 0 && instructions.length === 0) return null;
    return { name: title, ingredients, instructions };
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
