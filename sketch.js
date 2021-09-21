// jshint esversion: 9

var settings = {
  gameMode: {
    id: "gameMode",
    label: "Spielmodus",
    value: "missions",
    type: "select",
    options: [
      {
        label: "Missionen",
        value: "missions",
      },
      {
        label: "Sammeln",
        value: "collect",
      },
    ],
  },
  hardcore: {
    id: "hardcore",
    label: "Hardcore",
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
        label: "Anhängen",
        value: "attach",
      },
      {
        label: "Sammeln",
        value: "stack",
      },
    ],
  },
  fruitType: {
    id: "fruitType",
    label: "Fruchtyp",
    value: "infinity",
    type: "select",
    options: [
      {
        label: "Dauerhaft",
        value: "infinity",
      },
      {
        label: "Verschwinden",
        value: "decay",
      },
    ],
  },
  magnet: {
    id: "magnet",
    label: "Erzimodus (Magnet)",
    value: false,
    type: "boolean",
  },
  eatBody: {
    id: "eatBody",
    label: "Körper Abbeißen",
    value: true,
    type: "boolean",
  },
  wallHit: {
    id: "wallHit",
    label: "Wände",
    value: true,
    type: "boolean",
  },
  pulsateBody: {
    id: "pulsateBody",
    label: "Körper Pulsieren",
    value: false,
    type: "boolean",
  },
  bodyLink: {
    id: "bodyLink",
    label: "Körperverbindungen",
    value: "same",
    type: "select",
    options: [
      {
        label: "Immer",
        value: "always",
      },
      {
        label: "Gleiche Farbe",
        value: "same",
      },
      {
        label: "Niemals",
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
var snake;
var foods = [];
var highscore = 0;
var score = 0;
var mission = {
  type: null,
  amount: 0,
};

const pickupList = ["apple", "mango", "lime", "grapes"];
const pickupNames = {
  apple: "Apfel",
  mango: "Mango",
  lime: "Limette",
  grapes: "Traube",
};
var pickups = {};
var logoImage;

var updates = {
  updateFlag: 0,
  fps: 0,
};
let fpsList = [];
let maxFPS = 0;

const debugObjectList = ["snake"];
const debugObjectListBlackList = ["snake.positions", "snake.body", "snake.bodyFade"];
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
var debugObjects = [];
var debug = false; // Default: false

function preload() {
  logoImage = loadImage("./assets/logo.png");
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
  initDebug();
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
  addFood();
  newMission();
}

function initDebug() {
  debugObjectList.forEach((d) => {
    let keys = [];
    Object.keys(eval(d)).forEach((key) => {
      if (!debugObjectListBlackList.includes(d + "." + key)) keys.push(key);
    });
    debugObjects = debugObjects.concat(keys.map((e) => d + "." + e));
  });
  debugList = [...debugList, ...debugObjects];
  Object.keys(settings).forEach((key) => {
    debugList.push("settings." + key + ".value");
  });
}

function draw() {
  frameRate(120);
  background(22);
  updateUpdates();
  if (gameState == 0) {
    buttonHover = 0;
    gameRun();
  } else if (gameState == 1) {
    gameMenu();
  } else if (gameState == 2) {
    gamePause();
  }
  if (debug) showDebug();
}

function updateUpdates() {
  if (updates.updateFlag < frameCount - 15) {
    updates.updateFlag = frameCount;
    updates.fps = round(frameRate());
  }
}

function gameMenu() {
  showOverlay();
  showSettings();
  addButton("Spiel Starten", width / 2, height * 0.48, 1);
  showControls();
  push();
  textAlign(CENTER);
  fill(255);
  textSize(height * 0.07);
  text("Snake", width * 0.54, height * 0.135);
  textSize(height * 0.04);
  text("von Frederik Shull", width / 2, height * 0.23);
  image(logoImage, width * 0.405, height * 0.04, height * 0.15, height * 0.15);
  pop();
}

function gamePause() {
  snake.show();
  for (let i = 0; i < foods.length; i++) {
    foods[i].show();
  }
  showOverlay();
  addButton("Spiel Fortsetzen", width / 2, height * 0.42, 3);
  addButton("Spiel Beenden", width / 2, height * 0.55, 2);
  showControls();
  push();
  stroke(255);
  fill(255);
  textAlign(CENTER);
  textSize(height * 0.07);
  text("PAUSE", width / 2, height * 0.1);
  pop();
}

function gameRun() {
  if (settings.gameMode.value == "collect") score = snake.body.length;
  let randomFood = {
    chance: settings.gameMode.value == "missions" ? 0.002 : 0.001,
    max: settings.gameMode.value == "missions" ? 16 : 8,
  };
  if (random() < randomFood.chance && foods.length < randomFood.max) addFood();
  snake.update();
  let decayedFood = [];
  let eaten = [];
  foods.forEach((food, i) => {
    if (settings.fruitType.value == "decay") food.decay();
    if (food.size > 10) {
      food.update();
      if (settings.magnet.value) snake.attractFood(food);
      if (snake.checkEat(food)) {
        if (highscore < snake.body.length) highscore = snake.body.length;
        eaten.push(i);
      }
    } else {
      decayedFood.push(i);
    }
  });
  decayedFood.forEach((f) => {
    foods.splice(f, 1);
    addFood();
  });
  eaten.forEach((e) => {
    foods.splice(e, 1);
    addFood();
  });
  if (settings.gameMode.value == "missions") {
    if (snake.checkMission(mission.type, mission.amount)) {
      score++;
      newMission();
    }
  }
  detectControls();
  showUI();
}

function showOverlay() {
  push();
  fill(0, 100);
  rect(0, 0, width, height);
  pop();
}

function showSettings() {
  let x = width * 0.015;
  let y = height * 0.25;
  let w = width * 0.27;
  let h = height * 0.6;
  addBox("Einstellungen", x, y, w, h);
  push();
  noStroke();
  textSize(h * 0.04);
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
    if (setting.type == "boolean") {
      let wb = (w - width * 0.001 * 2) * 0.11;
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
      let _text = setting.value ? "An" : "Aus";
      noStroke();
      fill(255);
      text(_text, xb + wb * 0.5, yb + hb * 0.7);
    } else if (setting.type == "select") {
      let option = setting.options.find((o) => o.value == setting.value);
      let index = setting.options.indexOf(option);
      let wb = textWidth(setting.options[index].label) * 1.2;
      let xb = x * 0.6 + w - wb;
      if (detectMouseHitbox(xb, yb, wb, hb)) {
        fill(255, 100);
        buttonHover = () => {
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
      noStroke();
      fill(255);
      text(option.label, xb + wb * 0.5, yb + hb * 0.7);
    }
  });
  pop();
}

function showControls() {
  addBox("Steuerung", width * 0.71, height * 0.45, width * 0.27, height * 0.24);
  push();
  fill(255);
  textSize(width * 0.013);
  textAlign(LEFT);
  text("Pause", width * 0.724, height * 0.58);
  text("Lenken", width * 0.724, height * 0.615);
  text("Debug Info", width * 0.724, height * 0.65);
  textAlign(RIGHT);
  text("Escape", width * 0.724 + width * 0.24, height * 0.58);
  text("Pfeiltasten / Maustasten", width * 0.724 + width * 0.24, height * 0.615);
  text("B", width * 0.724 + width * 0.24, height * 0.65);
  pop();
}

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
  }
  // if (debug) {
  //   if (keyCode === 32) addFood();
  // }
  if (keyCode === 66) debug = !debug;
}

function detectControls() {
  if (keyIsDown(LEFT_ARROW) || (mouseIsPressed && mouseButton === LEFT)) snake.changeDir("left");
  if (keyIsDown(RIGHT_ARROW) || (mouseIsPressed && mouseButton === RIGHT)) snake.changeDir("right");
}

function detectMouseHitbox(x, y, w, h) {
  return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

function addFood() {
  let offset = 40;
  foods.push(new Food(random(offset, width - offset), random(offset, height - offset)));
}

function newMission() {
  mission = {
    type: random(pickupList),
    amount: round(random(1, round(score / 2) + 2)),
  };
}

function showUI() {
  push();
  textAlign(RIGHT);
  fill(255);
  noStroke();
  textSize(width * 0.01);
  let gameModeLabel = settings.gameMode.options.find((o) => o.value == settings.gameMode.value).label;

  text(`Spielmodus: ${gameModeLabel}`, width - width * 0.01, height * 0.04);
  text(`Score: ${score}`, width - width * 0.01, height * 0.07);
  text(`Highscore: ${highscore}`, width - width * 0.01, height * 0.1);
  if (settings.gameMode.value == "missions") {
    textAlign(CENTER);
    textSize(height * 0.04);
    text(`Mission: ${mission.amount}x ${pickupNames[mission.type]}`, width / 2, height * 0.1);
  }
  pop();
}

function showDebug() {
  showOverlay();
  let graphHeight = height * 0.16;
  fpsList.push(updates.fps);
  if (fpsList.length > 200) fpsList.shift();
  if (updates.fps > maxFPS) maxFPS = updates.fps;
  push();
  textSize(width * 0.008);
  fill(255);
  text("fps: " + updates.fps, width * 0.005, height * 0.03);

  debugList.forEach((d, i) => {
    text(d + ": " + eval(d), width * 0.005, height * (0.03 + i * 0.02) + graphHeight);
  });
  stroke(255);
  noFill();
  strokeWeight(2);
  line(0, graphHeight, 200, graphHeight);
  strokeWeight(1);
  line(0, graphHeight - maxFPS / 2, 200, graphHeight - maxFPS / 2);
  beginShape();
  fpsList.forEach((fps, i) => {
    vertex(i, graphHeight - fps / 2);
  });
  endShape();
  pop();
}

function generateImageAverageColor(image) {
  let halfWidth = round(image.width / 2);
  let halfHeight = round(image.height / 2);
  let pixel = image.get(halfWidth, halfHeight);
  return [pixel[0], pixel[1], pixel[2]];
}
