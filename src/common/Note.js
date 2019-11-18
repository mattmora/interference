"use strict";

import { BaseTypes, DynamicObject } from 'lance-gg';

export default class Note extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            inputId: { type: BaseTypes.TYPES.INT32 },
            ownerId: { type: BaseTypes.TYPES.INT32 },
            palette: { type: BaseTypes.TYPES.UINT8 },
            sound: { type: BaseTypes.TYPES.STRING },
            pitch: { type: BaseTypes.TYPES.INT16 },
            dur: { type: BaseTypes.TYPES.STRING },
            vel: { type: BaseTypes.TYPES.INT16 },
            xPos: { type: BaseTypes.TYPES.INT16 },
            yPos: { type: BaseTypes.TYPES.INT16 },
            room: { type: BaseTypes.TYPES.STRING }
        }, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);

        this.ownerId = (props && props.ownerId) ? props.ownerId : -1;
        this.palette = (props && props.palette) ? props.palette : 0;
        this.sound = (props && props.sound) ? props.sound : 'melody';
        this.pitch = (props && props.pitch) ? props.pitch : 0;
        this.dur = (props && props.dur) ? props.dur : '1n';
        this.vel = (props && props.dur) ? props.vel : 1;
        this.xPos = (props && props.xPos) ? props.xPos : -1;
        this.yPos = (props && props.yPos) ? props.yPos : -1;
        this.animFrame = (props && props.animFrame) ? props.animFrame : 0;
    }

    move(xStep, yStep) {
        if (this.room == null) return;
        this.xPos += xStep;
        this.yPos += yStep;
        let rightBound = this.gameEngine.playersByRoom[this.room].length * this.gameEngine.paramsByRoom[this.room].playerWidth; //TODO should be width in cells
        let upperBound = Number(this.gameEngine.paramsByRoom[this.room].playerHeight);
        if (this.xPos >= rightBound) { this.xPos -= rightBound; }
        if (this.yPos >= upperBound) { this.yPos -= upperBound; }
        if (this.xPos < 0) { this.xPos += rightBound; }
        if (this.yPos < 0) { this.yPos += upperBound; }
    }

    paint() {
        if (this.room == null) return;
        let playerWidth = this.gameEngine.paramsByRoom[this.room].playerWidth;
        let playerHeight = this.gameEngine.paramsByRoom[this.room].playerHeight;
        let n = Math.floor(this.xPos / playerWidth);
        for (let p of this.gameEngine.queryPlayers({ number: n })) {

            p.grid[(this.xPos % playerWidth) + ((this.yPos % playerHeight) * playerWidth)] = this.palette;

        }
    }

    syncTo(other) {
        super.syncTo(other);
    }
}
