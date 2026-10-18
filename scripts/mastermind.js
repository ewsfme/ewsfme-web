document.addEventListener("DOMContentLoaded", () => {
	const CODE_LENGTH = 4;
	const MAX_ATTEMPTS = 8;
	const DIGIT_LINE_HEIGHT_EM = 1.2;

	let secretCode = [];
	let attemptsCount = 0;
	let gameOver = false;

	const logContainer = document.getElementById("attempts-log");
	const guessInput = document.getElementById("guess-input");
	const guessForm = document.getElementById("guess-form");
	const statusMsg = document.getElementById("status-msg");
	const btnSubmit = document.getElementById("btn-submit");
	const btnRestart = document.getElementById("btn-restart");

	function generateSecretCode() {
		const code = [];
		for (let i = 0; i < CODE_LENGTH; i++) {
			code.push(Math.floor(Math.random() * 10));
		}
		return code;
	}

	function evaluateGuess(secret, guess) {
		let exact = 0;
		let misplaced = 0;

		const secretRemaining = [];
		const guessRemaining = [];

		// 1-й прохід: точні збіги (LOCKED)
		for (let i = 0; i < CODE_LENGTH; i++) {
			if (guess[i] === secret[i]) {
				exact++;
			} else {
				secretRemaining.push(secret[i]);
				guessRemaining.push(guess[i]);
			}
		}

		// 2-й прохід: присутні, але на іншій позиції (SHIFT)
		for (let i = 0; i < guessRemaining.length; i++) {
			const index = secretRemaining.indexOf(guessRemaining[i]);
			if (index !== -1) {
				misplaced++;
				secretRemaining.splice(index, 1);
			}
		}

		return { exact, misplaced };
	}

	function initGame() {
		secretCode = generateSecretCode();
		attemptsCount = 0;
		gameOver = false;
		logContainer.innerHTML = "";
		statusMsg.textContent = "System ready. Enter 4 digits.";
		statusMsg.style.color = "var(--text-secondary)";

		guessInput.disabled = false;
		guessInput.value = "";
		btnSubmit.style.display = "inline-block";
		btnRestart.style.display = "none";
		guessInput.focus();
	}

	function endGame(isWon) {
		gameOver = true;
		guessInput.disabled = true;
		btnSubmit.style.display = "none";
		btnRestart.style.display = "inline-block";

		if (isWon) {
			statusMsg.textContent = `[ACCESS GRANTED] Firewall decrypted in ${attemptsCount} attempts!`;
			statusMsg.style.color = "var(--success-color)";
		} else {
			statusMsg.textContent = `[LOCKDOWN] Protocol failed. Correct code: ${secretCode.join("")}`;
			statusMsg.style.color = "var(--error-color)";
		}
	}

	guessForm.addEventListener("submit", (e) => {
		e.preventDefault();
		if (gameOver) return;

		const guessStr = guessInput.value.trim();
		if (guessStr.length !== CODE_LENGTH || !/^\d+$/.test(guessStr)) {
			statusMsg.textContent =
				"Syntax Error: Sequence must be exactly 4 digits.";
			statusMsg.style.color = "var(--error-color)";
			return;
		}

		attemptsCount++;
		const currentGuess = guessStr.split("").map(Number);
		const { exact, misplaced } = evaluateGuess(secretCode, currentGuess);

		// Будуємо рядок спроби
		const row = document.createElement("div");
		row.className = "attempt-row";

		const digitsDiv = document.createElement("div");
		digitsDiv.className = "guess-digits";

		// Генерація прокрутки для кожної цифри (Spinning Counter)
		currentGuess.forEach((digit, index) => {
			const box = document.createElement("div");
			box.className = "digit-box";

			const viewport = document.createElement("div");
			viewport.className = "t-spin-viewport";

			const track = document.createElement("div");
			track.className = "t-spin-track animating";

			// Барабан містить цифри від 0 до 9
			for (let d = 0; d <= 9; d++) {
				const digitElem = document.createElement("span");
				digitElem.className = "t-spin-digit";
				digitElem.textContent = String(d);
				track.appendChild(digitElem);
			}

			viewport.appendChild(track);
			box.appendChild(viewport);
			digitsDiv.appendChild(box);

			// Stagger-анімація обертання для кожного барабана
			requestAnimationFrame(() => {
				setTimeout(() => {
					const offset = -(digit * DIGIT_LINE_HEIGHT_EM);
					track.style.transform = `translateY(${offset}em)`;
					track.classList.remove("animating");
				}, index * 80);
			});
		});

		// Підказки
		const cluesDiv = document.createElement("div");
		cluesDiv.className = "clues";
		cluesDiv.innerHTML = `
            <span class="clue-exact">● ${exact} LOCKED</span>
            <span class="clue-misplaced">○ ${misplaced} SHIFT</span>
        `;

		row.appendChild(digitsDiv);
		row.appendChild(cluesDiv);
		logContainer.appendChild(row);
		logContainer.scrollTop = logContainer.scrollHeight;

		guessInput.value = "";

		// Перевірка умов завершення гри
		if (exact === CODE_LENGTH) {
			endGame(true);
		} else if (attemptsCount >= MAX_ATTEMPTS) {
			endGame(false);
		} else {
			statusMsg.textContent = `Attempts remaining: ${MAX_ATTEMPTS - attemptsCount}`;
			statusMsg.style.color = "var(--text-secondary)";
		}
	});

	btnRestart.addEventListener("click", initGame);

	initGame();
});
