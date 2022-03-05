// jshint esversion: 9

// Settings object, used to auto generate UI:
var settings = {
  gameMode: {
    id: "gameMode",
    label: "Gamemode",
    value: "collect",
    type: "select",
    options: [
      {
        label: "Missions",
        value: "missions",
      },
      {
        label: "Collect",
        value: "collect",
      },
    ],
  },
  wallHit: {
    id: "wallHit",
    label: "Wallmode",
    value: "bounce",
    type: "select",
    options: [
      {
        label: "Infinite",
        value: "infinity",
      },
      {
        label: "Die & Bounce",
        value: "bounce",
      },
      {
        label: "Die",
        value: "death",
      },
    ],
  },
  growMode: {
    id: "growMode",
    label: "Growmode",
    value: "attach",
    type: "select",
    options: [
      {
        label: "Attach",
        value: "attach",
      },
      {
        label: "Stack",
        value: "stack",
      },
    ],
  },
  fruitType: {
    id: "fruitType",
    label: "Fruit Duration",
    value: "infinity",
    type: "select",
    options: [
      {
        label: "Infinite",
        value: "infinity",
      },
      {
        label: "Decay",
        value: "decay",
      },
    ],
  },
  magnet: {
    id: "magnet",
    label: "Magnetmode",
    value: false,
    type: "boolean",
  },
  eatBody: {
    id: "eatBody",
    label: "Self-Eating",
    value: true,
    type: "boolean",
  },

  pulsateBody: {
    id: "pulsateBody",
    label: "Pulsate Body",
    value: false,
    type: "boolean",
  },
  bodyLink: {
    id: "bodyLink",
    label: "Body Connections",
    value: "same",
    type: "select",
    options: [
      {
        label: "All",
        value: "always",
      },
      {
        label: "Same Color",
        value: "same",
      },
      {
        label: "None",
        value: "never",
      },
    ],
  },
};

// 0 = running, 1 = start, 2 = pause
var gameState = 1; // Default: 1
// 0 = none, 1 = start/exit button
// NONE = 0, START = 1, END = 2, RESUME = 3
var buttonHover = 0;
// Snake class:
var snake;
// Fruits array:
var foods = [];
// Highscore (which gets reset upon change of game mode):
var highscore = 0;
// Current score:
var score = 0;
// Current mission (type of fruit and how many):
var mission = {
  type: null,
  amount: 0,
};

// All current fruit types:
const pickupList = ["apple", "mango", "lime", "grapes"];
// Translation for mission game mode:
const pickupNames = {
  apple: "Apple",
  mango: "Mango",
  lime: "Lime",
  grapes: "Grapes",
};
// Pickup object filled with images on preload:
var pickups = {};
// Logo to draw in main menu:
var logoImage;

// Update flags for things to not update every frame:
var updates = {
  updateFlag: 0,
  fps: 0,
};
// Limited list of past fps values for debug graph:
let fpsList = [];
// Highest fps count for bar in debug graph:
let maxFPS = 0;

// Objects to include in debug screen:
const debugObjectList = ["snake"];
// Subobjects to not include in debug screen:
const debugObjectListBlackList = ["snake.positions", "snake.body", "snake.bodyFade"];
// Single variables to include in debug screen:
var debugList = [
  "gameState",
  "buttonHover",
  "maxFPS",
  "mouseX",
  "mouseY",
  "keyCode",
  "mouseIsPressed",
  "mouseButton",
  "snake.body.length",
];
// Auto generated array of variables to show in debug screen:
var debugObjects = [];
// Flag to shwo debug screen:
var debug = false;

function preload() {
  // Load logo image:
  logoImage = loadImage("./assets/logo.png");
  // Load images of all fruit types:
  pickupList.forEach((pickup) => {
    pickups[pickup] = {};
    pickups[pickup].image = loadImage(`./assets/pickups/${pickup}.png`);
  });
}

function setup() {
  // Create canvas based on window size:
  createCanvas(windowWidth, windowHeight);
  // Set body part color based on fruit sprite:
  pickupList.forEach((pickup) => {
    pickups[pickup].color = generateImageAverageColor(pickups[pickup].image);
  });
  // Initialize game:
  initGame();
  // Initialize debugObjects array:
  initDebug();
}

