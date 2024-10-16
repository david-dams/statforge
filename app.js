const jsonEditor = document.getElementById("json-rules");
const characterSheet = document.getElementById("character-sheet");
const generateButton = document.getElementById("generate");

generateButton.addEventListener("click", () => {
    const jsonRules = JSON.parse(jsonEditor.value);
    generateCharacterSheet(jsonRules);
});

function makeDiv({ ID }) {
    const statBlock = document.createElement("div");
    const label = document.createElement("label");
    label.innerHTML = `${ID.charAt(0).toUpperCase() + ID.slice(1)}: `;
    statBlock.appendChild(label);
    return statBlock;
}

function makeSelect(element) {
    const statBlock = makeDiv(element);
    const select = document.createElement("select");
    select.id = element["ID"];

    Object.entries(element["OPTIONS"]).forEach(([optionValue, optionData]) => {
        const option = document.createElement("option");
        option.setAttribute("data-content", JSON.stringify(optionData));
        option.value = optionValue;
        option.text = optionValue;
        option.selected = (optionValue === element["DEFAULT"]);
        option.setAttribute("data-active", option.selected);
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        Array.from(select.options).forEach(option => {
            option.setAttribute("data-active", option.selected);
        });
        updateCharacterSheet();
    });

    statBlock.appendChild(select);
    return statBlock;
}

function makeInput(element) {
    const statBlock = makeDiv(element);
    const input = document.createElement("input");
    input.id = element["ID"];
    input.value = element["DEFAULT"];
    input.setAttribute("data-active", "true");
    input.addEventListener('input', updateCharacterSheet);
    statBlock.appendChild(input);
    return statBlock;   
}

function makeDerived(element) {
    const statBlock = makeDiv(element);
    const derived = document.createElement("span");
    derived.id = element["ID"];
    derived.textContent = "";
    derived.setAttribute("data-code", element["VALUE"]); 
    statBlock.appendChild(derived);
    return statBlock;   
}

const funcDict = { "input": makeInput, "choice": makeSelect, "derived": makeDerived };

function generateCharacterSheet(rules) {
    characterSheet.innerHTML = ""; 
    rules["rules"].forEach((element) => {
        const child = funcDict[element["KIND"]](element);
        characterSheet.appendChild(child);    
    });
}

function sumAll(field) {
    return Array.from(document.querySelectorAll('[data-active="true"]'))
        .map(element => JSON.parse(element.dataset.content)[field])
        .filter(value => value !== undefined)
        .reduce((sum, value) => sum + Number(value), 0);
}

function executeCode(element) {
    const code = new Function(`return (${element.dataset.code})`);
    element.textContent = code();
}

function updateCharacterSheet() {
    document.querySelectorAll('[data-code]').forEach(executeCode);
}
