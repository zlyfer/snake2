// jshint esversion: 9

class Snake {
  constructor(x, y) {
    this.pos = createVector(x, y);
    // Starting direction with random angle:
    this.dir = createVector(1, 0).rotate(radians(random() * 360));
    // Body parts:
    this.body = [];
    // Temporary dead bodies:
    this.decayBodies = [];
    // All positions of the head for the body parts to follow:
    this.positions = [];
    // Offset between body parts:
    this.offset = 1.2;
    // Size of head and body parts:
    this.size = 30;
    // Fading flags for settings.pulsateBody:
    this.bodyFade = { dir: 0, value: 0 };
    // Speed modifier (will be change automatically by applySpeed()):
    this.speedModifier = 1;
  }

  update() {
    // Change bodyFade values:
    if (settings.pulsateBody.value) this.pulsateBody();
    this.show();
    this.move();
    this.moveBody();
    if (settings.eatBody.value) this.detectSelfBite();
    // this.detectDecayBodyBite();
    // Apply speed modifier based on how body part count:
    this.applySpeed();
    // if (debug) this.debug();
  }

  show() {
    // Draw decayed bodies:
    this.drawDecayBodies();
    // Draw body parts:
    this.drawBody();
    // Draw head:
    this.draw();
  }

  debug() {
    // Draw all positions (laggy!):
    push();
    stroke(255);
    strokeWeight(2);
    noFill();
    beginShape();
    this.positions.forEach((p) => {
      vertex(p.x, p.y);
    });
    endShape();
    pop();
  }

  attractFood(food) {
    // "Magnet" mode:
    let distance = dist(this.pos.x, this.pos.y, food.pos.x, food.pos.y);
    if (distance < 200)
      // Attract towards snake head:
      food.pos = p5.Vector.lerp(food.pos, this.pos, 0.005);
  }

  checkEat(food) {
    // Check if head is on food:
    let distance = dist(this.pos.x, this.pos.y, food.pos.x, food.pos.y);
    if (distance < food.size) {
      // Add a body part based on the fruit type:
      this.addSegment(food.type);
      return true;
    } else return false;
  }

  checkMission(type, amount) {
    let _amount = 0;
    let missionAchieved = false;
    // Check if if _amount of body parts next to each other are of the same type:
    for (let i = 0; i < this.body.length; i++) {
      if (this.body[i].type == type) {
        _amount++;
        if (_amount == amount) {
          missionAchieved = true;
          this.killBody(i - _amount + 1, _amount, false);
          break;
        }
      } else _amount = 0;
    }
    return missionAchieved;
  }