// Resize canvas when the window gets resized:
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function initGame() {
  // Clear and init food aray:
  foods = [];
  // Place a new snake head in the center of the screen:
  snake = new Snake(width / 2, height / 2);
  // Place two fruits:
  addFood();
  addFood();
  // Determine a new mission (regardless of game mode):
  newMission();
}

function initDebug() {
  // Add name of variable and value of variable to debugObjects:
  debugObjectList.forEach((d) => {
    let keys = [];
    // jshint ignore:start
    Object.keys(eval(d)).forEach((key) => {
      if (!debugObjectListBlackList.includes(d + "." + key)) keys.push(key);
    });
    // jshint ignore:end
    debugObjects = debugObjects.concat(keys.map((e) => d + "." + e));
  });
  // Add debugObjects to debugList:
  debugList = [...debugList, ...debugObjects];
  // Add all settings values:
  Object.keys(settings).forEach((key) => {
    debugList.push("settings." + key + ".value");
  });
}

function draw() {
  // Set framerate to 120 (default is 60):
  frameRate(120);
  // Add background:
  background(22);
  // Update things which should not be updated every frame:
  updateUpdates();
  if (gameState == 0) {
    // Game is running:
    buttonHover = 0;
    gameRun();
  } else if (gameState == 1) {
    // Main menu:
    gameMenu();
  } else if (gameState == 2) {
    // Pause screen:
    gamePause();
  }
  // Show debug screen if enabled:
  if (debug) showDebug();
}

function updateUpdates() {
  if (updates.updateFlag < frameCount - 15) {
    updates.updateFlag = frameCount;
    updates.fps = round(frameRate());
  }
}

// Show main menu UI:
function gameMenu() {
  showOverlay();
  showSettings();
  addButton("Start Game", width / 2, height * 0.48, 1);
  showControls();
  push();
  textAlign(CENTER);
  fill(255);
  textSize(height * 0.07);
  text("Snake", width * 0.46 + height * 0.15, height * 0.135);
  textSize(height * 0.04);
  text("by Frederik Shull", width / 2, height * 0.23);
  image(logoImage, width * 0.405, height * 0.04, height * 0.15, height * 0.15);
  pop();
}

// Show pause screen ui:
function gamePause() {
  snake.show();
  for (let i = 0; i < foods.length; i++) {
    foods[i].show();
  }
  showOverlay();
  addButton("Continue", width / 2, height * 0.42, 3);
  addButton("New Game", width / 2, height * 0.55, 2);
  showControls();
  push();
  stroke(255);
  fill(255);
  textAlign(CENTER);
  textSize(height * 0.07);
  text("PAUSE", width / 2, height * 0.1);
  pop();
}

// Run game and update everything:
function gameRun() {
  // Update score:
  if (settings.gameMode.value == "collect") score = snake.body.length;
  // Chance to spawn a new fruit object:
  let randomFood = {
    chance: settings.gameMode.value == "missions" ? 0.0018 : 0.001,
    max: settings.gameMode.value == "missions" ? max(score, 12) : 8,
  };
  // Spawn a new fruit object based on random result:
  if (random() < randomFood.chance && foods.length < randomFood.max) addFood();
  // Update snake:
  snake.update();
  // Create array for decayed food to be removed:
  let decayedFood = [];
  // Create array for eaten food to be removed:
  let eaten = [];
  foods.forEach((food, i) => {
    // Decay food:
    if (settings.fruitType.value == "decay") food.decay();
    if (food.size > 10) {
      food.update();
      // Attract food object to snake:
      if (settings.magnet.value) snake.attractFood(food);
      // Check if hitboxes collide:
      if (snake.checkEat(food)) {
        // If score is higher highscore, save it:
        if (highscore < score) highscore = snake.body.length;
        // Add food to eaten array:
        eaten.push(i);
      }
    } else {
      // Add food object to decayedFood array:
      decayedFood.push(i);
    }
  });
  // For every removed object spawn a new one:
  decayedFood.forEach((f) => {
    foods.splice(f, 1);
    addFood();
  });
  // For every removed object spawn a new one:
  eaten.forEach((e) => {
    foods.splice(e, 1);
    addFood();
  });
  // Determine new mission if current mission is finished:
  if (settings.gameMode.value == "missions") {
    if (snake.checkMission(mission.type, mission.amount)) {
      score++;
      newMission();
    }
  }
  // Listen to input to change direction:
  detectControls();
  // Show ingame UI:
  showUI();
}

