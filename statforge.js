// example input: components (entities) are (non-)leaf keys. systems are indicated by reserved kewords starting with "_".
const DropDown = "Dropdown";
const StringInput = "StringInput";
const StringOutput = "StringOutput";
const rules = {
    Classes : {Wizard : {Points : 10, MagicPower : 20},
	       Warrior : {Points : 2, MagicPower : 2},
	       _layout : DropDown, // rendering
	       _value : "SingleSelect", // kind of field: (type of) input of value of output
	       _data : [], // active / displayable data
	      },
    Spells : {Fireball : {MagicPower : -10, _requires : "state._data['Classes'] === 'Wizard'"},
	      Whirlwind : {MagicPower : -2},	     
	      _layout : DropDown,
	      _value : "MultiSelect",
	      _data : []},
    Items : {Axe : {Gold : 10, Integrity : 15},
	     Sword : {Gold : 15, Integrity : 15},
	     _layout : DropDown,
	     _value : "MultiSelect",
	     _data : []},
    Name : {_layout : StringInput,
	    _data : "",
	    _value : "Input"},
    MagicPower : {_layout : StringOutput,
		  _value : "sumActive(state, 'MagicPower')",
		  _data : "" },
    Points : {_layout : StringOutput,
	      _value : "sumActive(state, 'Points')",
	      _data : ""}
};

/**
 * Converts a rules dict to a two-fold nested form dict, e.g. {bar : {baz : {foo : 1}}} => {foo : {bar.baz : 1}} 
 *
 * @param {object} rules
 * @returns {object} rep
 */
function rulesToRep(rules) {
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
 * @param {object} rep
 * @returns {object} rules
 */
function repToRules(rep){
    // outer level is indexed by components, inner level is indexed by nested entities: strings separated by dots, e.g. bar.baz
    return Object.entries(rep).reduce( (acc, [component, entityValue ]) => {
	return Object.entries(entityValue).reduce( (acc2, [entity, value]) => {
	    const entityKey = entity.split(".");
	    const entityNested = entityKey.reduceRight((nestedAcc, entityPart) => ({ [entityPart] : nestedAcc }), {[component] : value});
	    return {...acc2, ...entityNested};
	}, acc);
    }, {});
}

// appends to _data
function multiSelect(state, id, content){
    const newVal = state._data[id].concat(content);
    const newData = {...state._data, [id] : newVal};
    return {
        ...state,
        _data : newData
    };
}

// updates _data
function singleSelect(state, id, content){
    const newData = {...state._data, [id] : [content]};
    return {
        ...state,
        _data : newData
    };
}

// TODO uff, DRY
// updates _data
function input(state, id, content){
    const newData = {...state._data, [id] : content};
    return {
        ...state,
        _data : newData
    };
}

// maps fields to user input to decide which function to call on which input
const userInputTable = {
    "MultiSelect" : multiSelect,
    "SingleSelect" : singleSelect,
    "Input" : input,
};

// sum all values of active components => for all entities in _data, sum "component" value
function sumActive(state, component) {
    return Object.values(state._data).reduce((total, entities) => {
        if (!Array.isArray(entities)) return total; // TODO: can we assume entity is array element?

        const componentSum = entities.reduce((entityTotal, entity) => {
	    console.log(component, entity, state[component]?.[entity]);
            return entityTotal + (state[component]?.[entity] || 0);
        }, 0);

        return total + componentSum;
    }, 0);
}

// updates derived entities === "_data" fields of all entities whose "_value" is not in processDispatchTable
function evolve(state){
    
    // TODO: uff
    const inputs = new Set(Object.keys(userInputTable));
    const isOutput = (value) => {return !inputs.has(value);};
    
    const update = Object.entries(state._value).reduce((acc, [key, value]) => {
	
	if (isOutput(value)) {	    
	    // TODO: uff
	    acc[key] = eval(value);
	}
	return acc;
    }, {});

    const newData = {...state._data, ...update};
    
    // TODO: return update separately for rendering
    return {...state, _data : newData};
}

// returns updated state
function newStateFromInput(state, input){
    const value = state._value[input.id] ?? "";
    const updateFunc = userInputTable[value];

    
    return evolve(updateFunc(state, input.id, input.content));
}

// returns violations of a state => checks for violation in all _requires keywords
function stateViolations(state){
    
    return;
}
