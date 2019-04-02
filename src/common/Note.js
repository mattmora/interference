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
            yPos: { type: BaseTypes.TYPES.INT16 }
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
        this.xPos += xStep;
        this.yPos += yStep;
        let rightBound = this.gameEngine.playersByRoom[this._roomName].length * this.gameEngine.playerWidth; //TODO should be width in cells
        let leftBound = this.gameEngine.playerHeight;
        if (this.xPos >= rightBound) { this.xPos -= rightBound; }
        if (this.yPos >= leftBound) { this.yPos -= leftBound; }
        if (this.xPos < 0) { this.xPos += rightBound; }
        if (this.yPos < 0) { this.yPos += leftBound; }
    }

    paint() {
        let pal = this.gameEngine.paletteAttributes[this.palette];
        let n = Math.floor(this.xPos / pal.gridWidth);
        for (let p of this.gameEngine.queryPlayers({ number: n })) {
            p.grid = JSON.parse(p.gridString);
            p.grid[this.xPos % pal.gridWidth][this.yPos % pal.gridHeight] = this.palette;
            p.gridString = JSON.stringify(p.grid);
        }
    }

    syncTo(other) {
        super.syncTo(other);
    }
}
