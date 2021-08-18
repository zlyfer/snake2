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
  snake = new Snake(width / 2, height / 2);
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

function addFood() {
  foods.push(new Food(random(25, width - 25), random(25, height - 25)));
}

function showFPS() {
  push();
  textSize(12);
  fill(255);
  text("FPS: " + round(frameRate()), 10, 20);
  text("Body Parts " + snake.body.length, 10, 35);
  text("Positions " + snake.positions.length, 10, 50);
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
