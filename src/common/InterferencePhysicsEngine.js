// A copy of lance.gg SimplePhysicEngine with collision removed

import { TwoVector } from "lance-gg";

let dv = new TwoVector();
let dx = new TwoVector();

class InterferencePhysicsEngine {
  constructor(options) {
    this.options = options;
    this.gameEngine = options.gameEngine;

    this.gravity = new TwoVector(0, 0);

    if (options.gravity) this.gravity.copy(options.gravity);
  }

  // a single object advances, based on:
  // isRotatingRight, isRotatingLeft, isAccelerating, current velocity
  // wrap-around the world if necessary
  objectStep(o, dt) {
    console.log(dt);
    // calculate factor
    if (dt === 0) return;

    if (dt) dt /= 1 / 60;
    else dt = 1;

    // TODO: worldsettings is a hack.  Find all places which use it in all games
    // and come up with a better solution.  for example an option sent to the physics Engine
    // with a "worldWrap:true" options
    // replace with a "worldBounds" parameter to the PhysicsEngine constructor

    let worldSettings = this.gameEngine.worldSettings;

    // TODO: remove this code in version 4: these attributes are deprecated
    if (o.isRotatingRight) {
      o.angle += o.rotationSpeed;
    }
    if (o.isRotatingLeft) {
      o.angle -= o.rotationSpeed;
    }

    // TODO: remove this code in version 4: these attributes are deprecated
    if (o.angle >= 360) {
      o.angle -= 360;
    }
    if (o.angle < 0) {
      o.angle += 360;
    }

    // TODO: remove this code in version 4: these attributes are deprecated
    if (o.isAccelerating) {
      let rad = o.angle * (Math.PI / 180);
      dv.set(Math.cos(rad), Math.sin(rad)).multiplyScalar(o.acceleration).multiplyScalar(dt);
      o.velocity.add(dv);
    }

    // apply gravity
    if (!o.isStatic) o.velocity.add(this.gravity);

    let velMagnitude = o.velocity.length();
    if (o.maxSpeed !== null && velMagnitude > o.maxSpeed) {
      o.velocity.multiplyScalar(o.maxSpeed / velMagnitude);
    }

    o.isAccelerating = false;
    o.isRotatingLeft = false;
    o.isRotatingRight = false;

    dx.copy(o.velocity).multiplyScalar(dt);
    o.position.add(dx);

    o.velocity.multiply(o.friction);

    // wrap around the world edges
    if (worldSettings.worldWrap) {
      if (o.position.x >= worldSettings.width) {
        o.position.x -= worldSettings.width;
      }
      if (o.position.y >= worldSettings.height) {
        o.position.y -= worldSettings.height;
      }
      if (o.position.x < 0) {
        o.position.x += worldSettings.width;
      }
      if (o.position.y < 0) {
        o.position.y += worldSettings.height;
      }
    }
  }

  // entry point for a single step of the Simple Physics
  step(dt, objectFilter) {
    // each object should advance
    let objects = this.gameEngine.world.objects;
    for (let objId of Object.keys(objects)) {
      // shadow objects are not re-enacted
      let ob = objects[objId];
      if (!objectFilter(ob)) continue;

      // run the object step
      this.objectStep(ob, dt);
    }
  }
}

export default InterferencePhysicsEngine;
