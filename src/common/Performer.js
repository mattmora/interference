import BaseTypes from 'lance/serialize/BaseTypes';
import DynamicObject from 'lance/serialize/DynamicObject';

export default class Performer extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            number: { type: BaseTypes.TYPES.INT16 },
        }, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);
        // position, velocity, width, height
        this.class = Performer;
        this.noteStack = [];
        this.rhythmStack = [];
    }

    syncTo(other) {
        super.syncTo(other);
        this.noteStack = other.noteStack;
        this.rhythmStack = other.rhythmStack;
    }

    toString() {
        return `Performer::${super.toString()} number=${this.number}`;
    }
}
