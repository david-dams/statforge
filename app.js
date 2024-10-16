// DOM elements
const jsonEditor = document.getElementById("json-rules");
const characterSheet = document.getElementById("character-sheet");
const generateButton = document.getElementById("generate");

// setup character sheet
generateButton.addEventListener("click", () => {
    const jsonRules = JSON.parse(jsonEditor.value);
    
    generateCharacterSheet(jsonRules);
});

// generate container
function makeDiv(element){
    const statName = element["DISPLAY"];    
    const statBlock = document.createElement("div");
    const label = document.createElement("label");
    
    label.innerHTML = `${statName.charAt(0).toUpperCase() + statName.slice(1)}: `;
    statBlock.appendChild(label);
    
    return statBlock;
}

// collection of stuff
function makeSelectBox(element) {
    const statBlock = makeDiv(element);
    const select = document.createElement("select");

    select.id = element["DISPLAY"];
    Object.keys(element["OPTIONS"]).forEach((optionValue) => {
        const option = document.createElement("option");

        // Add "content attribute"
        option.setAttribute("data-content", JSON.stringify(element["OPTIONS"][optionValue]));
        option.value = optionValue;
        option.text = optionValue;

        // Set the default selected option and make it "active"
	option.selected = (optionValue === element["DEFAULT"]);
	option.setAttribute("data-active", String(option.selected));
	
        select.appendChild(option);
    });

    // Event listener to update the character sheet when the value changes
    select.addEventListener('change', function () {
        const options = select.options;

        // Loop through all options and disable / enable
        for (let i = 0; i < options.length; i++) {
	    options[i].setAttribute("data-active", String(options[i].selected));
        }

        updateCharacterSheet();
    });

    statBlock.appendChild(select);
    return statBlock;
}

function makeInputBox(element){
    const statBlock = makeDiv(element);    
    const input = document.createElement("input");
    
    input.id = element["DISPLAY"];
    input.value = element["DEFAULT"];
    // TODO: uff; rebuild entire sheet if anything changes
    input.addEventListener('input', function () {updateCharacterSheet();});
    statBlock.appendChild(input);
    
    return statBlock;   
}

function makeDerivedBox(element){
    const statBlock = makeDiv(element);    
    const derived = document.createElement("span");
    
    derived.id = element["DISPLAY"];
    derived.textContent = "";
    derived.setAttribute("data-code", element["VALUE"]); 
    statBlock.appendChild(derived);
    
    return statBlock;   
}

const funcDict = {"input" : makeInputBox, "choice" : makeSelectBox, "derived" : makeDerivedBox};

function generateCharacterSheet(rules) {
    // Clear current sheet
    characterSheet.innerHTML = ""; 

    // New sheet is html-ified list
    rules["rules"].forEach( (element) => {
	const child = funcDict[element["KIND"]](element);
	characterSheet.appendChild(child);    
    });
}

function sumAll(field){
    const allActive = document.querySelectorAll('[data-active="true"]');
    return Array.from(allActive)
	.filter(element => JSON.parse(element.dataset.content)[field] !== undefined)
	.map(element => JSON.parse(element.dataset.content)[field])
	.reduce((sum, value) => sum + Number(value), 0);
}

function executeCode(element){
    element.textContent = eval(element.dataset.code);    
}

// Update character sheet when an input value changes
function updateCharacterSheet() {
    const rules = JSON.parse(jsonEditor.value);
    const allDerived = document.querySelectorAll('[data-code]');
    
    // Log each element's data-code value
    allDerived.forEach((element) => {
	executeCode(element);
    });
}
