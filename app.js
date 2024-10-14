// DOM elements
const jsonEditor = document.getElementById("json-rules");
const characterSheet = document.getElementById("character-sheet");
const generateButton = document.getElementById("generate");
const downloadButton = document.getElementById("download");

// Generate Character Sheet
generateButton.addEventListener("click", () => {
  const jsonRules = JSON.parse(jsonEditor.value);
  generateCharacterSheet(jsonRules);
});

// externally defined value
function generateInputField(stat, rules){
    const statBlock = document.createElement("div");
    statBlock.classList.add("stat");    
    const label = document.createElement("label");
    label.innerHTML = `${stat.charAt(0).toUpperCase() + stat.slice(1)}: `;

    const input = document.createElement("input");
    input.type = "number";
    input.id = stat;
    input.value = 0;
    
    input.addEventListener('input', function () {updateCharacterSheet(rules);});

    statBlock.appendChild(label);
    statBlock.appendChild(input);

    return statBlock;
}

// derived value
function generateOutputField(stat, rules){    
    const statBlock = document.createElement("div");
    statBlock.classList.add("stat");    
    const label = document.createElement("label");
    label.innerHTML = `${stat.charAt(0).toUpperCase() + stat.slice(1)}: `;
    
    const readOnlyField = document.createElement("span");
    readOnlyField.id = stat;
    
    readOnlyField.classList.add("readonly");
    readOnlyField.innerHTML = ""; 
    statBlock.appendChild(label);
    statBlock.appendChild(readOnlyField);
    
    return statBlock;
}

const templates = [generateInputField, generateOutputField];

function generateCharacterSheet(rules) {
  characterSheet.innerHTML = ""; // Clear current sheet

  Object.keys(rules).forEach((stat) => {      
      // Get the HTML template for the stat
      const htmlTemplate = rules[stat].html;
      const statBlock = templates[htmlTemplate](stat, rules);
      characterSheet.appendChild(statBlock);    
  });
}

// Calculate derived stat
function calculateStat(rules, stat, value) {
    const rule = rules[stat].rule;
    
    if (Array.isArray(rule)) {	
	const values = rule.slice(1).map(val => {
	    return document.getElementById(val).value;	    
	}).join(',');
	
	const evalString = "(" + rule[0] + ")(" + values + ")";
	
	console.log(evalString);
	
	return eval(evalString);
    }
    return value;
}

// Update character sheet when an input value changes
function updateCharacterSheet(rules) {
    Object.keys(rules).forEach((stat) => {
	const htmlTemplate = rules[stat].html;
	if (htmlTemplate === 1) {
	    const derivedValue = calculateStat(rules, stat, 0);
	    console.log(stat);
	    document.getElementById(stat).innerHTML = derivedValue;
	}
    });
}
