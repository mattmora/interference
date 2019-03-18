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

        this.class = Performer;
        this.notestack = [];
        this.rhythmstack = [];
    }

    syncTo(other) {
        super.syncTo(other);
        this.notestack = other.notestack;
        this.rhythmstack = other.rhythmstack;
    }

    toString() {
        return `Performer::${super.toString()} number=${this.number} `;
    }
}
