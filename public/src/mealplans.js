import { loadMealPlanFromFirestore, saveMealPlanToFirestore } from './mealplanFirestore.js';

mealPlanData = { name: '', type: 'mealPlan', items: [] };
mealPlanName = 'defaultMealPlan'; // Default meal plan name

// --- Meal plan change listener ---
let onMealPlanChange = null;
export function setMealPlanChangeListener(cb) { onMealPlanChange = cb; }
function notifyChange() {
    if (onMealPlanChange) onMealPlanChange(mealPlanData);
}

export function getMealplanName() {
    return mealplanName;
}

export function setMealplanName(name) {
    mealplanName = name;
    loadMealPlanFromFirestore();
}

export function getMealplanData() {
    return mealPlanData;
}


// --- Centralized mutation helpers --- 
export function addMealPlanItem(parentPath, item) {
    let arr = mealPlanData.items;
    for (let i = 0; i < parentPath.length; i++) {
        arr = arr[parentPath[i]].items;
    }
    arr.push(item);
    saveMealPlanToFirestore();
    notifyChange();
}

export function removeMealPlanItem(parentPath, idx) {
    let arr = mealPlanData.items;
    for (let i = 0; i < parentPath.length; i++) {
        arr = arr[parentPath[i]].items;
    }
    arr.splice(idx, 1);
    saveMealPlanToFirestore();
    notifyChange();
}

export function updateMealPlanItem(parentPath, idx, newData) {
    let arr = mealPlanData.items;
    for (let i = 0; i < parentPath.length; i++) {
        arr = arr[parentPath[i]].items;
    }
    arr[idx] = { ...arr[idx], ...newData };
}

export function getItemPath(type, name) {
    //perform a breadth-first search for an item with the given type and name and returns the path as an array of indices
    function bfs(items, path = []) {
        const queue = [{ items, path }];
        while (queue.length > 0) {
            const { items, path } = queue.shift();
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type === type && item.name === name) {
                    return [...path, i];
                }
                if (item.items) {
                    queue.push({ items: item.items, path: [...path, i] });
                }
            }
        }
        return null;
    }
    return bfs(mealPlanData.items);
}