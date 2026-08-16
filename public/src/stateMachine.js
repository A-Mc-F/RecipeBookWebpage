const states = {
    group: null,
    recipe: null,
    stage: 'Plan'
}

const listeners = {
    group: [],
    recipe: [],
    stage: []
}

export function setChangeListener(state, listener) {
    console.log(`Adding listener ${listener} to ${state}`)
    listeners[state].push(listener)
}

function notifyChange(state) {
    console.log(`Notifying of ${state} change to ${states[state]}`)
    listeners[state].forEach(listener => listener())
}


document.addEventListener('click', function (event) {
    const target = event.target;

    if (!(target instanceof Element)) {
        return;
    }

    // Ignore clicks inside local UI controls so they do not trigger a global selection reset.
    if (target.closest('[tag="selectable"], .shopping-item, label, input, textarea, button, select, a')) {
        return;
    }

    clearSelections();
})

export function setState(state, value) {
    states[state] = value
    notifyChange(state)
}

export function getState(state) {
    return states[state]
}

export function clearState(state) {
    states[state] = null
    notifyChange(state)
}

export function clearSelections() {
    clearState('recipe');
}