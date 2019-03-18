import ClientEngine from 'lance/ClientEngine';
import InterferenceRenderer from '../client/InterferenceRenderer';
import KeyboardControls from 'lance/controls/KeyboardControls'

const durs = ['4n', '8n', '6n'];

export default class InterferenceClientEngine extends ClientEngine {

    constructor(gameEngine, options) {
        super(gameEngine, options, InterferenceRenderer);
        this.transport = Tone.Transport;
        this.notestack = [];
    }

    start() {
        super.start()

        this.synth = new Tone.Synth({
            oscillator: {
                type: 'sine',
                modulationFrequency: 0.2
            },
            envelope: {
                attack: 0,
                decay: 0.1,
                sustain: 0,
                release: 0.1,
            }
        }).toMaster();

        this.sequence = new Tone.Sequence((time, note) => { this.synth.triggerAttackRelease(note, '8n', time) },
            this.notestack, durs[Math.floor(Math.random() * durs.length)]);

        console.log('binding keys');
        this.controls = new KeyboardControls(this);
        this.controls.bindKey('space', 'space');
 
        /*
        // show try-again button
        this.gameEngine.on('objectDestroyed', (obj) => {
            if (obj.playerId === gameEngine.playerId) {
                document.body.classList.add('lostGame');
                document.querySelector('#tryAgain').disabled = false;
            }
        });
        */
        /*
        this.mouseX = null;
        this.mouseY = null;

        document.addEventListener('mousemove', this.updateMouseXY.bind(this), false);
        document.addEventListener('mouseenter', this.updateMouseXY.bind(this), false);
        document.addEventListener('touchmove', this.updateMouseXY.bind(this), false);
        document.addEventListener('touchenter', this.updateMouseXY.bind(this), false);
        this.gameEngine.on('client__preStep', this.sendMouseAngle.bind(this));
        */
        
        /*
        // click event for "try again" button
        document.querySelector('#tryAgain').addEventListener('click', () => {
            this.socket.emit('requestRestart');
        }); */
        
        document.querySelector('#transportButton').addEventListener('click', (clickEvent) => {
            if (this.transport.state !== 'started') {
                this.transport.start();
                this.transport.seconds = this.syncClient.getSyncTime();
                clickEvent.currentTarget.value = 'Stop Transport'
            }   
            else {
                this.transport.pause();
                clickEvent.currentTarget.value = 'Start Transport'
            }
            //this.socket.emit('requestRestart');
        });
        /*
        document.querySelector('#reconnect').addEventListener('click', () => {
            window.location.reload();
        }); */

        //this.controls.bindKey('left', 'left', { repeat: true });
        //this.controls.bindKey('right', 'right', { repeat: true });
        //this.controls.bindKey('up', 'up', { repeat: true } );
    }

    connect(options = {}) {
        return super.connect().then(() => {
            this.socket.on('startPerformance', startTime => { 
                this.gameEngine.startPerformance(startTime); 
            });
        });
    }

    /*
    updateMouseXY(e) {
        e.preventDefault();
        if (e.touches) e = e.touches.item(0);
        this.mouseX = e.pageX;
        this.mouseY = e.pageY;
    }

    sendMouseAngle() {
        let player = this.gameEngine.world.queryObject({ playerId: this.gameEngine.playerId });
        if (this.mouseY === null || player === null) return;

        let mouseX = (this.mouseX - document.body.clientWidth/2) / this.zoom;
        let mouseY = (this.mouseY - document.body.clientHeight/2) / this.zoom;
        let dx = mouseY - player.position.y;
        let dy = mouseX - player.position.x;
        if (Math.sqrt(dx * dx + dy * dy) < 0.5) {
            this.sendInput(this.gameEngine.directionStop, { movement: true });
            return;
        }

        let angle = Math.atan2(dx, dy);
        this.sendInput(angle, { movement: true });
    }
    */
}
