import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB7fE3GsZIxyfE7twzsUnycLCk4tx0xzU4",
    authDomain: "mealplanner-e91be.firebaseapp.com",
    projectId: "mealplanner-e91be",
    storageBucket: "mealplanner-e91be.firebasestorage.app",
    messagingSenderId: "46200749310",
    appId: "1:46200749310:web:9a99f7d4e6d225ccff39af"
};

const app = initializeApp(firebaseConfig);
const database = getFirestore(app);





import { collection, doc, setDoc, getDocs, getDoc, addDoc, deleteDoc, onSnapshot, updateDoc, runTransaction } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

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


// --- Meal plan change listeners (support multiple listeners) ---
let onMealplanChange = [];
export function setMealplanChangeListener(cb) {
    if (typeof cb === 'function') onMealplanChange.push(cb);
}
function notifyChange() {
    try {
        onMealplanChange.forEach(cb => {
            try { cb(mealplanData); } catch (e) { console.error('mealplan listener error', e); }
        });
    } catch (e) {
        console.error('notifyChange error', e);
    }
}

let allRecipes = [];
let mealplanData = /** @type { Mealplan } */ ({ name: '', type: 'mealplan', items: [] });
let mealplanName = null;
let mealplanUnsubscribe = null;
let shoppingChecks = {};
let shoppingChecksUnsubscribe = null;

