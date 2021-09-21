// jshint esversion: 9

class Food {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.oSize = 40;
    this.size = this.oSize;
    this.type = random(pickupList);
  }

  update() {
    this.show();
    if (settings.fruitType.value == "infinity") this.pulsate();
  }

  decay() {
    this.size -= 0.03;
  }

  pulsate() {
    this.size = this.oSize * (1 + cos(frameCount * 0.01) * 0.1);
  }

  show() {
    push();
    fill("#f44336");
    image(pickups[this.type].image, this.pos.x - this.size / 2, this.pos.y - this.size / 2, this.size, this.size * 1.1);
    pop();
  }
}
