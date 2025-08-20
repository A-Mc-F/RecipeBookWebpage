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
    console.log('detected click')
    const excludedTag = 'selectable'

    // Start looping through parent elements
    let currentElement = event.target;
    while (currentElement.parentElement) {
        //console.log(currentElement)
        if (currentElement.getAttribute('tag') === excludedTag) {
            return
        }
        currentElement = currentElement.parentElement; // Move to the parent element
    }
    clearSelections()
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
    console.log('cleared all selections')
    clearState('group');
    clearState('recipe');
}