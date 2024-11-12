// mention: derived values *must not* depend on other derived values
// eval => DSL

/**
 * Converts a rules dict to a two-fold nested form dict, e.g. {bar : {baz : {foo : 1}}} => {foo : {bar.baz : 1}} 
 *
 * @param {object} rules
 * @returns {object} state
 */
function rulesToState(rules) {
    // return value, modified in-place
    const rep = {};

    function inner(rulesSlice, currentKey) {
        for (const [key, value] of Object.entries(rulesSlice)) {
	    const newKey = currentKey ? `${currentKey}.${key}` : key;
            if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                inner(value, newKey);
            } else {
                rep[key] = rep[key] || {};
                rep[key][currentKey] = value;
            }
        }
    }
    
    inner(rules, "");
    return rep;
}


/**
 * Converts a two-folded nested form dict to a rules dict, e.g. {foo : {bar.baz : 1}} => {bar : {baz : {foo : 1}}}
 *
 * @param {object} state
 * @returns {object} rules
 */
function stateToRules(state){
    // outer level is indexed by components, inner level is indexed by nested entities: strings separated by dots, e.g. bar.baz
    return Object.entries(state).reduce( (acc, [component, entityValue ]) => {
	return Object.entries(entityValue).reduce( (acc2, [entity, value]) => {
	    const entityKey = entity.split(".");
	    const entityNested = entityKey.reduceRight((nestedAcc, entityPart) => ({ [entityPart] : nestedAcc }), {[component] : value});
	    return deepMerge(acc2, entityNested);
	}, acc);
    }, {});
}

// helper function to perform nested dict merge
function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    return { ...target, ...source };
}

const inputHandlers = {
    "MultiSelect": (state, input) => {
        state._active[input.selection] = input.content;
        return state;
    },
    "SingleSelect": (state, input) => {
        Object.keys(state._active).forEach(subEntity => {
            if (subEntity.startsWith(input.id) && subEntity.length > input.id.length) {
                state._active[subEntity] = false;
            }
        });
        state._active[input.selection] = input.content;
        return state;
    },
    "Input": (state, input) => {
        state._value[input.id] = input.content;
        return state;
    }
};

// sum all active components
function sumActive(state, component) {
    return Object.entries(state._active).reduce((total, [entity, isActive]) => {
	if (!isActive) return total;
        return total + (state[component]?.[entity] || 0);
    }, 0);
}

// updates derived entities === "_data" fields of all entities whose "_value" is not in processDispatchTable
function update(state){        
    const update = Object.entries(state._derivation).reduce((acc, [key, value]) => {
	acc[key] = eval(value);
	return acc;
    }, {});


    // TODO: return updates separately for rendering
    const newValue = {...state._value, ...update};
    return {...state, _value : newValue};
}

// returns updated state
function newStateFromInput(state, input){
    const value = state._kind[input.id] ?? "";
    const updateInput = inputHandlers[value];
    
    return update(updateInput(state, input));
}

// returns violations of a state => checks for violation in all _requires keywords
function stateViolations(state){
    return Object.entries(state._active).reduce( (acc, [entity, isActive]) => {
	const requires = state._requires[entity] ?? "";
	if (eval(requires) && requires !== "") return acc;
	return acc + requires;
    }, "");
}

// maps fields to user input to decide which function to call on which input
const kindRenderTable = {
    "MultiSelect" : renderMultiSelect,
    "SingleSelect" : renderSingleSelect,
    "Input" : renderInput,
    "Output" : renderOutput,

};

function getChildren(entity, state){
    const length = entity.length;
    const ret  = new Set(Object.entries(state).reduce( (acc, [component, value]) => {
	return acc.concat(
	    Object.keys(value).filter( (subEntity) => {return subEntity.length > length && entity === subEntity.slice(0, length);})
	);
    }, []));
    return [... ret];
}

