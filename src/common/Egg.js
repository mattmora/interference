import { BaseTypes, DynamicObject } from 'lance-gg';

export default class Egg extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            hp: { type: BaseTypes.TYPES.UINT8 }
        }, super.netScheme);
    }

    syncTo(other) {
        super.syncTo(other);
        //this.direction = other.direction;
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.class = Egg;
    }

    toString() {
        return `Egg::${super.toString()} position=${this.position}`;
    }
}
