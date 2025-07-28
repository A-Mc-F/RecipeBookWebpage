import { db } from './firestoreConnection.js';

async function loadMealPlanFromFirestore() {
    if (!mealplanName) return;
    const mealPlanDoc = await getDoc(doc(db, 'mealPlans', mealplanName));
    if (mealPlanDoc.exists()) {
        mealPlanData = mealPlanDoc.data().mealPlan;
    } else {
        mealPlanData = { name: mealplanName, type: 'mealPlan', items: [] }; // Initialize with empty structure
    }
    notifyChange();
}

async function saveMealPlanToFirestore() {
    if (!mealplanName) return;
    await setDoc(doc(db, 'mealPlans', mealplanName), {
        mealPlan: mealPlanData,
        timestamp: new Date()
    });
}