  addSegment(type) {
    // Just add a body part:
    if (settings.growMode.value == "attach") {
      this.attachSegment(type);
    } else if (settings.growMode.value == "stack") {
      // Check if there is already a same body part with a stack count less than 3 and then increase stack or add a new body part with stack count 1:
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
    // Add a body part to the end of the body with correct position based on positions array:
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
    // Change speed based on length of body:
    this.speedModifier = round(map(this.body.length, 0, 100, 2, 6));
  }

  changeDir(dir) {
    // Change direction of the head:
    if (dir == "left") this.dir.rotate(-PI / 80);
    if (dir == "right") this.dir.rotate(PI / 80);
  }

  pulsateBody() {
    // Fade body parts taking body length in account:
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
    // Draw head:
    push();
    noStroke();
    fill("#689f38");
    circle(this.pos.x, this.pos.y, this.size);
    stroke(255);
    pop();
  }

  drawBody() {
    // Draw links between all body parts:
    if (settings.bodyLink.value == "always")
      for (let i = 0; i < this.body.length; i++) {
        let bodyPart1 = this.body[i];
        let bodyPart2 = this;
        if (i != 0) bodyPart2 = this.body[i - 1];
        this.drawBodyLink(bodyPart1, bodyPart2);
      }
    // Draw links between same body parts next to each other:
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

    // Draw living body parts on top of links:
    for (let i = 0; i < this.body.length; i++) {
      let bodyPart = this.body[i];
      push();
      noStroke();
      fill([...pickups[bodyPart.type].color, bodyPart.fade]);
      ellipse(bodyPart.pos.x, bodyPart.pos.y, this.getBodySize(bodyPart.stack));
      pop();
    }
  }

  drawBodyLink(bodyPart1, bodyPart2) {
    // Draw link between two living body parts:
    if (bodyPart1.pos.dist(bodyPart2.pos) < this.size * 2) {
      push();
      noFill();
      stroke([...pickups[bodyPart1.type].color, bodyPart1.fade]);
      beginShape();
      strokeWeight(this.getBodySize(bodyPart1.stack) / 2);
      vertex(bodyPart1.pos.x, bodyPart1.pos.y);
      vertex(bodyPart2.pos.x, bodyPart2.pos.y);
      endShape();
      pop();
    }
  }

  move() {
    if (settings.wallHit.value == "death") {
      // Check if snake head is touching a wall:
      if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) gameState = 1;
    } else if (settings.wallHit.value == "bounce") {
      // Check if snake head is touching a wall on x-axis, bounce and kill body parts:
      if (this.pos.x < 0 || this.pos.x > width) {
        this.pos.x = this.pos.x > width ? width : 0;
        this.dir.x = -this.dir.x;
        this.killBody(0);
      }
      // Check if snake head is touching a wall on y-axis, bounce and kill body parts:
      if (this.pos.y < 0 || this.pos.y > height) {
        this.pos.y = this.pos.y > height ? height : 0;
        this.dir.y = -this.dir.y;
        this.killBody(0);
      }
    } else if (settings.wallHit.value == "infinity") {
      // Check if position is crossing a wall and move to the other side:
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
    // Move snake depending on speedModifier
    for (let i = 0; i < this.speedModifier; i++) {
      // Save current head position to positions array:
      this.positions.push(this.pos.copy());
      // Limit length of positions array (100000 should be enough?):
      if (this.positions.length > 100000) this.positions.shift();
      this.pos.add(this.dir);
    }
  }

  moveBody() {
    // Trace body parts along the positions array:
    for (let i = 0; i < this.body.length; i++) {
      let index = this.positions.length - this.size * this.offset * this.body[i].order;
      this.body[i].pos = this.positions[index];
    }
  }

  detectSelfBite() {
    // Detect if the head is touching a body part:
    let biten = null;
    for (let i = 0; i < this.body.length; i++) {
      if (dist(this.pos.x, this.pos.y, this.body[i].pos.x, this.body[i].pos.y) < this.size) {
        biten = i;
        break;
      }
    }
    // Kill body parts at the point of self-bite:
    if (biten) this.killBody(biten);
  }

  detectDecayBodyBite() {
    // Detect if the head is touching a decayed body part:
    for (let i = 0; i < this.decayBodies.length; i++) {
      for (let j = 0; j < this.decayBodies[i].bodies.length; j++) {
        let center = this.decayBodies[i].bodies[j].pos.copy();
        if (j < this.decayBodies[i].bodies.length - 1)
          center = createVector(
            (this.decayBodies[i].bodies[j].pos.x + this.decayBodies[i].bodies[j + 1].pos.x) / 2,
            (this.decayBodies[i].bodies[j].pos.y + this.decayBodies[i].bodies[j + 1].pos.y) / 2
          );
        if (
          dist(this.pos.x, this.pos.y, this.decayBodies[i].bodies[j].pos.x, this.decayBodies[i].bodies[j].pos.y) <= 8 ||
          dist(this.pos.x, this.pos.y, center.x, center.y) <= 8
        ) {
          this.killBody(0);
          break;
        }
      }
    }
  }

  killBody(index, length = this.body.length, dead = true) {
    // Splice body and add the dead body parts to the decayBodies array:
    if (dead) {
      this.decayBodies.push({
        timer: 0,
        bodies: this.body.splice(index, length),
        decayType: "dead",
      });
    } else {
      // Only splice body and sort body parts:
      this.body.splice(index, length);
      this.body.forEach((bodyPart, i) => {
        bodyPart.order = i + 1;
      });
    }
  }

  drawDecayBodies() {
    push();
    for (let i = 0; i < this.decayBodies.length; i++) {
      // Used for fading the dead body parts before they disappear:
      let fade = map(this.decayBodies[i].timer, 0, 400, 200, 100);

      if (settings.bodyLink.value != "never") {
        noFill();
        stroke(255, fade);
        for (let j = 0; j < this.decayBodies[i].bodies.length - 1; j++) {
          strokeWeight(this.getBodySize(this.decayBodies[i].bodies[j].stack) / 2);
          // Check if either all dead body parts should be linked or only neighbours of the same type:
          if (
            this.decayBodies[i].bodies[j].pos.dist(this.decayBodies[i].bodies[j + 1].pos) < this.size * 2 &&
            (settings.bodyLink.value == "always" ||
              (settings.bodyLink.value == "same" &&
                this.decayBodies[i].bodies[j].type == this.decayBodies[i].bodies[j + 1].type))
          ) {
            // Draw a line between the body parts:
            beginShape();
            vertex(this.decayBodies[i].bodies[j].pos.x, this.decayBodies[i].bodies[j].pos.y);
            vertex(this.decayBodies[i].bodies[j + 1].pos.x, this.decayBodies[i].bodies[j + 1].pos.y);
            endShape();
          }
        }
      }

      noStroke();
      fill(fade);
      // Draw dead body parts on top of links:
      for (let j = 0; j < this.decayBodies[i].bodies.length; j++) {
        ellipse(
          this.decayBodies[i].bodies[j].pos.x,
          this.decayBodies[i].bodies[j].pos.y,
          this.getBodySize(this.decayBodies[i].bodies[j].stack)
        );
      }

      // Remove dead body parts when they've been faded out:
      this.decayBodies[i].timer++;
      if (this.decayBodies[i].timer > 400) this.decayBodies.splice(i, 1);
    }
    pop();
  }

  getBodySize(stack) {
    // Get the size of a body part based on its stack count:
    if (settings.growMode.value == "attach") return this.size;
    else if (settings.growMode.value == "stack") return map(stack, 1, 3, this.size * 0.5, this.size * 0.9);
  }
}
