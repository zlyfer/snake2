// jshint esversion: 9

var settings = {
  bodyLink: {
    id: "bodyLink",
    label: "Körperverbindungen",
    value: true,
    type: "boolean",
  },
  pulsateBody: {
    id: "pulsateBody",
    label: "Körper Pulsieren",
    value: false,
    type: "boolean",
  },
  growMode: {
    id: "growMode",
    label: "Wachstumsmodus",
    value: "attach",
    type: "select",
    options: [
      {
        label: "Direkt Anhängen",
        value: "attach",
      },
      {
        label: "Sammeln",
        value: "stack",
      },
    ],
  },
};

// 0 = running, 1 = start, 2 = pause
var gameState = 1;
// 0 = none, 1 = start/exit button
// NONE = 0, START = 1, END = 2, RESUME = 3
var buttonHover = 0;
var snake;
var foods = [];
var pickupList = ["apple", "mango", "lime", "grapes"];
var pickups = {};

function preload() {
  pickupList.forEach((pickup) => {
    pickups[pickup] = {};
    pickups[pickup].image = loadImage(`./assets/pickups/${pickup}.png`);
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pickupList.forEach((pickup) => {
    pickups[pickup].color = generateImageAverageColor(pickups[pickup].image);
  });
  initGame();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function centerOfTwoVectors(v1, v2) {
  return createVector((v1.x + v2.x) / 2, (v1.y + v2.y) / 2);
}

function initGame() {
  foods = [];
  snake = new Snake(width / 2, height / 2);
  addFood();
}

function draw() {
  frameRate(120);
  background(22);
  if (gameState == 0) {
    buttonHover = 0;
    gameRun();
    showInfo();
  } else if (gameState == 1) {
    gameMenu();
  } else if (gameState == 2) {
    gamePause();
  }
}

function gameMenu() {
  showOverlay();
  showSettings();
  addButton("Spiel Starten", width / 2, height / 2 - 20, 1);
  showControls();
  push();
  stroke(255);
  fill(255);
  textSize(50);
  text("Snake", width / 2 - 70, 100);
  textSize(40);
  text("von Frederik Shull", width / 2 - 160, 150);
  pop();
}

function gamePause() {
  snake.show();
  for (let i = 0; i < foods.length; i++) {
    foods[i].show();
  }
  showOverlay();
  addButton("Spiel Fortsetzen", width / 2, height / 2 - 75, 3);
  addButton("Spiel Beenden", width / 2, height / 2 + 25, 2);
  showControls();
  push();
  textSize(50);
  stroke(255);
  fill(255);
  text("PAUSE", width / 2 - 82, 100);
  pop();
}

function gameRun() {
  snake.update();
  let eaten = [];
  for (let i = 0; i < foods.length; i++) {
    let food = foods[i];
    food.update();
    if (snake.checkEat(food)) eaten.push(i);
  }
  eaten.forEach((e) => {
    addFood();
    foods.splice(e, 1);
  });
  detectControls();
}

function showOverlay() {
  push();
  fill(0, 100);
  rect(0, 0, width, height);
  pop();
}

function showSettings() {
  let x = 50;
  let y = 250;
  let w = 500;
  let h = 550;
  addBox("Einstellungen", x, y, w, h);
  push();
  noStroke();
  textSize(20);
  Object.keys(settings).forEach((id, index) => {
    let setting = settings[id];
    let sy = index * 40 + y + 135;
    if (index % 2 == 0) fill(0, 25);
    else fill(0, 50);
    rect(x + 1, sy - 27, w - 2, 40);
    fill(255);
    textAlign(LEFT);
    text(setting.label + ":", x + 25, sy);
    textAlign(CENTER);
    if (setting.type == "boolean") {
      let _text = setting.value ? "An" : "Aus";
      text(_text, w + x - 40, sy);
      if (detectMouseHitbox(w + x - 70, sy - 23, 60, 34)) {
        fill(255, 100);
        buttonHover = () => {
          setting.value = !setting.value;
        };
      } else {
        fill(255, 50);
      }
      rect(w + x - 70, sy - 23, 60, 34);
    }
  });
  pop();
}

function showControls() {
  addBox("Steuerung", width - 550, 400, 500, 200);
  push();
  translate(0, 125);
  fill(255);
  textSize(25);
  noStroke();
  textAlign(LEFT);
  text("Pause", width - 530, 400);
  text("Lenken", width - 530, 440);
  textAlign(RIGHT);
  text("Escape", width - 70, 400);
  text("Pfeiltasten / Maustasten", width - 70, 440);
  pop();
}

function addBox(title, x, y, w, h) {
  push();
  stroke(255, 150);
  fill(50, 125);
  rect(x, y, w, h);
  stroke(255);
  fill(255);
  textSize(35);
  textAlign(CENTER);
  text(title, x + w / 2, y + 50);
  pop();
}

function addButton(_text, x, y, _buttonHover) {
  let w = 200;
  let h = 80;
  x = x - w / 2;
  push();
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
  textSize(20);
  textAlign(CENTER);
  text(_text, x + 100, y + 40 + 6);
  pop();
}

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

function keyPressed() {
  if (keyCode === 27 && gameState != 1) {
    gameState = gameState == 0 ? 2 : 0;
  } else if (keyCode === 32) {
    addFood();
  }
}

function detectControls() {
  if (keyIsDown(LEFT_ARROW) || (mouseIsPressed && mouseButton === LEFT)) snake.changeDir("left");
  if (keyIsDown(RIGHT_ARROW) || (mouseIsPressed && mouseButton === RIGHT)) snake.changeDir("right");
}

function detectMouseHitbox(x, y, w, h) {
  return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

function addFood() {
  foods.push(new Food(random(25, width - 25), random(25, height - 25)));
}

function showInfo() {
  push();
  textSize(12);
  fill(255);
  text("FPS: " + round(frameRate()), 10, 20);
  text("Body Parts: " + snake.body.length, 10, 35);
  text("Positions: " + snake.positions.length, 10, 50);
  pop();
}

function generateImageAverageColor(image) {
  let xMax = round(image.width * 0.1);
  let yMax = round(image.height * 0.1);
  let halfWidth = round(image.width / 2);
  let halfHeight = round(image.height / 2);
  let r = 0;
  let g = 0;
  let b = 0;
  for (let x = halfWidth - xMax; x < halfWidth + xMax; x++) {
    for (let y = halfHeight - yMax; y < halfHeight + yMax; y++) {
      let pixel = image.get(x, y);
      r = pixel[0];
      g = pixel[1];
      b = pixel[2];
    }
  }
  return [r, g, b];
}
