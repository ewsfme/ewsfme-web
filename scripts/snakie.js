"use strict";

const canvas = document.getElementById("snake-canvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem("snakie_highscore") || 0;
let gameInterval = null;

if (highScoreDisplay) highScoreDisplay.textContent = highScore;

function startGame() {
    clearInterval(gameInterval);
    snake = [{ x: 10, y: 10 }];
    dx = 1;
    dy = 0;
    score = 0;
    scoreDisplay.textContent = score;
    spawnFood();
    gameInterval = setInterval(gameLoop, 100);
}

function spawnFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
}

function gameLoop() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Стіни (Wrap-around / тороїдальне поле або Game Over)
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return gameOver();
    }

    // Зіткнення з власним хвостом
    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            return gameOver();
        }
    }

    snake.unshift(head);

    // Їжа
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreDisplay.textContent = score;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("snakie_highscore", highScore);
            if (highScoreDisplay) highScoreDisplay.textContent = highScore;
        }
        spawnFood();
    } else {
        snake.pop();
    }

    render();
}

function render() {
    // Очищення
    ctx.fillStyle = "#08080c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Їжа (фіолетова зірка/крапка)
    ctx.fillStyle = "#c76d80";
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

    // Змійка
    snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? "#8f5363" : "#3b1d28";
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function gameOver() {
    clearInterval(gameInterval);
    ctx.fillStyle = "rgba(10, 10, 10, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "16px 'Martian Mono'";
    ctx.fillText("GAME OVER", canvas.width / 2 - 50, canvas.height / 2);
}

document.addEventListener("keydown", (e) => {
    if ((e.key === "ArrowUp" || e.key === "w") && dy === 0) { dx = 0; dy = -1; }
    if ((e.key === "ArrowDown" || e.key === "s") && dy === 0) { dx = 0; dy = 1; }
    if ((e.key === "ArrowLeft" || e.key === "a") && dx === 0) { dx = -1; dy = 0; }
    if ((e.key === "ArrowRight" || e.key === "d") && dx === 0) { dx = 1; dy = 0; }
});