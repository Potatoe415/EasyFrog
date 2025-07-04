const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');


// Game Constants
const GRID_SIZE = 40; // Size of each grid cell
const NUM_ROWS = 11;
const NUM_COLS = 15; // Adjust based on desired canvas width

let canvasWidth = NUM_COLS * GRID_SIZE;
let canvasHeight = NUM_ROWS * GRID_SIZE; // Keep this calculation

// Image Assets
const imageAssets = {};
const imageSources = {
  frog: '/images/frog.png', // Replace with your actual frog image path
  carRed: '/images/car_red.png', // Example car image path
  carBlue: '/images/car_blue.png', // Example car image path
  log: '/images/log.png', // Example log image path
  turtle: '/images/turtle.png', // Example turtle image path
  crocodile: '/images/crocodile.png', // Example crocodile image path
  // Add more image sources for different obstacles, background elements, etc.
};
let imagesLoaded = 0;
const totalImages = Object.keys(imageSources).length;

// Game State
let score = 0;
let level = 1;
let lives = 4;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Obstacle Data Structures (Placeholder - will be expanded)
let cars = [];
let waterObstacles = []; // Logs, turtles, crocodiles

// Frog position
let frog = {
  x: Math.floor(NUM_COLS / 2), // Start in the middle column
  y: NUM_ROWS - 1, // Start in the bottom row
  width: GRID_SIZE,
  height: GRID_SIZE,
  isDiving: false, // For turtle animation
};

// Refuge slots (top row)
let refuges = Array(Math.floor(NUM_COLS / 3)).fill(false); // Example: 5 refuges for 15 columns
const REFUGE_ROW = 0;

// --- Image Loading ---
function loadImages() {
  for (const key in imageSources) {
    imageAssets[key] = new Image();
    imageAssets[key].onload = () => {
      imagesLoaded++;
      if (imagesLoaded === totalImages) {
        console.log("All images loaded");
        // Start the game or show a ready message
        gameLoop();
      }
    };
    imageAssets[key].src = imageSources[key];
  }
}


// Function to draw the game background (grid rows)
function drawBackground() {
  for (let i = 0; i < NUM_ROWS; i++) {
    ctx.fillStyle = (i % 2 === 0) ? '#4CAF50' : '#8BC34A'; // Alternating green/light green for land rows
    if (i >= 1 && i <= 4) ctx.fillStyle = '#757575'; // Grey for road rows
    if (i >= 6 && i <= 9) ctx.fillStyle = '#03A9F4'; // Blue for water rows
    if (i === 5) ctx.fillStyle = '#FFEB3B'; // Yellow for intermediate safe zone
    ctx.fillRect(0, i * GRID_SIZE, canvasWidth, GRID_SIZE);
  }
}

// Function to update UI elements
function updateUI() {
  document.getElementById('score').innerText = `Score: ${score}`;
  document.getElementById('level').innerText = `Level: ${level}`;
  document.getElementById('lives').innerText = `Lives: ${lives}`;
}

// Function to draw the frog
// Function to draw the frog
function drawFrog() {
  if (imageAssets.frog && !frog.isDiving) { // Only draw if image is loaded and frog is not diving
    ctx.drawImage(imageAssets.frog, frog.x * GRID_SIZE, frog.y * GRID_SIZE, frog.width, frog.height);
  }
  // In the future, replace this with drawing the frog image asset
}

// Function to draw refuges
function drawRefuges() {
  ctx.fillStyle = '#FFFF00'; // Yellow for empty refuges
  for (let i = 0; i < refuges.length; i++) {
    if (!refuges[i]) {
      ctx.fillRect((i * Math.floor(NUM_COLS / refuges.length) + 1) * GRID_SIZE, REFUGE_ROW * GRID_SIZE, GRID_SIZE * 0.8, GRID_SIZE);
    } else {
      // Draw a filled refuge (e.g., a parked frog image or a different color)
      ctx.fillStyle = '#00FF00'; // Example: Green for filled refuge
      ctx.fillRect((i * Math.floor(NUM_COLS / refuges.length) + 1) * GRID_SIZE, REFUGE_ROW * GRID_SIZE, GRID_SIZE * 0.8, GRID_SIZE);
    }
  }
}

// Function to draw obstacles (Cars and Water Obstacles)
function drawObstacles() {
  // Draw Cars
  cars.forEach(car => {
    if (imageAssets[car.type]) { // Use car.type to specify which car image to use
      ctx.drawImage(imageAssets[car.type], car.x, car.y * GRID_SIZE, car.width, car.height);
    } else {
      // Fallback to a colored rectangle if image not loaded
      ctx.fillStyle = car.color || '#000000';
      ctx.fillRect(car.x, car.y * GRID_SIZE, car.width, car.height);
    }
  });

  // Draw Water Obstacles
  waterObstacles.forEach(obstacle => {
    if (imageAssets[obstacle.type]) {
      // Basic drawing, will need animation logic later for turtles/crocodiles
      if (obstacle.type === 'turtle' && obstacle.isDiving) {
        // Don't draw if turtle is diving
        return;
      }
       if (obstacle.type === 'crocodile' && obstacle.isMouthOpen) {
           // Draw open mouth crocodile
           if (imageAssets.crocodileOpenMouth) { // Assuming you have a separate image for open mouth
               ctx.drawImage(imageAssets.crocodileOpenMouth, obstacle.x, obstacle.y * GRID_SIZE, obstacle.width, obstacle.height);
           } else {
                ctx.fillStyle = 'darkgreen'; // Fallback color
                ctx.fillRect(obstacle.x, obstacle.y * GRID_SIZE, obstacle.width, obstacle.height);
           }
       } else {
            ctx.drawImage(imageAssets[obstacle.type], obstacle.x, obstacle.y * GRID_SIZE, obstacle.width, obstacle.height);
       }
    } else {
      // Fallback
      ctx.fillStyle = obstacle.color || '#00FFFF';
      ctx.fillRect(obstacle.x, obstacle.y * GRID_SIZE, obstacle.width, obstacle.height);
    }
  });
}

