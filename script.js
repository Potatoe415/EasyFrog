const GRID_SIZE = 40;
const NUM_ROWS = 11;
const NUM_COLS = 11;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive resize for canvas only
function resizeCanvas() {
    const w = Math.min(window.innerWidth * 0.98, 700);
    const h = Math.floor(w * NUM_ROWS / NUM_COLS);
    canvas.width = NUM_COLS * GRID_SIZE;
    canvas.height = NUM_ROWS * GRID_SIZE;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
}
window.addEventListener('resize', resizeCanvas);

// --- Assets ---
const imageAssets = {};
const imageSources = {
    frog: 'resources/frog.png',
    frog_dead: 'resources/frog_dead.png',
    frog_skull: 'resources/frog_skull.png',
    log: 'resources/log.png',
    car_red: 'resources/car_red.png'
};
let imagesLoaded = 0;
const totalImages = Object.keys(imageSources).length;

// --- Game State ---
let score = 0;
let level = 1;
let lives = 4;

let cars = [];
let waterObstacles = [];
let refuges = Array(Math.floor(NUM_COLS / 3)).fill(false); // 5 refuges for 15 columns
const REFUGE_ROW = 0;

let frog = {
    x: Math.floor(NUM_COLS / 2),
    y: NUM_ROWS - 1,
    width: GRID_SIZE,
    height: GRID_SIZE,
    px: Math.floor(NUM_COLS / 2) * GRID_SIZE // pixel x position for smooth log movement
};

let deadFrogs = []; // Array of {x, y, type: "dead"|"skull"}
let frogOnLog = null;  // reference to log object if frog is on log

// --- Load Images ---
function loadImages() {
    for (const key in imageSources) {
        imageAssets[key] = new Image();
        imageAssets[key].onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                initGame();
                gameLoop();
            }
        };
        imageAssets[key].src = imageSources[key];
    }
}

// --- Draw Background (just the land rows) ---
function drawBackground() {
    ctx.fillStyle = '#7ed957';
    ctx.fillRect(0, 0, GRID_SIZE * NUM_COLS, GRID_SIZE);
    ctx.fillRect(0, 5 * GRID_SIZE, GRID_SIZE * NUM_COLS, GRID_SIZE);
    ctx.fillRect(0, 10 * GRID_SIZE, GRID_SIZE * NUM_COLS, GRID_SIZE);
}

function drawRefuges() {
    for (let i = 0; i < refuges.length; i++) {
        let slotX = (i * Math.floor(NUM_COLS / refuges.length) + 1) * GRID_SIZE;
        ctx.fillStyle = refuges[i] ? '#00FF00' : '#FFFF00';
        ctx.fillRect(slotX, REFUGE_ROW * GRID_SIZE, GRID_SIZE * 0.8, GRID_SIZE);
    }
}

function drawObstacles() {
    cars.forEach(car => {
        if (imageAssets.car_red.complete && imageAssets.car_red.naturalWidth) {
            const scale = GRID_SIZE / imageAssets.car_red.naturalHeight;
            const drawWidth = imageAssets.car_red.naturalWidth * scale;
            ctx.drawImage(
                imageAssets.car_red,
                car.x, car.y * GRID_SIZE,
                drawWidth, GRID_SIZE
            );
        } else {
            ctx.fillStyle = car.color || '#d11';
            ctx.fillRect(car.x, car.y * GRID_SIZE, GRID_SIZE * 2, GRID_SIZE);
        }
    });
    waterObstacles.forEach(log => {
        if (imageAssets.log.complete && imageAssets.log.naturalWidth) {
            const scale = GRID_SIZE / imageAssets.log.naturalHeight;
            const drawWidth = imageAssets.log.naturalWidth * scale;
            ctx.drawImage(
                imageAssets.log,
                log.x, log.y * GRID_SIZE,
                drawWidth, GRID_SIZE
            );
        } else {
            ctx.fillStyle = log.color || '#964B00';
            ctx.fillRect(log.x, log.y * GRID_SIZE, GRID_SIZE * 3, GRID_SIZE);
        }
    });
}

function drawDeadFrogs() {
    deadFrogs.forEach(dead => {
        let imgKey = dead.type === "dead" ? "frog_dead" : "frog_skull";
        if (imageAssets[imgKey] && imageAssets[imgKey].complete) {
            ctx.drawImage(
                imageAssets[imgKey],
                dead.x * GRID_SIZE,
                dead.y * GRID_SIZE,
                GRID_SIZE, GRID_SIZE
            );
        }
    });
}

