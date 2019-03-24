import { BaseTypes, DynamicObject } from 'lance-gg';

export default class Egg extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            number: { type: BaseTypes.TYPES.UINT8 },
            sound: { type: BaseTypes.TYPES.STRING },
            hp: { type: BaseTypes.TYPES.INT16 }
        }, super.netScheme);
    }

    syncTo(other) {
        super.syncTo(other);
        //this.direction = other.direction;
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.class = Egg;
        this.broken = false;
    }

    toString() {
        return `Egg[${this.id}]`;
    }
}
