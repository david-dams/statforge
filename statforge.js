// TODO:
// rendering
// deselect!
// work around or implement this case: updates should be executed recursively if there are multiple derived values, e.g. something adds an item which adds an item, ...
// eval => DSL

// example input: components (entities) are (non-)leaf keys. systems are indicated by reserved kewords starting with "_".
const rules = {
    Classes : {Wizard : {Points : 10, MagicPower : 20},
	       Warrior : {Points : 2, MagicPower : 2},
	       _kind : "SingleSelect", // kind of field: (type of) input of value of output
	       _active : true,
	      },
    Spells : {Fireball : {MagicPower : -10, _requires : "state._active['Classes.Wizard']===true"},
	      Whirlwind : {MagicPower : -2},	     
	      _kind : "MultiSelect",
	      _active : true
	     },
    Items : {Axe : {Gold : 10, Integrity : 15, _requires : "state._active['Items.Sword'] === true"},
	     Sword : {Gold : 15, Integrity : 15},
	     _kind : "MultiSelect",
	     _active : true},
    Name : {_active : true,
	    _kind : "Input",
	    _value : "",
	   },
    MagicPower : {_derivation : "sumActive(state, 'MagicPower')",
		  _kind : "Output",
		  _active : true,
		  _value : "" },
    Points : {_derivation : "sumActive(state, 'Points')",
	      _kind : "Output",
	      _active : true,
	      _value : "" }
};

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

// appends to _data
function multiSelect(state, input){
    state._active[input.selection] = input.content;
    return state;
}

// updates _data
function singleSelect(state, input){
    state._active[input.selection] = input.content;
    return state;
}

// TODO uff, DRY
// updates _data
function input(state, input){
    state._active[input.selection] = input.content;
    return state;
}

// maps fields to user input to decide which function to call on which input
const userInputTable = {
    "MultiSelect" : multiSelect,
    "SingleSelect" : singleSelect,
    "Input" : input,
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
    const updateInput = userInputTable[value];
    
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

            const label = document.createElement("label");
            label.htmlFor = checkbox.id;
            label.textContent = child;

            container.appendChild(checkbox);
            container.appendChild(label);
        });

        document.body.appendChild(container);  // or append it to a specific container
    }
}

function renderOutput(entity, text) {
    let outputElement = document.getElementById(entity);
    if (!outputElement) {
        outputElement = document.createElement("p");
        outputElement.id = entity;
        outputElement.textContent = text;

        document.body.appendChild(outputElement);  // or append it to a specific container
    } else {
        outputElement.textContent = text;  // Update text if it already exists
    }
}

function renderInput(entity, defaultValue = "") {
    let inputElement = document.getElementById(entity);
    if (!inputElement) {
        inputElement = document.createElement("input");
        inputElement.id = entity;
        inputElement.type = "text";
        inputElement.value = defaultValue;

        document.body.appendChild(inputElement);  // or append it to a specific container
    } else {
        inputElement.value = defaultValue;  // Update value if it already exists
    }
}

// computes new HTML
function render(state){
    Object.entries(state._kind).forEach( ([entity, kind]) => {
	const func  = kindRenderTable?.[kind];
	if (func) func(entity, state);	
    });
}