function drawFrog() {
    if (imageAssets.frog.complete && imageAssets.frog.naturalWidth) {
        const scale = GRID_SIZE / imageAssets.frog.naturalHeight;
        const drawWidth = imageAssets.frog.naturalWidth * scale;
        // Use px on water, x*GRID_SIZE on other rows
        const drawX = (frog.y >= 1 && frog.y <= 4) ? frog.px : frog.x * GRID_SIZE;
        ctx.drawImage(
            imageAssets.frog,
            drawX,
            frog.y * GRID_SIZE,
            drawWidth, GRID_SIZE
        );
    } else {
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(frog.x * GRID_SIZE, frog.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }
}

function updateUI() {
    document.getElementById('score').innerText = `Score: ${score}`;
    document.getElementById('level').innerText = `Niveau: ${level}`;
    document.getElementById('lives').innerText = `Vies: ${lives}`;
}

function initGame() {
    cars = [];
    waterObstacles = [];
    deadFrogs = [];

    for (let r = 6; r <= 9; r++) {
        let dir = (r % 2 === 0) ? 1 : -1;
        let startX = (dir === 1) ? 0 : (canvas.width - GRID_SIZE * 2);
        cars.push({
            x: startX,
            y: r,
            width: GRID_SIZE * 2,
            height: GRID_SIZE,
            speed: dir * (2 + Math.random()),
            color: '#d11',
            dir: dir
        });
    }
    for (let r = 1; r <= 4; r++) {
        let dir = (r % 2 === 0) ? 1 : -1;
        let startX = (dir === 1) ? 0 : (canvas.width - GRID_SIZE * 3);
        waterObstacles.push({
            x: startX,
            y: r,
            width: GRID_SIZE * 3,
            height: GRID_SIZE,
            speed: dir * (1 + Math.random()),
            color: '#964B00',
            dir: dir
        });
    }
    resetFrog();
    frogOnLog = null;
    updateUI();
    resizeCanvas();
}

function updateGame() {
    cars.forEach(car => {
        car.x += car.speed;
        if (car.dir === 1 && car.x > canvas.width) {
            car.x = -car.width;
        } else if (car.dir === -1 && car.x < -car.width) {
            car.x = canvas.width;
        }
    });
    waterObstacles.forEach(log => {
        log.x += log.speed;
        if (log.dir === 1 && log.x > canvas.width) {
            log.x = -log.width;
        } else if (log.dir === -1 && log.x < -log.width) {
            log.x = canvas.width;
        }
    });
    let collided = false;
    cars.forEach(car => {
        let carX = car.x;
        if (
            frog.y === car.y &&
            frog.px < carX + car.width &&
            frog.px + frog.width > carX
        ) {
            deadFrogs.push({ x: Math.round(frog.px / GRID_SIZE), y: frog.y, type: "dead" });
            collided = true;
        }
    });
    if (collided) {
        loseLife();
        return;
    }
    if (frog.y >= 1 && frog.y <= 4) {
        frogOnLog = null;
        waterObstacles.forEach(log => {
            if (
                frog.y === log.y &&
                frog.px < log.x + log.width &&
                frog.px + frog.width > log.x
            ) {
                frogOnLog = log;
            }
        });
        if (frogOnLog) {
            frog.px += frogOnLog.speed;
            let newFrogX = Math.round(frog.px / GRID_SIZE);
            if (frog.px < 0 || frog.px + frog.width > canvas.width) {
                deadFrogs.push({ x: newFrogX, y: frog.y, type: "skull" });
                loseLife();
                return;
            } else {
                frog.x = newFrogX;
            }
        } else {
            deadFrogs.push({ x: Math.round(frog.px / GRID_SIZE), y: frog.y, type: "skull" });
            loseLife();
            return;
        }
    } else {
        frogOnLog = null;
        frog.px = frog.x * GRID_SIZE;
    }
}

function gameLoop() {
    updateGame();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawRefuges();
    drawObstacles();
    drawDeadFrogs();
    drawFrog();
    requestAnimationFrame(gameLoop);
}

function handleKeyPress(event) {
    switch (event.key) {
        case 'ArrowUp':    moveFrog(0, -1); break;
        case 'ArrowDown':  moveFrog(0, 1); break;
        case 'ArrowLeft':  moveFrog(-1, 0); break;
        case 'ArrowRight': moveFrog(1, 0); break;
        case 'Enter':      resetFrog(); break;
    }
}
window.addEventListener('keydown', handleKeyPress);

let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
});
canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
});
canvas.addEventListener('touchend', (event) => {
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) moveFrog(1, 0); else moveFrog(-1, 0);
    } else {
        if (dy > 0) moveFrog(0, 1); else moveFrog(0, -1);
    }
});

function moveFrog(dx, dy) {
    const newX = frog.x + dx;
    const newY = frog.y + dy;
    if (newX >= 0 && newX < NUM_COLS && newY >= 0 && newY < NUM_ROWS) {
        frog.x = newX;
        frog.y = newY;
        frog.px = frog.x * GRID_SIZE;
        if (frog.y === REFUGE_ROW) checkRefuge();
        updateUI();
    }
}

function checkRefuge() {
    const refugeIndex = Math.floor(frog.x / Math.floor(NUM_COLS / refuges.length));
    if (refugeIndex >= 0 && refugeIndex < refuges.length && !refuges[refugeIndex]) {
        refuges[refugeIndex] = true;
        score += 100;
        resetFrog();
        updateUI();
        checkLevelCompletion();
    } else {
        deadFrogs.push({ x: frog.x, y: frog.y, type: "dead" });
        loseLife();
    }
}
function resetFrog() {
    frog.x = Math.floor(NUM_COLS / 2);
    frog.y = NUM_ROWS - 1;
    frog.px = frog.x * GRID_SIZE;
}
function loseLife() {
    lives--;
    updateUI();
    if (lives <= 0) {
        setTimeout(gameOver, 600);
    }
    resetFrog();
}
function checkLevelCompletion() {
    if (refuges.every(r => r === true)) {
        level++;
        score += level * 500;
        refuges.fill(false);
        resetFrog();
        updateUI();
    }
}
function gameOver() {
    alert("Game Over!");
    deadFrogs = [];
    frogOnLog = null;
    initGame();
}

window.onload = function() {
    resizeCanvas();
    loadImages();
};
