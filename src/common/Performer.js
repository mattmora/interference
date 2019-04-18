import { BaseTypes, DynamicObject, TwoVector } from 'lance-gg';

export default class Performer extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            number: { type: BaseTypes.TYPES.INT16 },
            palette: { type: BaseTypes.TYPES.UINT8 },
            ammo: { type: BaseTypes.TYPES.INT16 },
            direction: { type: BaseTypes.TYPES.UINT8 },
            stage: { type: BaseTypes.TYPES.STRING },
            gridString: { type: BaseTypes.TYPES.STRING },
            xPos: { type: BaseTypes.TYPES.INT16 },
            yPos: { type: BaseTypes.TYPES.INT16 },
            pitchSet: { type: BaseTypes.TYPES.UINT8 },
            active: { type: BaseTypes.TYPES.UINT8 },
        }, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);

        this.class = Performer;
        this.grid = [[]];
    }

    move(xStep, yStep) {
        this.xPos += xStep;
        this.yPos += yStep;
        let rightBound = this.gameEngine.playersByRoom[this._roomName].length * this.gameEngine.playerWidth;
        let leftBound = this.gameEngine.playerHeight;
        if (this.xPos >= rightBound) { this.xPos -= rightBound; }
        if (this.yPos >= leftBound) { this.yPos -= leftBound; }
        if (this.xPos < 0) { this.xPos += rightBound; }
        if (this.yPos < 0) { this.yPos += leftBound; }
        for (let n of this.gameEngine.queryNotes({ ownerId: this.playerId })) {
            //console.log(n);
            n.move(xStep, yStep);
        }
    }

    moveTo(xPos, yPos) {
        let xStep = xPos - this.xPos;
        let yStep = yPos - this.yPos;
        this.xPos = xPos;
        this.yPos = yPos;
        let rightBound = this.gameEngine.playersByRoom[this._roomName].length * this.gameEngine.playerWidth;
        let leftBound = this.gameEngine.playerHeight;
        if (this.xPos >= rightBound) { this.xPos -= rightBound; }
        if (this.yPos >= leftBound) { this.yPos -= leftBound; }
        if (this.xPos < 0) { this.xPos += rightBound; }
        if (this.yPos < 0) { this.yPos += leftBound; }
        for (let n of this.gameEngine.queryNotes({ ownerId: this.playerId })) {
            //console.log(n);
            n.move(xStep, yStep);
        }
    }

    paint() {
        for (let n of this.gameEngine.queryNotes({ ownerId: this.playerId })) {
            //console.log(n);
            n.paint();
        }   
    }

    syncTo(other) {
        super.syncTo(other);
    }

    toString() {
        return `Performer::${super.toString()} number=${this.number} `;
    }
}
