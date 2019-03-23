import { ClientEngine, KeyboardControls } from 'lance-gg';
import SyncClient from '@ircam/sync/client';
import InterferenceRenderer from '../client/InterferenceRenderer';
import Performer from '../common/Performer';
import Egg from '../common/Egg';
import { Transport, Sequence, Synth, NoiseSynth, FMSynth } from 'tone';
import { Reverb, BitCrusher, AutoWah } from 'tone';

const durs = ['4n', '8n', '6n'];
let noteIndex = 0;
let rhythmIndex = 0;
let viewLock = false;

export default class InterferenceClientEngine extends ClientEngine {

    /// INITIALIZATION AND CONNECTION
    constructor(gameEngine, options) {
        super(gameEngine, options, InterferenceRenderer);

        this.syncClient = null;
        this.transport = Transport;
        this.player = null;
        this.room = null;
        this.players = [];
        this.eggs = [];
        this.eggSounds = {};
        this.performanceView = false;
        this.controls = new KeyboardControls(this);
        this.prevState = 'setup';

        this.gameEngine.on('client__postStep', this.stepLogic.bind(this));
        this.gameEngine.on('eggBounce', e => { this.onEggBounce(e) });
    }

    start() {
        super.start()

        let btn = document.getElementById('startButton');
        let roomNameInput = document.getElementById('roomNameInput');
        let roomNameErrorText = document.querySelector('#startMenu .room-input-error');

        btn.onclick = () => {
            let regex = /^\w+$/;
            if (regex.exec(roomNameInput.value) !== null) {
                this.assignToRoom(roomNameInput.value.substring(0, 20));
            } else {
                roomNameErrorText.style.display = 'inline';
            }
        };

        // LOCAL CONTROLS
        // Any inputs that do nothing server-side (i.e. doesn't need to be known by other players)
        document.addEventListener('keypress', e => {
            console.log(e.code);
            if (document.activeElement === roomNameInput) {
                if (e.code === 'Enter') {
                    let regex = /^\w+$/;
                    if (regex.exec(roomNameInput.value) !== null) {
                        this.assignToRoom(roomNameInput.value.substring(0, 20));
                    } else {
                        roomNameErrorText.style.display = 'inline';
                    }
                }
            }
            else {
                if (e.code === 'Backquote') {
                    if (this.transport.state !== 'started') {
                        this.transport.start();
                        this.transport.seconds = this.syncClient.getSyncTime();
                        //this.sequencerLoop(0);
                    }   
                    else {
                        this.transport.pause();
                    }
                }
                else if (e.code === 'KeyV') {
                    console.log('view');
                    if (!viewLock) this.performanceView = !this.performanceView;
                }
                else if (e.code === 'Slash') {
                    console.log('lock');
                    viewLock = !viewLock;
                }
            }
        });

        //this.transport.timeSignature = 4;

        this.reverb = new Reverb(1).toMaster();
        this.reverb.generate();
        this.bitcrusher = new BitCrusher(4).toMaster()
        this.autowah = new AutoWah().connect(this.reverb);  

        this.synth = new Synth({
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

        // BUILDERS

        // Tetris Chain
        this.tetrisChainSynth = new Synth({
            oscillator: {
                type: 'triangle',
                modulationFrequency: 0.2
            },
            envelope: {
                attack: 0.1,
                decay: 0.1,
                sustain: 0.5,
                release: 0.1,
            }
        }).toMaster();

        this.tetrisChainSequence = new Sequence(function(time, note){
            this.tetrisChainSynth.triggerAttackRelease(note, '16n', time);
        }, [], "8n");
 
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
            this.socket.on('assignedRoom', roomName => { 
                this.room = roomName;
                this.transport.start();
                this.startSyncClient(this.socket);
                this.startEffects();
            });
        });
    }

    startSyncClient(socket) {
        const startTime = performance.now();
        this.syncClient = new SyncClient(() => { return (performance.now() - startTime) / 1000 });
        this.syncClient.start(
            // send function
            (pingId, clientPingTime) => {
                var request = [];
                request[0] = 0; // we send a ping
                request[1] = pingId;
                request[2] = clientPingTime;

                //console.log('[ping] - id: %s, pingTime: %s', request[1], request[2]);

                this.socket.emit('syncClientData', request);
            },       
            // receive function  
            callback => {
                // unpack args before executing the callback
                this.socket.on('syncServerData', function (data) {
                    var response = data;

                    if (response[0] === 1) { // this is a pong
                        var pingId = response[1];
                        var clientPingTime = response[2];
                        var serverPingTime = response[3];
                        var serverPongTime = response[4];

                        //console.log('[pong] - id: %s, clientPingTime: %s, serverPingTime: %s, serverPongTime: %s',
                        //pingId, clientPingTime, serverPingTime, serverPongTime);

                        callback(pingId, clientPingTime, serverPingTime, serverPongTime);
                    }
                });
            }, 
            // status report function
            status => { }//console.log(status); }
        );
    }

