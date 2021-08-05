// jshint esversion: 9

class Food {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = 50;
    this.type = random(["apple", "mango", "lime", "grapes"]);
  }

  update() {
    this.show();
  }

  show() {
    push();
    fill("#f44336");
    image(assets[this.type], this.pos.x - this.size / 2, this.pos.y - this.size / 2, this.size, this.size * 1.1);
    pop();
  }
}