// --- Fetch all recipes from Firestore ---
export async function fetchAllRecipes() {
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

export function addRecipe(recipe) {
    const recipesCol = collection(database, 'recipes');
    return addDoc(recipesCol, recipe);
}

export function updateRecipe(id, updatedData) {
    const recipeDoc = doc(database, 'recipes', id);
    return setDoc(recipeDoc, updatedData, { merge: true });
}

export function deleteRecipe(id) {
    const recipeDoc = doc(database, 'recipes', id);
    return deleteDoc(recipeDoc);
}




export function getMealplanName() {
    return mealplanName;
}

export function setMealplanName(name) {
    const nextName = String(name ?? '').trim();
    if (!nextName) {
        mealplanName = null;
        mealplanData = { name: '', type: 'mealplan', items: [] };
        shoppingChecks = {};
        notifyChange();
        return;
    }

    // Unsubscribe from any previous mealplan
    if (mealplanUnsubscribe) {
        mealplanUnsubscribe();
        mealplanUnsubscribe = null;
    }

    mealplanName = nextName;

    // Start a real-time listener on the mealplan document so multiple users
    // opening the same "codeword" (document id) see live updates.
    const mealplanDocRef = doc(database, 'mealplans', mealplanName);
    mealplanUnsubscribe = onSnapshot(mealplanDocRef, (snapshot) => {
        const previousMealplan = mealplanData && typeof mealplanData === 'object' ? mealplanData : null;

        if (snapshot.exists()) {
            const data = snapshot.data();
            shoppingChecks = data && data.checks ? data.checks : (previousMealplan ? shoppingChecks : {});

            if (data && data.mealplan && typeof data.mealplan === 'object') {
                mealplanData = data.mealplan;
            } else if (!previousMealplan || !Array.isArray(previousMealplan.items)) {
                mealplanData = { name: mealplanName, type: 'mealplan', items: [] };
            }
        } else {
            mealplanData = { name: mealplanName, type: 'mealplan', items: [] };
            shoppingChecks = {};
        }
        notifyChange();
    }, (error) => {
        console.error('Mealplan listener error:', error);
    });
}

export function getMealplanData() {
    return mealplanData;
}

export function getShoppingChecks() {
    if (mealplanName) return shoppingChecks;
    // Fallback to localStorage when not joined to a mealplan
    try {
        const raw = localStorage.getItem('shoppingChecks');
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

export async function updateShoppingCheck(key, value) {
    // Update local copy first so the current tab reflects the new item state immediately.
    shoppingChecks = shoppingChecks || {};
    shoppingChecks[key] = !!value;
    notifyChange();

    if (!mealplanName) {
        // If not joined to a mealplan, persist to localStorage for single-user use
        try {
            localStorage.setItem('shoppingChecks', JSON.stringify(shoppingChecks));
        } catch (e) { /* ignore */ }
        return;
    }

    const mealplanPayload = (mealplanData && mealplanData.type === 'mealplan')
        ? mealplanData
        : { name: mealplanName, type: 'mealplan', items: [] };

    const ref = doc(database, 'mealplans', mealplanName);
    try {
        const payload = { mealplan: mealplanPayload, checks: shoppingChecks, timestamp: new Date() };
        await setDoc(ref, payload, { merge: true });
    } catch (e) {
        console.error('Failed to persist shopping checks:', e);
    }
}

// --- Transactional helpers for finer-grained operations ---
async function saveMealplanPatch(patchFn) {
    if (!mealplanName) return;
    const ref = doc(database, 'mealplans', mealplanName);
    try {
        await runTransaction(database, async (transaction) => {
            const snap = await transaction.get(ref);
            const serverMealplan = (snap.exists() && snap.data().mealplan) ? snap.data().mealplan : { name: mealplanName, type: 'mealplan', items: [] };
            const serverChecks = (snap.exists() && snap.data().checks) ? snap.data().checks : shoppingChecks;
            const newMealplan = patchFn(JSON.parse(JSON.stringify(serverMealplan)));
            transaction.set(ref, { mealplan: newMealplan, checks: serverChecks, timestamp: new Date() }, { merge: true });
        });
    } catch (err) {
        console.error('Transaction failed:', err);
        // On failure, reload server state to avoid prolonged divergence.
        await loadMealplanFromFirestore();
        throw err;
    }
}

function findPathToItem(root, target) {
    const path = [];
    let found = false;
    function dfs(node, currentPath) {
        if (found) return;
        if (!node.items) return;
        for (let i = 0; i < node.items.length; i++) {
            const child = node.items[i];
            if (child === target) {
                path.push(...currentPath, i);
                found = true;
                return;
            }
            if (child.items) {
                dfs(child, currentPath.concat(i));
                if (found) return;
            }
        }
    }
    dfs(root, []);
    return found ? path : null;
}

function applyAtPath(root, path, op) {
    const copy = root;
    let node = copy;
    if (path && path.length > 0) {
        for (let i = 0; i < path.length; i++) {
            node = node.items[path[i]];
        }
    }
    return op(node, copy);
}

async function saveMealplanToFirestore() {
    if (!mealplanName) return;
    const ref = doc(database, 'mealplans', mealplanName);
    const payload = {
        mealplan: mealplanData,
        checks: shoppingChecks || {},
        timestamp: new Date()
    };

    try {
        await updateDoc(ref, payload);
    } catch (err) {
        // If update fails (document may not exist), create it.
        await setDoc(ref, payload, { merge: true });
    }
}

async function loadMealplanFromFirestore() {
    // Kept for backwards compatibility: load once without subscribing.
    if (!mealplanName) return;
    const mealplanDoc = await getDoc(doc(database, 'mealplans', mealplanName));
    if (mealplanDoc.exists()) {
        mealplanData = mealplanDoc.data().mealplan;
    } else {
        mealplanData = { name: mealplanName, type: 'mealplan', items: [] }; // Initialize with empty structure
    }
    notifyChange();
}

export function leaveMealplan() {
    if (mealplanUnsubscribe) {
        mealplanUnsubscribe();
        mealplanUnsubscribe = null;
    }
    mealplanName = null;
    mealplanData = { name: '', type: 'mealplan', items: [] };
    shoppingChecks = {};
    try { localStorage.removeItem('shoppingChecks'); } catch (e) { /* ignore */ }
    notifyChange();
}

// --- Centralized mutation helpers ---

//CREATE
export function addMealplanItem(container, item) {
    if (!mealplanName) {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert('Please join a mealplan before adding items.');
        }
        return;
    }

    // Update local state immediately for snappy UI
    container.items.push(item);
    notifyChange();

    // Persist via transaction that targets the same container path server-side
    const path = (container === mealplanData) ? [] : findPathToItem(mealplanData, container);
    saveMealplanPatch((serverMealplan) => {
        applyAtPath(serverMealplan, path, (node) => {
            node.items = node.items || [];
            node.items.push(item);
            return serverMealplan;
        });
        return serverMealplan;
    }).catch(err => console.error('Failed to save addMealplanItem:', err));
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
    const searchResult = getMealplanItemParent(item);
    if (!searchResult.parent) return;
    // Local update
    searchResult.parent.items[searchResult.index] = { ...item, ...newData };
    notifyChange();

    // Server-side transactional update
    const parentPath = (searchResult.parent === mealplanData) ? [] : findPathToItem(mealplanData, searchResult.parent);
    const index = searchResult.index;
    saveMealplanPatch((serverMealplan) => {
        applyAtPath(serverMealplan, parentPath, (node) => {
            node.items = node.items || [];
            if (index >= 0 && index < node.items.length) {
                node.items[index] = { ...node.items[index], ...newData };
            }
            return serverMealplan;
        });
        return serverMealplan;
    }).catch(err => console.error('Failed to save updateMealplanItem:', err));
}

//DELETE
export function removeMealplanItem(item) {
    const searchResult = getMealplanItemParent(item);
    if (!searchResult.parent) return;
    // Local update
    searchResult.parent.items.splice(searchResult.index, 1);
    notifyChange();

    // Server-side remove
    const parentPath = (searchResult.parent === mealplanData) ? [] : findPathToItem(mealplanData, searchResult.parent);
    const index = searchResult.index;
    saveMealplanPatch((serverMealplan) => {
        applyAtPath(serverMealplan, parentPath, (node) => {
            node.items = node.items || [];
            if (index >= 0 && index < node.items.length) {
                node.items.splice(index, 1);
            }
            return serverMealplan;
        });
        return serverMealplan;
    }).catch(err => console.error('Failed to save removeMealplanItem:', err));
}

export function replaceMealplanItem(originalItem, newItem) {
    const searchResult = getMealplanItemParent(originalItem);
    if (!searchResult.parent) return;
    // Local replace
    searchResult.parent.items.splice(searchResult.index, 1, newItem);
    notifyChange();

    const parentPath = (searchResult.parent === mealplanData) ? [] : findPathToItem(mealplanData, searchResult.parent);
    const index = searchResult.index;
    saveMealplanPatch((serverMealplan) => {
        applyAtPath(serverMealplan, parentPath, (node) => {
            node.items = node.items || [];
            if (index >= 0 && index < node.items.length) {
                node.items.splice(index, 1, newItem);
            }
            return serverMealplan;
        });
        return serverMealplan;
    }).catch(err => console.error('Failed to save replaceMealplanItem:', err));
}
