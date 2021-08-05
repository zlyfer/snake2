// jshint esversion: 9

var settings = {
  growMode: {
    id: "growMode",
    label: "Grow Mode",
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
};

var snake;
var foods = [];
var assets = {
  apple: null,
  mango: null,
  lime: null,
  grapes: null,
};

function preload() {
  assets.apple = loadImage("./assets/apple.png");
  assets.mango = loadImage("./assets/mango.png");
  assets.lime = loadImage("./assets/lime.png");
  assets.grapes = loadImage("./assets/grapes.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  snake = new Snake(width / 2, height / 2);
  // for (let i = 0; i < 300; i++)
  addFood();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function centerOfTwoVectors(v1, v2) {
  return createVector((v1.x + v2.x) / 2, (v1.y + v2.y) / 2);
}

function draw() {
  frameRate(120);
  background(22);
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
  showFPS();
  detectControls();
}

function addFood() {
  foods.push(new Food(random(25, width - 25), random(25, height - 25)));
}

function showFPS() {
  push();
  textSize(12);
  fill(255);
  text("FPS: " + round(frameRate()), 10, 20);
  // text("Body Parts " + snake.body.length, 10, 35);
  // text("Positions " + snake.positions.length, 10, 50);
  pop();
}

function keyPressed() {
  if (keyCode === 32) {
    // snake.addSegment();
    addFood();
  }
}

function detectControls() {
  if (keyIsDown(LEFT_ARROW) || (mouseIsPressed && mouseButton === LEFT)) snake.changeDir("left");
  if (keyIsDown(RIGHT_ARROW) || (mouseIsPressed && mouseButton === RIGHT)) snake.changeDir("right");
}