    assignToRoom(roomName) {
        if (this.socket) {
            this.socket.emit('assignToRoom', roomName);
            document.getElementById('startMenuWrapper').style.display = 'none';
            // NETWORKED CONTROLS
            // These inputs will also be processed on the server
            console.log('binding keys');
            //this.controls.bindKey('space', 'space');
            this.controls.bindKey('open bracket', '[');
            this.controls.bindKey('close bracket / å', ']');
            this.controls.bindKey('n', 'n');
            this.controls.bindKey('b', 'b'); // begin
            this.controls.bindKey('c', 'c'); // change color
        }
    } 

    ///////////////////////////////////////////////////////////////////////////////////////////
    /// SOUND HANDLING

    stepLogic() {
        if (this.room === null) return //if we yet to be assigned a room, don't do this stuff
        this.player = this.gameEngine.world.queryObject({ playerId: this.gameEngine.playerId });
        this.players = this.gameEngine.world.queryObjects({ instanceType: Performer });
        this.eggs = this.gameEngine.world.queryObjects({ instanceType: Egg });
        let stage = this.player.stage;
        if (stage === 'setup') {

        }
        else if (stage === 'intro') {
            if (this.transport.state !== 'started' && this.prevStage !== stage) {
                this.transport.start();
                this.transport.seconds = this.syncClient.getSyncTime();
            }
            for (let e of this.eggs) {
                if (!Object.keys(this.eggSounds).includes(e.toString())) this.constructEggSounds(e);
                let vol = 1 - (0.3 * Math.abs(this.player.number - Math.floor(e.position.x / this.gameEngine.playerWidth)));
                if (vol < 0) vol = 0;
                this.eggSounds[e.toString()].drone.volume.rampTo(vol, 0.1);
            }
        }
        this.prevStage = stage;
    }

    onEggBounce(e) {
        if (!Object.keys(this.eggSounds).includes(e.toString())) this.constructEggSounds(e);
        let leftBound = this.player.number * this.gameEngine.playerWidth;
        let rightBound = (this.player.number + 1) * this.gameEngine.playerWidth;
        if (leftBound < e.position.x && e.position.x < rightBound) {
            this.eggSounds[e.toString()].bounce.triggerAttackRelease('8n');
        }
    }

    startEffects() {
        //this.bitcrusher.start();
    }

    constructEggSounds(e) {
        //console.log('making egg sounds');
        console.log(e.toString());
        this.eggSounds[e.toString()] = {
            drone: new NoiseSynth({
                noise: {
                    type: 'pink',
                },
                envelope: {
                    attack: 1,
                    decay: 0.1,
                    sustain: 1,
                    release: 0.1,
                }
            }),
            bounce: new NoiseSynth({
                noise: {
                    type: 'white',
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.3,
                    sustain: 0.1,
                    release: 0.5,
                }
            })
        };

        this.eggSounds[e.toString()].drone.connect(this.autowah);
        this.eggSounds[e.toString()].bounce.connect(this.autowah);
        this.eggSounds[e.toString()].drone.triggerAttack('+0', 0.1);
    }
    /*
    sequencerLoop(thisTime) {
        this.rhythmstack = ['4n'];
        console.log('step');
        if (this.notestack.length && this.rhythmstack.length) {
            if (noteIndex >= this.notestack.length) noteIndex = 0;
            if (rhythmIndex >= this.rhythmstack.length) rhythmIndex = 0;
            this.synth.triggerAttackRelease(this.notestack[noteIndex], '8n', thisTime)
            this.transport.scheduleOnce(nextTime => { this.sequencerLoop(nextTime); }, 
                Transport.getSecondsAtTime(Transport.nextSubdivision(this.rhythmstack[rhythmIndex]))
            );
            noteIndex++;
            rhythmIndex++;
        }
        else {
            noteIndex = 0;
            rhythmIndex = 0;
            this.transport.scheduleOnce(nextTime => { this.sequencerLoop(nextTime) }, 
                Transport.getSecondsAtTime(Transport.nextSubdivision('1m'))
            );
        }
    }
    */
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
