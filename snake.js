// jshint esversion: 9

class Snake {
  constructor(x, y) {
    this.speedModifier = 2;
    this.pos = createVector(x, y);
    this.dir = createVector(1, 0);
    // Körper und Positionen:
    this.body = [];
    this.deadBodies = [];
    this.positions = [];
    // Konstanten:
    this.speed = 1;
    this.offset = 1.2;
    this.size = 35;
    this.bodyFade = { dir: 0, value: 0 };
  }
  update() {
    this.changeDir();
    this.pulsateBody();
    this.drawBody();
    this.draw();
    this.move();
    this.moveBody();
    this.showDeadBodies();
    this.detectSelfBite();
    // this.detectDeadBodyBite();
    this.applySpeed();
  }

  checkEat(food) {
    let distance = dist(this.pos.x, this.pos.y, food.pos.x, food.pos.y);
    if (distance < food.size) {
      this.addSegment(food.type);
      return true;
    } else return false;
  }

  addSegment(type) {
    if (settings.growMode.value == "attach") {
      this.attachSegment(type);
    } else if (settings.growMode.value == "stack") {
      let stacked = false;
      for (let i = 0; i < this.body.length; i++) {
        if (this.body[i].type == type)
          if (this.body[i].stack < 3) {
            this.body[i].stack++;
            stacked = true;
            return;
          }
      }
      if (!stacked) {
        this.attachSegment(type);
      }
    }
  }

  attachSegment(type) {
    let index = this.positions.length - this.size * this.offset * (this.body.length + 1);
    // for (let i = 0; i < this.body.length; i++) {
    // this.body[i].fade = 255;
    // }
    this.body.push({
      pos: this.positions[index],
      order: this.body.length + 1,
      fade: 255,
      stack: 1,
      type,
    });
  }

  applySpeed() {
    this.speedModifier = round(map(this.body.length, 0, 100, 2, 6));
  }

  changeDir(dir) {
    if (dir == "left") this.dir.rotate(-PI / 80);
    if (dir == "right") this.dir.rotate(PI / 80);
  }

  pulsateBody() {
    let max = this.body.length * 20;
    if (this.bodyFade.dir == 0) this.bodyFade.value++;
    else this.bodyFade.value--;
    if (this.bodyFade.value >= max) this.bodyFade.dir = 1;
    if (this.bodyFade.value <= 0) this.bodyFade.dir = 0;
    for (let i = 0; i < this.body.length; i++) {
      let bodyPart = this.body[i];
      bodyPart.fade = map(this.bodyFade.value * (i + 1), 0, max, 0, 255);
    }
  }

  draw() {
    push();
    noStroke();
    fill("#689f38");
    circle(this.pos.x, this.pos.y, this.size);
    pop();
  }

  drawBody() {
    for (let i = 0; i < this.body.length; i++) {
      let bodyPart = this.body[i];
      push();
      noFill();
      stroke([...pickups[bodyPart.type].color, bodyPart.fade]);
      beginShape();
      strokeWeight(this.getBodySize(bodyPart.stack) / 2);
      if (i == 0) vertex(this.pos.x, this.pos.y);
      else vertex(this.body[i - 1].pos.x, this.body[i - 1].pos.y);
      vertex(bodyPart.pos.x, bodyPart.pos.y);
      endShape();
    }

    for (let i = 0; i < this.body.length; i++) {
      let bodyPart = this.body[i];
      pop();
      push();
      noStroke();
      fill([...pickups[bodyPart.type].color, bodyPart.fade]);
      ellipse(bodyPart.pos.x, bodyPart.pos.y, this.getBodySize(bodyPart.stack));
      pop();
    }
  }

  move() {
    for (let i = 0; i < this.speedModifier; i++) {
      if (this.pos.x < 0 || this.pos.x > width) {
        this.pos.x = this.pos.x > width ? width : 0;
        this.dir.x = -this.dir.x;
        this.killBody(0);
      }
      if (this.pos.y < 0 || this.pos.y > height) {
        this.pos.y = this.pos.y > height ? height : 0;
        this.dir.y = -this.dir.y;
        this.killBody(0);
      }
      this.positions.push(this.pos.copy());
      if (this.positions.length > 100000) this.positions.shift();
      this.pos.add(this.dir);
    }
  }

  moveBody() {
    for (let i = 0; i < this.body.length; i++) {
      let index = this.positions.length - this.size * this.offset * this.body[i].order;
      this.body[i].pos = this.positions[index];
    }
  }

  detectSelfBite() {
    let biten = null;
    for (let i = 0; i < this.body.length; i++) {
      if (dist(this.pos.x, this.pos.y, this.body[i].pos.x, this.body[i].pos.y) < this.size) {
        biten = i;
        break;
      }
    }
    if (biten) this.killBody(biten);
  }

  detectDeadBodyBite() {
    for (let i = 0; i < this.deadBodies.length; i++) {
      for (let j = 0; j < this.deadBodies[i].bodies.length; j++) {
        let center = this.deadBodies[i].bodies[j].pos.copy();
        if (j < this.deadBodies[i].bodies.length - 1)
          center = createVector(
            (this.deadBodies[i].bodies[j].pos.x + this.deadBodies[i].bodies[j + 1].pos.x) / 2,
            (this.deadBodies[i].bodies[j].pos.y + this.deadBodies[i].bodies[j + 1].pos.y) / 2
          );
        if (
          dist(this.pos.x, this.pos.y, this.deadBodies[i].bodies[j].pos.x, this.deadBodies[i].bodies[j].pos.y) <= 8 ||
          dist(this.pos.x, this.pos.y, center.x, center.y) <= 8
        ) {
          this.killBody(0);
          break;
        }
      }
    }
  }

  killBody(index) {
    this.deadBodies.push({
      timer: 0,
      bodies: this.body.splice(index),
    });
  }

  showDeadBodies() {
    push();
    for (let i = 0; i < this.deadBodies.length; i++) {
      let fade = map(this.deadBodies[i].timer, 0, 400, 200, 100);

      // Link zwischen Körpern:
      noFill();
      stroke(255, fade);
      for (let j = 0; j < this.deadBodies[i].bodies.length - 1; j++) {
        strokeWeight(this.getBodySize(this.deadBodies[i].bodies[j].stack) / 2);
        beginShape();
        vertex(this.deadBodies[i].bodies[j].pos.x, this.deadBodies[i].bodies[j].pos.y);
        vertex(this.deadBodies[i].bodies[j + 1].pos.x, this.deadBodies[i].bodies[j + 1].pos.y);
        endShape();
      }

      // Körper:
      noStroke();
      fill(fade);
      for (let j = 0; j < this.deadBodies[i].bodies.length; j++) {
        ellipse(
          this.deadBodies[i].bodies[j].pos.x,
          this.deadBodies[i].bodies[j].pos.y,
          this.getBodySize(this.deadBodies[i].bodies[j].stack)
        );
      }

      // Tote Körper löschen:
      this.deadBodies[i].timer++;
      if (this.deadBodies[i].timer > 400) this.deadBodies.splice(i, 1);
    }
    pop();
  }

  getBodySize(stack) {
    if (settings.growMode.value == "attach") return this.size;
    else if (settings.growMode.value == "stack") return map(stack, 1, 3, this.size * 0.5, this.size * 0.9);
  }
}
