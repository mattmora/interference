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
            xCell: { type: BaseTypes.TYPES.INT16 },
            yCell: { type: BaseTypes.TYPES.INT16 }
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
        this.xCell = (props && props.xCell) ? props.xCell : -1;
        this.yCell = (props && props.yCell) ? props.yCell : -1;
        this.animFrame = (props && props.animFrame) ? props.animFrame : 0;
    }

    syncTo(other) {
        super.syncTo(other);
    }
}
