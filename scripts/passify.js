"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const lengthSlider = document.getElementById("a");
    const etrCheckbox = document.getElementById("EtR");

    if (etrCheckbox) {
        etrCheckbox.removeAttribute("disabled");
    }

    const lengthLabel = document.querySelector('label[for="a"]');
    if (lengthLabel && lengthSlider) {
        lengthLabel.innerHTML = `PASSWORD LENGTH: <span id="len-val" style="color: var(--accent-hover);">${lengthSlider.value}</span>`;
        lengthSlider.addEventListener("input", (e) => {
            const valSpan = document.getElementById("len-val");
            if (valSpan) valSpan.textContent = e.target.value;
        });
    }
});

// Словник простих, коротких і популярних англійських слів
const WORD_BANK = [
    "shadow", "cyber", "pixel", "frost", "silent", "echo", "night", "drift", 
    "neon", "stone", "river", "cloud", "amber", "light", "space", "vortex", 
    "signal", "orbit", "solar", "matrix", "storm", "flash", "pulse", "spark",
    "raven", "tiger", "phantom", "alpha", "delta", "haven", "logic", "route"
];

function generateEasyPassword(targetLength, useCaps, useNumbers, useSymbols) {
    // Якщо увімкнені символи — вибираємо випадковий читабельний роздільник, інакше звичайне підкреслення "_"
    const symbolSeparators = ["_", "-", ".", "/"];
    let separator = "_";
    if (useSymbols) {
        separator = symbolSeparators[Math.floor(Math.random() * symbolSeparators.length)];
    }

    // Числовий суфікс — не завжди, а з шансом ~50%, і з різними патернами
    let numberSuffix = "";
    if (useNumbers && Math.random() < 0.5) {
        const patterns = [
            () => String(Math.floor(Math.random() * 10)),                           // 7
            () => String(Math.floor(10 + Math.random() * 90)),                      // 42
            () => String(Math.floor(100 + Math.random() * 900)),                    // 123
            () => { const d = Math.floor(Math.random() * 10); return `${d}${d}${d}`; } // 111
        ];
        const numStr = patterns[Math.floor(Math.random() * patterns.length)]();
        numberSuffix = separator + numStr;
    }

    // Перемішуємо банк слів для різноманітності
    const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);

    let selectedWords = [];
    let budget = targetLength - numberSuffix.length;

    for (const rawWord of shuffled) {
        let word = useCaps
            ? rawWord.charAt(0).toUpperCase() + rawWord.slice(1)
            : rawWord.toLowerCase();

        // Довжина, яку займе нове слово (з роздільником, якщо не перше)
        const sepLen = selectedWords.length > 0 ? separator.length : 0;
        const candidateLength = selectedWords.join(separator).length + sepLen + word.length;

        if (candidateLength <= budget) {
            selectedWords.push(word);
        }

        // Зупиняємось, якщо вже досягли бюджету
        if (selectedWords.join(separator).length >= budget) {
            break;
        }
    }

    // Якщо жодне слово не влізло — беремо найкоротше і обрізаємо
    if (selectedWords.length === 0) {
        const shortest = [...WORD_BANK].sort((a, b) => a.length - b.length)[0];
        let word = useCaps
            ? shortest.charAt(0).toUpperCase() + shortest.slice(1)
            : shortest.toLowerCase();
        selectedWords.push(word);
    }

    let passphrase = selectedWords.join(separator) + numberSuffix;

    // Завжди обрізаємо до targetLength, щоб гарантувати точну довжину
    if (passphrase.length > targetLength) {
        passphrase = passphrase.slice(0, targetLength);
    }

    return passphrase;
}

function Passo() {
    const lengthInput = document.getElementById("a");
    const length = Number(lengthInput.value);
    const resultField = document.getElementById("result");

    const useBigLetters = document.getElementById("Caps").checked;
    const useNumbers = document.getElementById("Numbers").checked;
    const useSymbols = document.getElementById("Symbols").checked;
    const isEasyToRemember = document.getElementById("EtR").checked;

    // Режим генерації зі слів (Passphrase)
    if (isEasyToRemember) {
        resultField.value = generateEasyPassword(length, useBigLetters, useNumbers, useSymbols);
        return;
    }

    // Стандартний режим (випадкові символи)
    const smallLetters = "abcdefghijklmnopqrstuvwxyz";
    const bigLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@$%^*()[]?/.,";

    let passwordPool = smallLetters;
    if (useBigLetters) passwordPool += bigLetters;
    if (useNumbers) passwordPool += numbers;
    if (useSymbols) passwordPool += symbols;

    let password = "";
    for (let i = 0; i < length; i++) {
        const index = Math.floor(Math.random() * passwordPool.length);
        password += passwordPool[index];
    }

    resultField.value = password;
}

function CopyPassword() {
    const resultField = document.getElementById("result");
    const passwordText = resultField.value;

    if (!passwordText || passwordText === "READY_FOR_DATA") return;

    navigator.clipboard.writeText(passwordText).then(() => {
        const originalVal = resultField.value;
        resultField.value = "COPIED TO CLIPBOARD!";
        setTimeout(() => {
            resultField.value = originalVal;
        }, 1200);
    });
}