let currentInput = "0";
let previousInput = "";
let operator = null;

const output = document.getElementById("calc-output");
const history = document.getElementById("calc-history");

function updateDisplay() {
	output.textContent = currentInput;
	history.textContent = operator ? `${previousInput} ${operator}` : "";
}

function appendNumber(num) {
	if (num === "." && currentInput.includes(".")) return;
	if (currentInput === "0" && num !== ".") {
		currentInput = num;
	} else {
		currentInput += num;
	}
	updateDisplay();
}

function setOperator(op) {
	if (operator !== null) calculate();
	previousInput = currentInput;
	operator = op;
	currentInput = "0";
	updateDisplay();
}

function calculate() {
	if (operator === null || previousInput === "") return;
	let res;
	const a = parseFloat(previousInput);
	const b = parseFloat(currentInput);

	switch (operator) {
		case "+":
			res = a + b;
			break;
		case "-":
			res = a - b;
			break;
		case "*":
			res = a * b;
			break;
		case "/":
			res = b === 0 ? "Error" : a / b;
			break;
		default:
			return;
	}

	currentInput = String(res);
	operator = null;
	previousInput = "";
	updateDisplay();
}

function clearCalc() {
	currentInput = "0";
	previousInput = "";
	operator = null;
	updateDisplay();
}

document.addEventListener("keydown", (e) => {
	if (!Number.isNaN(e.key)) appendNumber(e.key);
	if (e.key === ".") appendNumber(".");
	if (["+", "-", "*", "/"].includes(e.key)) setOperator(e.key);
	if (e.key === "Enter" || e.key === "=") calculate();
	if (e.key === "Backspace") {
		currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : "0";
		updateDisplay();
	}
	if (e.key === "Escape") clearCalc();
});
