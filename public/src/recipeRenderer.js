export function recipeCard(recipeName) {
    let card = document.createElement('div');
    card.setAttribute('tag', 'selectable')
    card.className = 'recipe-card glass-card'
    card.innerText = recipeName;

    return card
}