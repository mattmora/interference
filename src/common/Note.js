export default class Note {

    constructor(props) {
        this.pitch = (props && props.pitch) ? props.pitch : 0;
        this.dur = (props && props.dur) ? props.dur : '1n';
        this.vel = (props && props.dur) ? props.vel : 1;
        this.step = (props && props.step) ? props.step : 0;
        this.cell = (props && props.cell) ? props.cell : { x: 0, y: 0 };
    }

    syncTo(other) {
        super.syncTo(other);
    }
}
