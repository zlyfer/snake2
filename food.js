// jshint esversion: 9

class Food {
  constructor(x, y) {
    // Position:
    this.pos = createVector(x, y);
    // Original size (for pulsate):
    this.oSize = 40;
    // Size:
    this.size = this.oSize;
    // Fruit type:
    this.type = random(pickupList);
  }

  update() {
    this.show();
    // If enabled, pulsate:
    if (settings.fruitType.value == "infinity") this.pulsate();
  }

  decay() {
    this.size -= 0.03;
  }

  pulsate() {
    // Change size based on original size:
    this.size = this.oSize * (1 + cos(frameCount * 0.01) * 0.1);
  }

  show() {
    push();
    // Show sprite:
    image(pickups[this.type].image, this.pos.x - this.size / 2, this.pos.y - this.size / 2, this.size, this.size * 1.1);
    pop();
  }
}