function showOverlay() {
  push();
  fill(0, 100);
  rect(0, 0, width, height);
  pop();
}

// Generate settings window based on settings object:
// x,y = positions, w,h = dimensions
// xb,yb = positions of buttons, wb,hb = dimensions of buttons
function showSettings() {
  let x = width * 0.015;
  let y = height * 0.25;
  let w = width * 0.27;
  let h = height * 0.6;
  addBox("Settings", x, y, w, h * 0.85);
  push();
  noStroke();
  textSize((w / 2 + h / 2) * 0.04);
  Object.keys(settings).forEach((id, index) => {
    let setting = settings[id];
    let sy = index * (h * 0.08) + y + height * 0.15;
    if (index % 2 == 0) fill(0, 25);
    else fill(0, 50);
    rect(x + width * 0.001, sy - h * 0.045, w - width * 0.001 * 2, height * 0.048);
    fill(255);
    textAlign(LEFT);
    text(setting.label + ":", x * 1.5, sy + height * 0.005);
    textAlign(CENTER);
    let yb = sy - h * 0.043;
    let hb = height * 0.045;
    let wb = w * 0.35;
    if (setting.type == "boolean") {
      // let wb = (w - width * 0.001 * 2) * 0.11;
      let xb = x * 0.6 + w - wb;
      if (detectMouseHitbox(xb, yb, wb, hb)) {
        fill((setting.value ? "#4caf50" : "#f44336") + "ee");
        buttonHover = () => {
          setting.value = !setting.value;
        };
      } else {
        fill((setting.value ? "#4caf50" : "#f44336") + "aa");
      }
      rect(xb, yb, wb, hb);
      let _text = setting.value ? "On" : "Off";
      fill(255);
      text(_text, xb + wb * 0.5, yb + hb * 0.7);
    } else if (setting.type == "select") {
      let option = setting.options.find((o) => o.value == setting.value);
      let index = setting.options.indexOf(option);
      // let wb = textWidth(setting.options[index].label) * 1.2;
      let xb = x * 0.6 + w - wb;
      if (detectMouseHitbox(xb, yb, wb, hb)) {
        fill(255, 100);
        buttonHover = () => {
          if (setting.id == "gameMode") {
            score = 0;
            highscore = 0;
          }
          if (index < setting.options.length - 1) {
            setting.value = setting.options[index + 1].value;
          } else {
            setting.value = setting.options[0].value;
          }
        };
      } else {
        fill(255, 50);
      }
      rect(xb, yb, wb, hb);
      fill(255, 30);
      let tw = wb / setting.options.length;
      rect(xb + index * tw, yb, tw, hb);
      fill(255);
      text(option.label, xb + wb * 0.5, yb + hb * 0.7);
    }
  });
  pop();
}

// Show keybindings:
function showControls() {
  addBox("Controls", width * 0.71, height * 0.45, width * 0.27, height * 0.24);
  push();
  fill(255);
  textSize(width * 0.013);
  textAlign(LEFT);
  text("Pause", width * 0.724, height * 0.58);
  text("Movement", width * 0.724, height * 0.615);
  text("Debug Info", width * 0.724, height * 0.65);
  textAlign(RIGHT);
  text("Escape", width * 0.724 + width * 0.24, height * 0.58);
  text("Arrow Keys / Mouse Buttons", width * 0.724 + width * 0.24, height * 0.615);
  text("B", width * 0.724 + width * 0.24, height * 0.65);
  pop();
}

// Generic box generator:
function addBox(title, x, y, w, h) {
  push();
  stroke(255, 150);
  fill(50, 125);
  strokeWeight(width * 0.001);
  rect(x, y, w, h);
  noStroke();
  fill(255);
  textSize(w * 0.07);
  textAlign(CENTER);
  text(title, x + w / 2, y + w * 0.09);
  pop();
}

