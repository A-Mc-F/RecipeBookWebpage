// --- Slider (Radio) Event Listener ---
const radios = document.querySelectorAll('input[name="stage"]');
radios.forEach(radio => {
    radio.addEventListener('change', function () {
        const mode = document.querySelector('input[name="stage"]:checked').value;
        displayContent(mode);
    });
});

// --- Display content based on selected mode ---
function displayContent(mode) {
    switch (mode) {
        case 'Book':
            hidePanels();
            document.getElementById('Book').classList.add('active');
            break;
        case 'Plan':
            hidePanels();
            document.getElementById('Plan').classList.add('active');
            renderMealplan();
            break;
        case 'Shop':
            hidePanels();
            document.getElementById('Shop').classList.add('active');
            renderShoppingList();
            break;
    }
}

function hidePanels() {
    document.getElementById('Book').classList.remove('active');
    document.getElementById('Plan').classList.remove('active');
    document.getElementById('Shop').classList.remove('active');
}