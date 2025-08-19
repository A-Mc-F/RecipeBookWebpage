import { getState, setState } from "./stateMachine.js";

const stageSelectors = document.querySelectorAll('nav#stage-slider .stage-selector');

const panelsContainer = document.querySelector('.panel-slider');
const panels = panelsContainer ? Array.from(panelsContainer.children).filter(child => child.tagName === 'DIV') : [];

if (!panelsContainer || panels.length === 0 || stageSelectors.length === 0) {
    console.error('Slider elements not found.');
}

// Assume panels are laid out horizontally and have equal width
// We'll calculate the offset based on the index of the clicked stage selector


// --- Slider (Radio) Event Listener ---
const selectors = document.querySelectorAll('div.stage-selector');
selectors.forEach((selector, index) => {
    selector.addEventListener('click', () => {
        setState('stage', selector.id);

        // Remove active class from all stage selectors and add to the clicked one
        selectors.forEach(sel => sel.classList.remove('active'));
        selector.classList.add('active');

        // Calculate the translation needed to show the panel at the given index
        // This assumes each panel takes up the full width of the container
        // You might need to adjust this calculation based on your CSS
        const panelWidth = panelsContainer.offsetWidth / panels.length; // Simple assumption
        console.log(`width ${panelWidth}`)
        const translation = -index * panelWidth;

        panelsContainer.style.transform = `translateX(${translation}px)`;

        const stage = getState('stage')
        console.log(`Changing to ${stage}`)
    });
});

setState('stage', 'Book')