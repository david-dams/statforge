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

function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    return { ...target, ...source };
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

    const newValue = {...state._value, ...update};
    
    // TODO: return updates separately for rendering
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