// Generic button generator with custom click function (buttonHover):
function addButton(_text, x, y, _buttonHover) {
  let h = height * 0.1;
  textSize(h * 0.35);
  let w = textWidth("----------------------") * 1.2;
  x = x - w / 2;
  push();
  strokeWeight(width * 0.001);
  if (detectMouseHitbox(x, y, w, h)) {
    buttonHover = _buttonHover;
    stroke(255, 0, 0, 150);
    fill(75, 125);
  } else {
    if (buttonHover == _buttonHover) buttonHover = 0;
    stroke(255, 150);
    fill(50, 125);
  }
  rect(x, y, w, h);
  noStroke();
  fill(255);
  textAlign(CENTER);
  text(_text, x + w / 2, y + h / 2 + (w * 0.1) / 2.5);
  pop();
}

// Check if mouse button is clicked and either change game state on predefined
// buttonHover values or directly call custom buttonHover function:
function mouseClicked() {
  if (typeof buttonHover === "number") {
    if (buttonHover == 1) {
      gameState = 0;
      initGame();
    } else if (buttonHover == 2) {
      gameState = 1;
    } else if (buttonHover == 3) {
      gameState = 0;
    }
  } else if (typeof buttonHover === "function") {
    buttonHover();
  }
}

// Other keybindings:
function keyPressed() {
  if (keyCode === 27 && gameState != 1) {
    gameState = gameState == 0 ? 2 : 0;
  }
  // if (debug) {
  //   if (keyCode === 32) addFood();
  // }
  if (keyCode === 66) debug = !debug;
}

// Control snake head:
function detectControls() {
  if (keyIsDown(LEFT_ARROW) || (mouseIsPressed && mouseButton === LEFT)) snake.changeDir("left");
  if (keyIsDown(RIGHT_ARROW) || (mouseIsPressed && mouseButton === RIGHT)) snake.changeDir("right");
}

// Check if mouse is within hitbox:
function detectMouseHitbox(x, y, w, h) {
  return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

// Add a new random food object:
function addFood() {
  let offset = 40;
  foods.push(new Food(random(offset, width - offset), random(offset, height - offset)));
}

// Determine a new mission based on current score (to increase difficulty):
function newMission() {
  mission = {
    type: random(pickupList),
    amount: round(random(1, round(score / 2) + 2)),
  };
}

// Show game mode, score, highscore and current mission:
function showUI() {
  push();
  textAlign(RIGHT);
  fill(255);
  noStroke();
  textSize(width * 0.01);
  let gameModeLabel = settings.gameMode.options.find((o) => o.value == settings.gameMode.value).label;

  text(`Gamemode: ${gameModeLabel}`, width - width * 0.01, height * 0.04);
  text(`Score: ${score}`, width - width * 0.01, height * 0.07);
  text(`Highscore: ${highscore}`, width - width * 0.01, height * 0.1);
  if (settings.gameMode.value == "missions") {
    textAlign(CENTER);
    textSize(height * 0.04);
    strokeWeight(width * 0.001);
    stroke(0);
    text(`Mission: ${mission.amount}x ${pickupNames[mission.type]}`, width / 2, height * 0.1);
  }
  pop();
}

// Show debug screen (fps graph and various variables and their value):
function showDebug() {
  showOverlay();
  let graphLength = 500;
  let graphHeight = height * 0.16;
  fpsList.push(updates.fps);
  if (fpsList.length > graphLength) fpsList.shift();
  if (updates.fps > maxFPS) maxFPS = updates.fps;
  push();
  textSize(width * 0.008);
  fill(255);
  text("fps: " + updates.fps, width * 0.005, height * 0.03);

  // jshint ignore:start
  debugList.forEach((d, i) => {
    text(d + ": " + eval(d), width * 0.005, height * (0.03 + i * 0.02) + graphHeight);
  });
  // jshint ignore:end
  stroke(255);
  noFill();
  strokeWeight(2);
  line(0, graphHeight, graphLength, graphHeight);
  strokeWeight(1);
  line(0, graphHeight - maxFPS / 2, graphLength, graphHeight - maxFPS / 2);
  beginShape();
  fpsList.forEach((fps, i) => {
    vertex(i, graphHeight - fps / 2);
  });
  endShape();
  pop();
}

// Select center pixel of food image and use it as the color of a body part:
function generateImageAverageColor(image) {
  let halfWidth = round(image.width / 2);
  let halfHeight = round(image.height / 2);
  let pixel = image.get(halfWidth, halfHeight);
  return [pixel[0], pixel[1], pixel[2]];
}