function renderSingleSelect(entity, state) {

    let selectElement = document.getElementById(entity);
    if (!selectElement) {
        selectElement = document.createElement("select");
        selectElement.id = entity;
        const children = getChildren(entity, state);

        children.some(child => {
            const childKind = state._kind[child];
            if (childKind) {
                kindRenderTable[childKind](child, state);
                return true;
            }

            const option = document.createElement("option");
            option.textContent = child;
            option.value = child;

            if (state._active[child] === true) {
                option.selected = true;
            }

            selectElement.appendChild(option);
        });

        // Attach the callback to the 'change' event of the select element
        selectElement.addEventListener("change",
				       () => {
					   stateChange({id : entity, selection : selectElement.options[selectElement.selectedIndex].value, content : true});
				       }
				      );

        document.body.appendChild(selectElement);  // or append it to a specific container
    }
}

function renderMultiSelect(entity, state) {
    let container = document.getElementById(entity);
    if (!container) {
        container = document.createElement("div");
        container.id = entity;
        const children = getChildren(entity, state);

        children.forEach(child => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = child;
            checkbox.value = child;
            checkbox.checked = state._active[child] === true;

            // Add event listener for selection (checked) or deselection (unchecked)
            checkbox.addEventListener("change", () => { stateChange({id : entity, selection : child, content : checkbox.checked}); }
				     );

            const label = document.createElement("label");
            label.htmlFor = checkbox.id;
            label.textContent = child;

            container.appendChild(checkbox);
            container.appendChild(label);
        });

        document.body.appendChild(container);  // or append it to a specific container
    }
}

function renderOutput(entity, state) {
    let outputElement = document.getElementById(entity);
    if (!outputElement) {
	const labelElement = document.createElement("label");
        labelElement.innerText = `${entity}: `;
        labelElement.setAttribute("for", entity);	

	const container = document.createElement("p");
        outputElement = document.createElement("span");
        outputElement.id = entity;

	document.body.appendChild(container);  // or append it to a specific container
	container.appendChild(labelElement);  // Append label first
        container.appendChild(outputElement);  // or append it to a specific container
	
    }
    outputElement.textContent = state._value?.[entity];
}

function renderInput(entity, state, callback) {
    let inputElement = document.getElementById(entity);

    if (!inputElement) {
        const labelElement = document.createElement("label");
        labelElement.innerText = `${entity}: `;
        labelElement.setAttribute("for", entity);

        inputElement = document.createElement("input");
        inputElement.id = entity;
        inputElement.type = "text";
        inputElement.value = state._value?.[entity];
	
        document.body.appendChild(labelElement); // Append label first
        document.body.appendChild(inputElement); // or append it to a specific container

	// Add event listener to call the callback function on input change
        inputElement.addEventListener("change", (event) => {
	    stateChange({id : entity, selection : "", content : event.target.value});
        });
    }
}

// computes new HTML
function render(state){
    Object.entries(state._kind).forEach( ([entity, kind]) => {
	const func  = kindRenderTable?.[kind];
	if (func) func(entity, state);	
    });
}

function stateChange(input){
    const newState = newStateFromInput(structuredClone(globalThis.state), input);
    const violations = stateViolations(newState);
    if (violations) alert(violations);
    else{
	globalThis.state = newState;
	render(globalThis.state);
    }
}

// Function to toggle the JSON input area visibility
function toggleJsonInput() {
    const inputContainer = document.getElementById("json-input-container");
    inputContainer.style.display = inputContainer.style.display === "none" ? "block" : "none";
}

// Function to handle JSON submission from the text area
function submitJson() {
    const jsonInput = document.getElementById("json-input").value;

    try {
	const rules = JSON.parse(jsonInput);
	globalThis.state = rulesToState(rules);
	render(globalThis.state);
    } catch (error) {
	alert("Invalid JSON format. Please correct it and try again.");
	console.error("Error parsing JSON:", error);
    }
}

// Function to download the current state as a JSON file
function downloadState() {
    const stateJSON = JSON.stringify(stateToRules(globalThis.state), null, 2);
    const blob = new Blob([stateJSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link to trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = "state.json";
    a.click();

    // Clean up the URL object
    URL.revokeObjectURL(url);
}

