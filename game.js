const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

canvas.width = 300;
canvas.height = 400;

let fruits = [];
let bombs = [];
let score = 0;
let gameRunning = false;
let timeLeft = 0;
let targetScore = 0;
let timerInterval;

const fruitTypes = ['apple', 'banana', 'orange', 'melon', 'watermelon'];
const fruitImages = {};
const bombImage = new Image();
bombImage.src = 'images/bomb.png'; 

let sliceSound = new Audio('slice.mp3');
let missSound = new Audio('miss.mp3');

// Bomb slice sound (single sound)
let bombSliceSound = new Audio('bomb_slice.mp3'); 

// Load fruit images
let imagesLoaded = 0;
const totalImages = fruitTypes.length;

fruitTypes.forEach(fruit => {
    fruitImages[fruit] = new Image();
    fruitImages[fruit].src = `images/${fruit}.png`;

    fruitImages[fruit].onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            startGame();
        }
    };
});


function getGameSettings() {
    const timeLimit = localStorage.getItem('timeLimit');
    const targetScore = localStorage.getItem('targetScore');
    
    return {
        timeLimit: timeLimit ? parseInt(timeLimit) : 100,  // Default 100 seconds
        targetScore: targetScore ? parseInt(targetScore) : 1000,  // Default 1000 points
    };
}

function startGame() {
    const { timeLimit: setTimeLimit, targetScore: setTargetScore } = getGameSettings();

    timeLeft = setTimeLimit;
    targetScore = setTargetScore;
    
    score = 0;
    fruits = [];
    bombs = [];
    gameRunning = true;
    scoreElement.textContent = `Score: ${score}`;
    gameOverElement.style.display = 'none';

    // Start the timer
    timerInterval = setInterval(() => {
        if (gameRunning) {
            timeLeft--;
            if (timeLeft <= 0) {
                gameOver('Time is up! You didn\'t reach the target score.');
            }
            document.getElementById('score').innerText = `Score: ${score} | Time: ${timeLeft}s`;
        }
    }, 1000);

    gameLoop();
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    fruits = fruits.filter(fruit => {
        fruit.update();
        return fruit.y < canvas.height && !fruit.sliced;
    });

    bombs = bombs.filter(bomb => {
        bomb.update();
        return bomb.y < canvas.height && !bomb.sliced;
    });

    if (Math.random() < 0.04) {
        spawnFruit();
    }

    if (Math.random() < 0.01) { 
        spawnBomb();
    }

    fruits.forEach(fruit => fruit.draw());
    bombs.forEach(bomb => bomb.draw());


    if (score >= targetScore) {
        gameOver('Congratulations! You reached the target score.');
    }

    requestAnimationFrame(gameLoop);
}

function spawnFruit() {
    const type = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];

    const x = Math.random() * canvas.width;

    const initialHeight = Math.random() * 100 + 100;  

    const velocityX = (Math.random() - 0.5) * 4;  
    const velocityY = -5 - Math.random() * 3;  
    const gravity = 0.2;  

    const fruit = new Fruit(x, initialHeight, type, velocityX, velocityY, gravity);
    fruits.push(fruit);
}

function spawnBomb() {
    const x = Math.random() * canvas.width;

    const initialHeight = Math.random() * 100 + 100;  
    const velocityX = (Math.random() - 0.5) * 4;  
    const velocityY = -4 - Math.random() * 2; 
    const gravity = 0.1;  

    const bomb = new Bomb(x, initialHeight, velocityX, velocityY, gravity);
    bombs.push(bomb);
}

function Fruit(x, y, type, velocityX, velocityY, gravity) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.velocityX = velocityX;  
    this.velocityY = velocityY;  
    this.gravity = gravity;  
    this.sliced = false;

    this.update = function() {
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        this.x += this.velocityX;

        if (this.x < 0 || this.x > canvas.width) {
            this.velocityX = 0;
        }
    };

    this.draw = function() {
        if (!this.sliced) {
            ctx.drawImage(fruitImages[this.type], this.x - 30, this.y - 30, 60, 60);
        }
    };

    this.slice = function() {
        if (!this.sliced) {
            this.sliced = true;
            score += 10;
            scoreElement.textContent = `Score: ${score}`;

            sliceSound.play();
        }
    };
}

function Bomb(x, y, velocityX, velocityY, gravity) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.gravity = gravity;
    this.sliced = false;

    this.update = function() {
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        this.x += this.velocityX;
    };

    this.draw = function() {
        if (!this.sliced) {
            ctx.drawImage(bombImage, this.x - 30, this.y - 30, 60, 60);
        }
    };

    this.slice = function() {
        if (!this.sliced) {
            gameOver('Game Over! You sliced a bomb.');
            bombSliceSound.play();
        }
    };
}

function checkForSlice(x, y) {
    fruits.forEach(fruit => {
        if (!fruit.sliced && x > fruit.x - 60 && x < fruit.x + 60 && y > fruit.y - 60 && y < fruit.y + 60) {
            fruit.slice();
        }
    });

    bombs.forEach(bomb => {
        if (!bomb.sliced && x > bomb.x - 60 && x < bomb.x + 60 && y > bomb.y - 60 && y < bomb.y + 60) {
            bomb.slice();
        }
    });
}

canvas.addEventListener('mousemove', (e) => {
    if (!gameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    checkForSlice(mouseX, mouseY);
});

// Listen for mouse clicks
canvas.addEventListener('click', (e) => {
    if (!gameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    checkForSlice(mouseX, mouseY);
});

function gameOver(message) {
    clearInterval(timerInterval);
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
    alert(message);
}

function restartGame() {
    gameOverElement.style.display = 'none';
    window.location.href = 'index.html';
}