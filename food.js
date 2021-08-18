// jshint esversion: 9

class Food {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.oSize = 50;
    this.size = this.oSize;
    this.type = random(pickupList);
  }

  update() {
    this.show();
    this.pulsate();
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
