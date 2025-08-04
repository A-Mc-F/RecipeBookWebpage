import { collection, doc, setDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";
import { database } from "../../src/firestoreConnection.js";

/**
 * @typedef {Object} MealplanItem
 * @property {'day'|'meal'|'recipe'|'other'|'misc_group'|'misc'} type
 * @property {string} [name]         // For 'day', 'meal', 'misc_group'
 * @property {string} [recipeId]     // For 'recipe'
 * @property {MealplanItem[]} [items]// For 'day', 'meal', 'misc_group'
 */

/**
 * @typedef {Object} Mealplan
 * @property {string} name
 * @property {'mealplan'} type
 * @property {MealplanItem[]} items
 */


// --- Meal plan change listener ---
let onMealplanChange = null;
export function setMealplanChangeListener(cb) { onMealplanChange = cb; }
function notifyChange() { if (onMealplanChange) onMealplanChange(mealplanData); }

let allRecipes = [];
let mealplanData = /** @type { Mealplan } */ ({ name: '', type: 'mealplan', items: [] });
let mealplanName = null;

// --- Fetch all recipes from Firestore ---
async function fetchAllRecipes() {
    const recipesCol = collection(database, 'recipes');
    const recipesSnapshot = await getDocs(recipesCol);
    allRecipes = recipesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
await fetchAllRecipes();

export function getAllRecipes() {
    return allRecipes;
}

export function getRecipeByID(id) {
    return allRecipes.find(recipe => recipe.id === id);
}

export function getMealplanName() {
    return mealplanName;
}

export function setMealplanName(name) {
    mealplanName = name;
    loadMealplanFromFirestore();
}

export function getMealplanData() {
    return mealplanData;
}

async function saveMealplanToFirestore() {
    if (!mealplanName) return;
    await setDoc(doc(database, 'mealplans', mealplanName), {
        mealplan: mealplanData,
        timestamp: new Date()
    });
}

async function loadMealplanFromFirestore() {
    if (!mealplanName) return;
    const mealplanDoc = await getDoc(doc(database, 'mealplans', mealplanName));
    if (mealplanDoc.exists()) {
        mealplanData = mealplanDoc.data().mealplan;
    } else {
        mealplanData = { name: mealplanName, type: 'mealplan', items: [] }; // Initialize with empty structure
    }
    notifyChange();
}

// --- Centralized mutation helpers ---

//CREATE
export function addMealplanItem(container, item) {
    container.items.push(item);
    saveMealplanToFirestore();
    notifyChange();
}

//READ
export function getMealplanItem(searchItemType, searchItemName) {
    function bfs(item) {
        const queue = [item];
        while (queue.length > 0) {
            const parentItem = queue.shift();
            for (let i = 0; i < parentItem.items.length; i++) {
                const childItem = parentItem.items[i];
                if (childItem.type === searchItemType && childItem.name === searchItemName) {
                    return {
                        item: childItem,
                        parent: parentItem,
                        index: i
                    }
                }
                if (childItem.items) {
                    queue.push(childItem);
                }
            }
        }
        return {
            item: null,
            parent: null,
            index: null
        }
    }
    return bfs(getMealplanData());
}

export function getMealplanItemParent(searchItem) {
    function bfs(item) {
        const queue = [item];
        while (queue.length > 0) {
            const parentItem = queue.shift();
            for (let i = 0; i < parentItem.items.length; i++) {
                const childItem = parentItem.items[i];
                if (childItem === searchItem) {
                    return {
                        parent: parentItem,
                        index: i
                    }
                }
                if (childItem.items) {
                    queue.push(childItem);
                }
            }
        }
        return {
            parent: null,
            index: null
        }
    }
    return bfs(getMealplanData());
}


//UPDATE
export function updateMealplanItem(item, newData) {
    let searchResult = getMealplanItemParent(item)
    searchResult.parent.items[searchResult.index] = { ...item, ...newData };
    saveMealplanToFirestore();
    notifyChange();
}

//DELETE
export function removeMealplanItem(item) {
    let searchResult = getMealplanItemParent(item)
    searchResult.parent.items.splice(searchResult.index, 1)
    saveMealplanToFirestore();
    notifyChange();
}

export function replaceMealplanItem(originalItem, newItem) {
    const searchResult = getMealplanItemParent(originalItem)
    removeMealplanItem(originalItem)
    searchResult.parent.items.splice(searchResult.index, 0, newItem)
    saveMealplanToFirestore()
    notifyChange()
}
