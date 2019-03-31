import { BaseTypes, DynamicObject } from 'lance-gg';

export default class Performer extends DynamicObject {

    static get netScheme() {
        return Object.assign({
            number: { type: BaseTypes.TYPES.INT16 },
            palette: { type: BaseTypes.TYPES.UINT8 },
            ammo: { type: BaseTypes.TYPES.INT16 },
            stage: { type: BaseTypes.TYPES.STRING },
            gridString: { type: BaseTypes.TYPES.STRING },
            melody: { type: BaseTypes.TYPES.STRING },
            bass: { type: BaseTypes.TYPES.STRING },
            perc: { type: BaseTypes.TYPES.STRING }
        }, super.netScheme);
    }

    constructor(gameEngine, options, props) {
        super(gameEngine, options, props);

        this.class = Performer;
        this.grid = [[]];
    }

    syncTo(other) {
        super.syncTo(other);
    }

    toString() {
        return `Performer::${super.toString()} number=${this.number} `;
    }
}
