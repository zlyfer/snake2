// jshint esversion: 9

class Snake {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.dir = createVector(1, 0).rotate(radians(random() * 360));
    this.body = [];
    this.deadBodies = [];
    this.positions = [];
    this.offset = 1.2;
    this.size = 35;
    this.bodyFade = { dir: 0, value: 0 };
    this.speedModifier = 1;
  }

  update() {
    this.changeDir();
    if (settings.pulsateBody.value) this.pulsateBody();
    this.showDeadBodies();
    this.show();
    this.move();
    this.moveBody();
    if (settings.eatBody.value) this.detectSelfBite();
    // this.detectDeadBodyBite();
    this.applySpeed();
  }

  show() {
    this.drawBody();
    this.draw();
  }

  attractFood(food) {
    let distance = dist(this.pos.x, this.pos.y, food.pos.x, food.pos.y);
    if (distance < 200) {
      food.pos = p5.Vector.lerp(food.pos, this.pos, 0.005);
    }
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
    stroke(255);
    pop();
  }

  drawBody() {
    if (settings.bodyLink.value == "always")
      for (let i = 0; i < this.body.length; i++) {
        let bodyPart1 = this.body[i];
        let bodyPart2 = this;
        if (i != 0) bodyPart2 = this.body[i - 1];
        this.drawBodyLink(bodyPart1, bodyPart2);
      }
    if (settings.bodyLink.value == "same") {
      if (this.body.length > 1) {
        let type = this.body[0].type;
        this.body.forEach((bodyPart, i) => {
          if (bodyPart.type == type) {
            if (i != 0) this.drawBodyLink(bodyPart, this.body[i - 1]);
          }
          type = bodyPart.type;
        });
      }
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

  drawBodyLink(bodyPart1, bodyPart2) {
    if (bodyPart1.pos.dist(bodyPart2.pos) < this.size * 2) {
      push();
      noFill();
      stroke([...pickups[bodyPart1.type].color, bodyPart1.fade]);
      beginShape();
      strokeWeight(this.getBodySize(bodyPart1.stack) / 2);
      vertex(bodyPart1.pos.x, bodyPart1.pos.y);
      vertex(bodyPart2.pos.x, bodyPart2.pos.y);
      endShape();
    }
  }

  move() {
    if (settings.hardcore.value && !settings.wallHit.value)
      if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) gameState = 1;

    if (settings.wallHit.value) {
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
    } else {
      if (this.pos.x < 0) {
        this.pos.x = width;
      }
      if (this.pos.x > width) {
        this.pos.x = 0;
      }
      if (this.pos.y < 0) {
        this.pos.y = height;
      }
      if (this.pos.y > height) {
        this.pos.y = 0;
      }
    }
    for (let i = 0; i < this.speedModifier; i++) {
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

      if (settings.bodyLink.value != "never") {
        noFill();
        stroke(255, fade);
        for (let j = 0; j < this.deadBodies[i].bodies.length - 1; j++) {
          strokeWeight(this.getBodySize(this.deadBodies[i].bodies[j].stack) / 2);
          if (
            this.deadBodies[i].bodies[j].pos.dist(this.deadBodies[i].bodies[j + 1].pos) < this.size * 2 &&
            (settings.bodyLink.value == "always" ||
              (settings.bodyLink.value == "same" &&
                this.deadBodies[i].bodies[j].type == this.deadBodies[i].bodies[j + 1].type))
          ) {
            beginShape();
            vertex(this.deadBodies[i].bodies[j].pos.x, this.deadBodies[i].bodies[j].pos.y);
            vertex(this.deadBodies[i].bodies[j + 1].pos.x, this.deadBodies[i].bodies[j + 1].pos.y);
            endShape();
          }
        }
      }

      noStroke();
      fill(fade);
      for (let j = 0; j < this.deadBodies[i].bodies.length; j++) {
        ellipse(
          this.deadBodies[i].bodies[j].pos.x,
          this.deadBodies[i].bodies[j].pos.y,
          this.getBodySize(this.deadBodies[i].bodies[j].stack)
        );
      }

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