// Game loop
function gameLoop() {
  requestAnimationFrame(gameLoop);
}

// Function to handle keyboard input
function handleKeyPress(event) {
  switch (event.key) {
    case 'ArrowUp':
      moveFrog(0, -1);
      break;
    case 'ArrowDown':
      moveFrog(0, 1);
      break;
    case 'ArrowLeft':
      moveFrog(-1, 0);
      break;
    case 'ArrowRight':
      moveFrog(1, 0);
      break;
  }
}

// Function to handle swipe input
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (event) => {
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
});

canvas.addEventListener('touchmove', (event) => {
  event.preventDefault(); // Prevent scrolling
});

canvas.addEventListener('touchend', (event) => {
  const touchEndX = event.changedTouches[0].clientX;
  const touchEndY = event.changedTouches[0].clientY;

  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal swipe
    if (dx > 0) {
      moveFrog(1, 0); // Swipe right
    } else {
      moveFrog(-1, 0); // Swipe left
    }
  } else {
    // Vertical swipe
    if (dy > 0) {
      moveFrog(0, 1); // Swipe down
    } else {
      moveFrog(0, -1); // Swipe up
    }
  }
});

// Function to move the frog and check boundaries
function moveFrog(dx, dy) {
  const newX = frog.x + dx;
  const newY = frog.y + dy;

  if (newX >= 0 && newX < NUM_COLS && newY >= 0 && newY < NUM_ROWS) { // Changed from NUM_ROWS-1 to NUM_ROWS to allow reaching the top row
    // Simple animation for frog jump (placeholder)
    // This would ideally be a more complex animation using image frames
    ctx.fillStyle = '#FF00FF'; // Flash color briefly
    ctx.fillRect(frog.x * GRID_SIZE, frog.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);


    // Update frog position
    frog.x = newX;
    frog.y = newY;

    // Check if frog reached a refuge
    if (frog.y === REFUGE_ROW) {
        checkRefuge();
    }
  }
}

// Function to update game state (obstacle movement, animations, etc.)
function updateGame() {
    // Implement obstacle movement logic here

    // Implement obstacle animation logic (turtle diving, crocodile mouth)

}

// Function to check if frog reached a refuge
function checkRefuge() {
    const refugeIndex = Math.floor(frog.x / Math.floor(NUM_COLS / refuges.length));
    if (refugeIndex >= 0 && refugeIndex < refuges.length && !refuges[refugeIndex]) {
        refuges[refugeIndex] = true;
        score += 100; // Score for reaching a refuge
        updateUI();
        resetFrog();
        checkLevelCompletion();
    } else {
        // Frog reached top row but not a valid refuge or refuge is taken
        loseLife();
    }
}

// Function to reset frog position
function resetFrog() {
    frog.x = Math.floor(NUM_COLS / 2);
    frog.y = NUM_ROWS - 1;
}

// Function to lose a life
function loseLife() {
    lives--;
    updateUI();
    if (lives <= 0) {
        gameOver();
    } else {
        resetFrog();
    }
}

// Function to check for level completion
function checkLevelCompletion() {
    const allRefugesFilled = refuges.every(refuge => refuge === true);
    if (allRefugesFilled) {
        level++;
        score += level * 500; // Bonus for completing level
        updateUI();
        resetLevel();
    }
}

// Function to reset level (for next level)
function resetLevel() {
    refuges.fill(false); // Reset refuges
    // TODO: Increase difficulty (speed, number of obstacles)
    resetFrog();
}

// Function for game over
function gameOver() {
    console.log("Game Over!"); // Replace with actual game over screen/message
    // Stop the game loop
    // display game over screen
}

// Add event listeners
window.addEventListener('keydown', handleKeyPress);

// --- Initial Setup ---
function initGame() {
    // Set up initial obstacles (example)
    cars.push({ x: 0, y: 7, width: GRID_SIZE * 2, height: GRID_SIZE, speed: 2, type: 'carRed' });
    cars.push({ x: canvasWidth / 2, y: 8, width: GRID_SIZE * 3, height: GRID_SIZE, speed: -1.5, type: 'carBlue' });
    waterObstacles.push({ x: 0, y: 2, width: GRID_SIZE * 3, height: GRID_SIZE, speed: 1, type: 'log' });
    waterObstacles.push({ x: canvasWidth / 3, y: 2, width: GRID_SIZE, height: GRID_SIZE, speed: 1, type: 'turtle', isDiving: false });

}

// Main game loop
function gameLoop() {
  // Update game state (obstacle positions, animations, etc.)
  updateGame();

  // Clear the canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw everything
  drawBackground();
  drawRefuges();
  drawObstacles(); // Draw obstacles before the frog to layer correctly
  drawFrog();

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();

// Initial UI update
updateUI();