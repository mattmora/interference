import { ClientEngine, KeyboardControls } from 'lance-gg';
import SyncClient from '@ircam/sync/client';
import InterferenceRenderer from '../client/InterferenceRenderer';
import Note from '../common/Note';
import Performer from '../common/Performer';
import Egg from '../common/Egg';
import { Transport, Frequency, Part, Sequence, Synth, MonoSynth, PolySynth, NoiseSynth, FMSynth, AMSynth, MetalSynth } from 'tone';
import { Reverb, FeedbackDelay, BitCrusher, AutoWah } from 'tone';

export default class InterferenceClientEngine extends ClientEngine {

    ///////////////////////////////////////////////////////////////////////////////////////////
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
        this.viewLock = false;
        this.controls = new KeyboardControls(this);
        this.prevState = 'setup';
        this.fullscreen = false;
        this.optionSelection = {};
        this.localControls = {
            //'Backquote': 'ToggleTransport',
            'KeyF': 'ToggleFullscreen',
            'KeyH': 'ToggleCursor',
            'KeyV': 'ToggleView',
            'Slash': 'ToggleLock'
        };
        this.currentStep = null;

        this.gameEngine.on('client__postStep', this.stepLogic.bind(this));
        this.gameEngine.on('eggBounce', e => { this.onEggBounce(e) });
        //this.gameEngine.on('playerHitEgg', e => { this.onPlayerHitEgg(e) });
        this.gameEngine.on('eggBroke', e => { this.onEggBroke(e) });
    }

    executeLocalControl(controlString) {
        if (controlString === 'ToggleTransport') {
            if (this.transport.state !== 'started') {
                this.transport.start();
                this.transport.seconds = this.syncClient.getSyncTime();
                //this.sequencerLoop(0);
            }   
            else {
                this.transport.pause();
            }
        }
        else if (controlString === 'ToggleFullscreen') {
            if (!this.viewLock) {
                let elem = this.renderer.canvas;
                if (!document.fullscreenElement) {
                    elem.requestFullscreen({navigationUI: 'hide'}).then({}).catch(err => {
                        //alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                    });
                } else {
                    document.exitFullscreen();
                }
            }
        }
        else if (controlString === 'ToggleCursor') {
            if (!this.viewLock) {
                if (document.pointerLockElement === document.body || 
                    document.mozPointerLockElement === document.body) {
                    document.exitPointerLock();
                } else {
                    document.body.requestPointerLock();
                }
            }
        }
        else if (controlString === 'ToggleView') {
            //console.log('view');
            if (!this.viewLock) this.performanceView = !this.performanceView;
        }
        else if (controlString === 'ToggleLock') {
            //console.log('lock');
            this.viewLock = !this.viewLock;
        }
    }

    executeOption(optionString) {
        console.log(optionString);
    }

    start() {
        super.start()

        let btn = document.getElementById('startButton');
        let roomNameInput = document.getElementById('roomNameInput');
        let roomNameErrorText = document.querySelector('#startMenu .room-input-error');

        btn.onclick = () => {
            let regex = /^\w+$/;
            if (regex.exec(roomNameInput.value) != null) {
                this.assignToRoom(roomNameInput.value.substring(0, 20));
            } else {
                roomNameErrorText.style.display = 'inline';
            }
        };

        document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;

        // LOCAL CONTROLS
        // Any inputs that do nothing server-side (i.e. doesn't need to be known by other players)
        document.addEventListener('keypress', e => {
            //console.log(e.code);
            if (document.activeElement === roomNameInput) {
                if (e.code === 'Enter') {
                    let regex = /^\w+$/;
                    if (regex.exec(roomNameInput.value) != null) {
                        this.assignToRoom(roomNameInput.value.substring(0, 20));
                    } else {
                        roomNameErrorText.style.display = 'inline';
                    }
                }
            }
            else {
                if (this.optionSelection[e.code]) {
                    this.executeOption(this.optionSelection[e.code]);
                }
                if (this.localControls[e.code]) {
                    this.executeLocalControl(this.localControls[e.code]);
                }
            }
        });
    }

    connect(options = {}) {
        return super.connect().then(() => {
            this.socket.on('assignedRoom', roomName => { 
                this.room = roomName;
                this.transport.start();
                this.startSyncClient(this.socket);
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
            //console.log('binding keys');
            //this.controls.bindKey('space', 'space');
            this.controls.bindKey('open bracket', '[');
            this.controls.bindKey('close bracket / å', ']');
            this.controls.bindKey('n', 'n');
            this.controls.bindKey('b', 'b'); // begin
            this.controls.bindKey('c', 'c'); // change color
            this.controls.bindKey('q', 'q');
            this.controls.bindKey('w', 'w');
            this.controls.bindKey('e', 'e');
        }
    } 

    ///////////////////////////////////////////////////////////////////////////////////////////
    /// SOUND HANDLING AND CLIENT LOGIC

    stepLogic() {
        if (this.room == null) return //if we yet to be assigned a room, don't do this stuff
        this.player = this.gameEngine.world.queryObject({ playerId: this.gameEngine.playerId });
        if (this.player != null && this.reverb == null && this.player.palette != 0) this.initSound(this.player);
        this.players = this.gameEngine.world.queryObjects({ instanceType: Performer });
        for (let p of this.players) {
            if (p.gridString != null) p.grid = JSON.parse(p.gridString);
            for (let sound of Object.keys(p.sequences)) {
                p.sequences[sound] = JSON.parse(p[sound]);
            }
        }
        this.eggs = this.gameEngine.world.queryObjects({ instanceType: Egg });
        let stage = this.player.stage;
        if (stage === 'setup') {

        }
        else if (stage === 'intro') {
            if (this.transport.state !== 'started') {// && this.prevStage !== stage) {
                this.transport.start();
                this.transport.seconds = this.syncClient.getSyncTime();
            }
            if (this.melodySequence.state !== 'started') {
                //console.log('start seq');
                this.melodySequence.start(this.nextDiv('1m'));
            }
            if (this.bassSequence.state !== 'started') {
                //console.log('start seq');
                this.bassSequence.start(this.nextDiv('1m'));
            }
            if (this.percSequence.state !== 'started') {
                //console.log('start seq');
                this.percSequence.start(this.nextDiv('1m'));
            }
            for (let e of this.eggs) {
                if (!Object.keys(this.eggSounds).includes(e.toString())) this.constructEggSounds(e);
                let vol = 1 - (0.5 * Math.abs(this.player.number - Math.floor(e.position.x / this.gameEngine.playerWidth)));
                if (vol < 0) vol = 0;
                this.eggSounds[e.toString()].drone.volume.rampTo(vol, 0.1);
            }
        }
        this.prevStage = stage;
    }

    onEggBounce(e) {
        if (!Object.keys(this.eggSounds).includes(e.toString())) this.constructEggSounds(e);
        if (this.gameEngine.positionIsInPlayer(e.position.x, this.player)) {
            this.eggSounds[e.toString()].bounce.triggerAttackRelease('8n');
        }
    }

    onEggBroke(e) {
        console.log('egg broke');
        this.eggSounds[e.toString()].drone.triggerRelease();
        if (this.gameEngine.positionIsInPlayer(e.position.x, this.player)) {
            this.eggSounds[e.toString()].break.start(this.nextDiv('4n'));
            this.optionSelection['Digit1'] = 'tetrisChain';
        }
    }

    initSound(p) {

        //this.transport.timeSignature = 4;

        this.reverb = new Reverb(1).toMaster();
        this.delay = new FeedbackDelay()
        //this.bitcrusher = new BitCrusher(4).connect(this.reverb); 
        this.autowah = new AutoWah().toMaster()
        this.autowah.connect(this.reverb);  
        this.reverb.generate();
        //this.bitcrusher.start();
        /*
        this.synth = new Synth({
            oscillator: {
                type: 'sine',
            },
            envelope: {
                attack: 0,
                decay: 0.1,
                sustain: 0,
                release: 0.1,
            }
        }).toMaster();
        */
        let events = []
        for (let i = 0; i < this.gameEngine.paletteAttributes[p.palette].gridWidth; i++) {
           events.push(i);
        }

        this.melodySynth = new PolySynth(this.gameEngine.paletteAttributes[p.palette].gridHeight, Synth).toMaster();
        this.melodySequence = new Sequence((time, step) => {
            this.currentStep = step;
            let seqStep = this.player.sequences.melody[step];
            if (seqStep) this.playStepOnSynth(this.melodySynth, seqStep, 2, time, true);
        }, events, this.gameEngine.paletteAttributes[p.palette].subdivision);

        this.bassSynth = new PolySynth(this.gameEngine.paletteAttributes[p.palette].gridHeight, AMSynth).toMaster();
        this.bassSequence = new Sequence((time, step) => {
            this.currentStep = step;
            let seqStep = this.player.sequences.bass[step];
            if (seqStep) this.playStepOnSynth(this.bassSynth, seqStep, -2, time, true);
        }, events, this.gameEngine.paletteAttributes[p.palette].subdivision);

        this.percSynth = new PolySynth(this.gameEngine.paletteAttributes[p.palette].gridHeight, FMSynth).toMaster();
        this.percSequence = new Sequence((time, step) => {
            this.currentStep = step;
            let seqStep = this.player.sequences.perc[step];
            if (seqStep) this.playStepOnSynth(this.percSynth, seqStep, 0, time, true);
        }, events, this.gameEngine.paletteAttributes[p.palette].subdivision);
    }

    constructEggSounds(e) {
        let scale = this.gameEngine.paletteAttributes[this.player.palette].scale;

        if (e.sound === 'melody') {
            let synth = new Synth({
                oscillator: {
                    type: 'triangle',
                },
                envelope: {
                    attack: 0.005,
                    decay: 0.5,
                    sustain: 0,
                    release: 0.1,
                }
            });
            this.eggSounds[e.toString()] = {
                drone: new NoiseSynth({
                    noise: {
                        type: 'pink',
                    },
                    envelope: {
                        attack: 1,
                        decay: 0.1,
                        sustain: 1,
                        release: 0.5,
                    }
                }),
                bounce: new NoiseSynth({
                    noise: {
                        type: 'pink',
                    },
                    envelope: {
                        attack: 0.01,
                        decay: 0.3,
                        sustain: 0.1,
                        release: 0.5,
                    }
                }).toMaster(),
                breakSynth: synth.toMaster(), 
                break: new Sequence((time, note) => {
                    let scale = this.gameEngine.paletteAttributes[this.player.palette].scale;
                    this.playScaleNoteOnSynth(synth, note, scale, 6, '64n', time, 0.5);
                }, [[0, 1, 2, 3, 1, 2, 3, 4], null, null, null], '4n')
            };
        }
        else if (e.sound === 'bass') {
            let synth = new Synth({
                oscillator: {
                    type: 'triangle',
                },
                envelope: {
                    attack: 0.005,
                    decay: 0.5,
                    sustain: 0,
                    release: 0.1,
                }
            });
            this.eggSounds[e.toString()] = {
                drone: new NoiseSynth({
                    noise: {
                        type: 'pink',
                    },
                    envelope: {
                        attack: 1,
                        decay: 0.1,
                        sustain: 1,
                        release: 0.5,
                    }
                }),
                bounce: new NoiseSynth({
                    noise: {
                        type: 'pink',
                    },
                    envelope: {
                        attack: 0.01,
                        decay: 0.3,
                        sustain: 0.1,
                        release: 0.5,
                    }
                }).toMaster(),
                breakSynth: synth.toMaster(), 
                break: new Sequence((time, note) => {
                    let scale = this.gameEngine.paletteAttributes[this.player.palette].scale;
                    this.playScaleNoteOnSynth(synth, note, scale, 6, '64n', time, 0.5);
                }, [[0, 1, 2, 3, 1, 2, 3, 4], null, null, null], '4n')
            };
        }
        else if (e.sound === 'perc') {
            let synth = new Synth({
                oscillator: {
                    type: 'triangle',
                },
                envelope: {
                    attack: 0.005,
                    decay: 0.5,
                    sustain: 0,
                    release: 0.1,
                }
            });
            this.eggSounds[e.toString()] = {
                drone: new NoiseSynth({
                    noise: {
                        type: 'pink',
                    },
                    envelope: {
                        attack: 1,
                        decay: 0.1,
                        sustain: 1,
                        release: 0.5,
                    }
                }),
                bounce: new NoiseSynth({
                    noise: {
                        type: 'pink',
                    },
                    envelope: {
                        attack: 0.01,
                        decay: 0.3,
                        sustain: 0.1,
                        release: 0.5,
                    }
                }).toMaster(),
                breakSynth: synth.toMaster(), 
                break: new Sequence((time, note) => {
                    let scale = this.gameEngine.paletteAttributes[this.player.palette].scale;
                    this.playScaleNoteOnSynth(synth, note, scale, 6, '64n', time, 0.5);
                }, [[0, 1, 2, 3, 1, 2, 3, 4], null, null, null], '4n')
            };
        }

        this.eggSounds[e.toString()].drone.connect(this.autowah);
        this.eggSounds[e.toString()].bounce.connect(this.reverb);
        this.eggSounds[e.toString()].breakSynth.connect(this.reverb);
        this.eggSounds[e.toString()].drone.triggerAttack('+0', 0.1);
        this.eggSounds[e.toString()].break.loop = true;
    }

    playScaleNoteOnSynth(synth, note, scale, octaveShift, dur, time, vel) {
        if (!note) return;
        //console.log(note);
        let degree = note % scale.length;
        let octave = Math.floor(note / scale.length) + octaveShift;
        let pitch = Frequency(scale[degree] + (12 * octave), 'midi');
        //console.log(scale[degree] + (12 * octave));
        synth.triggerAttackRelease(pitch, dur, time, vel);
    }

    playStepOnSynth(synth, stepArray, octaveShift, time) {
        if (!stepArray) return;

        //console.log(note);
        for (let note of stepArray) {
            //let scale = this.gameEngine.paletteAttributes[this.player.grid[note.cell.x][note.cell.y]];
            let scale = this.gameEngine.paletteAttributes[this.player.palette].scale;
            this.playScaleNoteOnSynth(synth, note.pitch, scale, octaveShift, note.dur, time, note.vel);
        }
    }

    nextDiv(div) {
        return Transport.getSecondsAtTime(Transport.nextSubdivision(div));
    }
}
