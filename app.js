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

// Download Character Sheet as HTML
downloadButton.addEventListener("click", () => {
    const characterHtml = characterSheet.innerHTML;
    console.log(characterHtml);
    // Get all <style> and <link> elements for CSS
    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
	  .map(styleElement => styleElement.outerHTML)
	  .join("\n");

    // Get the <script> for app.js if it's inline
    const scripts = Array.from(document.querySelectorAll("script"))
	  .filter(script => script.src.includes("app.js")) // filter app.js specifically
	  .map(script => `<script src="${script.src}"></script>`)
	  .join("\n");

    // Full HTML with dynamic insertion of styles and script
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Character Sheet</title>
  ${styles} <!-- Inserted CSS -->
</head>
<body>
  <h2>Character Sheet</h2>
  <div id="character-sheet">
    ${characterHtml}
  </div>
  
  ${scripts} <!-- Inserted JavaScript -->
</body>
</html>
    `;

    // Create a blob and trigger the download
    const blob = new Blob([fullHtml], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "character.html";
    link.click();
});

// downloadButton.addEventListener("click", () => {
//     const characterHtml = characterSheet.innerHTML;
//     const blob = new Blob([characterHtml], { type: "text/html" });    
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = "character.html";    
//     link.click();
// });
