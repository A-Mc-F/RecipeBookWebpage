class RecipeObject {
    constructor(name, ingredients, instructions) {
        this.name = name;
        this.ingredients = ingredients; // Array of ingredients
        this.instructions = instructions; // Array of instructions
    }

    toString() {
        return `${this.name} - ${this.ingredients.join(', ')} - ${this.instructions.join(', ')}`;
    }
}

// Firestore data converter
const recipeConverter = {
    toFirestore: function(recipe) {
        return {
            name: recipe.name,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions
        };
    },
    fromFirestore: function(snapshot, options) {
        const data = snapshot.data(options);
        return new RecipeObject(data.name, data.ingredients, data.instructions);
    }
};

export { RecipeObject, recipeConverter };