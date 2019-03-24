import { BaseTypes, DynamicObject } from 'lance-gg';

export default class Performer extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            number: { type: BaseTypes.TYPES.INT16 },
            palette: { type: BaseTypes.TYPES.STRING },
            notestack: { type: BaseTypes.TYPES.STRING },
            rhythmstack: { type: BaseTypes.TYPES.STRING },
            ammo: { type: BaseTypes.TYPES.INT16 },
            stage: { type: BaseTypes.TYPES.STRING }
        }, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);

        this.class = Performer;
    }

    syncTo(other) {
        super.syncTo(other);
    }

    toString() {
        return `Performer::${super.toString()} number=${this.number} `;
    }
}
