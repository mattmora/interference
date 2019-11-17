"use strict";

import { BaseTypes, DynamicObject } from 'lance-gg';

export default class Egg extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            //number: { type: BaseTypes.TYPES.UINT8 },
            sound: { type: BaseTypes.TYPES.STRING },
            hp: { type: BaseTypes.TYPES.INT16 },
            room: { type: BaseTypes.TYPES.STRING }
        }, super.netScheme);
    }

    syncTo(other) {
        super.syncTo(other);
        //this.direction = other.direction;
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.class = Egg;
        this.animFrames = { spawn: 0, break: 0 };
        this.broken = false;
    }

    velocityAngle() {
        return Math.atan2(this.velocity.y, this.velocity.x);
    }

    toString() {
        return `Egg[${this.id}]`;
    }
}
