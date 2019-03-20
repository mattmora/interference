import { BaseTypes, DynamicObject } from 'lance-gg';

export default class Egg extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            direction: { type: BaseTypes.TYPES.FLOAT32 },
        }, super.netScheme);
    }

    syncTo(other) {
        super.syncTo(other);
        this.direction = other.direction;
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        this.class = Egg;
        this.contents = null;

    };

    toString() {
        return `Egg::${super.toString()} direction=${this.direction}`;
    }
}
