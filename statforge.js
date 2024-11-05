// entities are non-leaf keys. components are leaf-keys. systems are indicated per entity by a reserved key.

const DropDown = "Dropdown";
const StringInput = "StringInput";
const StringOutput = "StringOutput";

const rules = {
    Classes : {Wizard : {Points : 10},
	       Warrior : {Points : 2},
	       _Layout : DropDown,
	       _Value : "SingleSelect",
	       _Data : [],
	      },
    Spells : {Fireball : {MagicPower : -10, _Requires : "get('Classes.Selected') == 'Wizard'"},
	      Whirlwind : {MagicPower : -2},	     
	      _Layout : DropDown,
	      _Value : "MultiSelect",
	      _Data : []},
    Items : {Axe : {Gold : 10, Integrity : 15},
	     Sword : {Gold : 15, Integrity : 15},
	     _Layout : DropDown,
	     _Value : "MultiSelect",
	     _Data : []},
    Name : {_Layout : StringInput,
	    _Data : "",
	    _Value : "Input"},
    MagicPower : {_Layout : StringOutput,
		  _Value : "10 - getAllActive('MagicPower')",
		  _Data : "" },
    Points : {_Layout : StringOutput,
	      _Value : "10 - getAllActive('Points')",
	      _Data : ""}
};

// rules => rep[component][entity]
function rulesToRep(rules) {
    const rep = {};

    function inner(obj, currentKey) {
        for (const [key, value] of Object.entries(obj)) {
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

// console.log(rules);
console.log(rulesToRep(rules));

// rep => rules
function repToRules(){
}

// add new / modify old DOM elements
function render(){

}

// check if the given input mutation is legal under constraints given in rep, notify about violation
function isLegal(){

}

// update the derived values from legal input, return object containing only changes and entire changed object  
function update(){

}

// // initialization
// var rep = getRep(rules); // flatten the nested rules dict into the "matrix" representation
// render(rep); // render the matrix

// // main loop
// while (input = awaitInput()){ // get new input
    
//     if (isLegal(input, rep)){ // only do something for a legal move
	
// 	rep, rep_updated_only = computeUpdated(input, rep); // update the entire matrix and get only the portion of it that is new
	
// 	render(rep_updated_only);  // render the updates
//     }

//     if (input == BREAK){

// 	download(getRules(rep)); // convert the matrix back to a nested dict, which is then downloaded
// 	break;
//     }
// }
