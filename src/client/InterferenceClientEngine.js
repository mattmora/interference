import { ClientEngine, KeyboardControls } from 'lance-gg';
import SyncClient from '@ircam/sync/client';
import InterferenceRenderer from '../client/InterferenceRenderer';
import Note from '../common/Note';
import Performer from '../common/Performer';
import Egg from '../common/Egg';
import { Transport, Frequency, Sequence, Loop, Synth, MonoSynth, PolySynth, NoiseSynth, FMSynth, AMSynth, MetalSynth } from 'tone';
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
        this.melodyStep = 0;
        this.bassStep = 0;
        this.percStep = 0;
        this.sequences = {};

        this.gameEngine.on('client__postStep', this.stepLogic.bind(this));
        this.gameEngine.on('updatePalette', () => { this.onUpdatePalette() });
        this.gameEngine.on('eggBounce', e => { this.onEggBounce(e) });
        this.gameEngine.on('playerHitEgg', e => { this.onPlayerHitEgg(e) });
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

    /// STEP

    stepLogic() {
        if (this.room == null) return; //if we've yet to be assigned a room, don't do this stuff

        this.player = this.gameEngine.world.queryObject({ playerId: this.gameEngine.playerId });
        if (this.player == null) return;

        if (this.player != null && this.reverb == null && this.player.palette != 0) this.initSound(this.player);

        this.players = this.gameEngine.world.queryObjects({ instanceType: Performer });
        for (let p of this.players) {
            if (p.gridString != null) p.grid = JSON.parse(p.gridString);
        }

        this.eggs = this.gameEngine.world.queryObjects({ instanceType: Egg });

        let stage = this.player.stage;

        this.sequences = {};
        for (let note of this.gameEngine.world.queryObjects({ instanceType: Note })) {
            if (note.id >= this.gameEngine.options.clientIDSpace) {
                let serverCopy = this.gameEngine.resolveShadowObject(note);
                if (serverCopy != null) {
                    serverCopy.animFrame = note.animFrame;
                    continue;
                }
            }
            note.step = note.xCell;
            if (this.sequences[note.ownerId] == null) this.sequences[note.ownerId] = {};
            if (this.sequences[note.ownerId].player == null) this.sequences[note.ownerId].player = this.gameEngine.world.queryObject({ playerId: note.ownerId });
            if (this.sequences[note.ownerId][note.sound] == null) this.sequences[note.ownerId][note.sound] = [];
            if (this.sequences[note.ownerId][note.sound][note.step] == null) this.sequences[note.ownerId][note.sound][note.step] = [];
            this.sequences[note.ownerId][note.sound][note.step].push(note);
        }

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

    /// GAME EVENTS

    onUpdatePalette() {
        let palettes = this.gameEngine.palettes;
        this.player.palette = palettes[(palettes.indexOf(this.player.palette) + 1) % palettes.length];
        this.socket.emit('updatePalette', this.player.palette);
    }

    onEggBounce(e) {
        if (!Object.keys(this.eggSounds).includes(e.toString())) this.constructEggSounds(e);
        if (this.gameEngine.positionIsInPlayer(e.position.x, this.player)) {
            this.eggSounds[e.toString()].bounce.triggerAttackRelease('8n');
        }
    }

    onPlayerHitEgg(e) {
        let p = this.player;
        if (e.hp <= 0) return;
        if (p.ammo <= 0) return;
        p.ammo--;
        e.hp--;

        let shadowId = this.gameEngine.getNewShadowId();
        this.socket.emit('playerHitEgg', p.ammo, e.id, e.hp, e.position.x, e.position.y, e.sound, shadowId);
        let pal = p.palette;
        let pos = this.gameEngine.playerQuantizedPosition(p, e.position.x, e.position.y, 
            this.gameEngine.paletteAttributes[pal].gridWidth, this.gameEngine.paletteAttributes[pal].gridHeight);
        let scale = this.gameEngine.paletteAttributes[pal].scale; //TODO should base this on palette of the cell?
        let pitch = (this.gameEngine.paletteAttributes[pal].gridHeight - pos[1]) + (scale.length * 4);
        let dur = this.gameEngine.paletteAttributes[pal][e.sound].subdivision;

        let notes = this.gameEngine.queryNotes({            
            ownerId: p.playerId, 
            palette: pal,
            sound: e.sound, 
            pitch: pitch, 
            //vel: 1, 
            xCell: pos[0], 
            yCell: pos[1] 
        });
        if (notes.length) notes[0].dur = '2n';
        else {
            let newNote = new Note(this.gameEngine, null, { 
                id: shadowId,
                ownerId: p.playerId, 
                palette: pal,
                sound: e.sound, 
                pitch: pitch, 
                dur: dur,
                vel: 1, 
                xCell: pos[0], 
                yCell: pos[1] 
            });
            newNote.inputId = shadowId;
            this.gameEngine.addObjectToWorld(newNote);
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

    //// SOUND

    initSound(p) {

        //this.transport.timeSignature = 4;

        this.reverb = new Reverb(5).toMaster();
        this.delay = new FeedbackDelay();
        //this.bitcrusher = new BitCrusher(4).connect(this.reverb); 
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
        let pal = this.gameEngine.paletteAttributes[p.palette];

        let events = []
        for (let i = 0; i < this.gameEngine.paletteAttributes[p.palette].gridWidth; i++) {
           events.push(i);
        }

        this.melodySynth = new PolySynth(pal.gridHeight, Synth).toMaster();

        this.melodySequence = new Sequence((time, step) => {
            this.melodyStep = step;
            if (this.sequences[this.player.playerId] == null) return;
            if (this.sequences[this.player.playerId].melody == null) return;
            let seqStep = this.sequences[this.player.playerId].melody[this.melodyStep];
            if (seqStep) this.playNoteArrayOnSynth(this.melodySynth, seqStep, pal.scale, 2, time, true);
        }, events, pal.melody.subdivision);


        this.bassSynth = new PolySynth(pal.gridHeight, AMSynth).toMaster();

        this.bassSequence = new Sequence((time, step) => {
            this.bassStep = step; 
            if (this.sequences[this.player.playerId] == null) return;
            if (this.sequences[this.player.playerId].bass == null) return;
            let seqStep = this.sequences[this.player.playerId].bass[this.bassStep];
            if (seqStep) this.playNoteArrayOnSynth(this.bassSynth, seqStep, pal.scale, -2, time, true);       
        }, events, pal.bass.subdivision);


        this.percSynth = new PolySynth(pal.gridHeight, FMSynth).toMaster();

        this.percSequence = new Sequence((time, step) => {
            this.percStep = step;
            if (this.sequences[this.player.playerId] == null) return;
            if (this.sequences[this.player.playerId].perc == null) return;
            let seqStep = this.sequences[this.player.playerId].perc[this.percStep];
            if (seqStep) this.playNoteArrayOnSynth(this.percSynth, seqStep, pal.scale, 0, time, true);
        }, events, pal.perc.subdivision);
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
                    this.playNoteOnSynth(synth, note, scale, 6, '64n', time, 0.5);
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
                    this.playNoteOnSynth(synth, note, scale, 6, '64n', time, 0.5);
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
                    this.playNoteOnSynth(synth, note, scale, 6, '64n', time, 0.5);
                }, [[0, 1, 2, 3, 1, 2, 3, 4], null, null, null], '4n')
            };
        }

        this.eggSounds[e.toString()].drone.connect(this.reverb);
        this.eggSounds[e.toString()].bounce.connect(this.reverb);
        this.eggSounds[e.toString()].breakSynth.connect(this.reverb);
        this.eggSounds[e.toString()].drone.triggerAttack('+0', 0.1);
        this.eggSounds[e.toString()].break.loop = true;
    }

    playNoteOnSynth(synth, note, scale, octaveShift, dur, time, vel) {
        if (!note) return;
        //console.log(note);
        let degree = note % scale.length;
        let octave = Math.floor(note / scale.length) + octaveShift;
        let pitch = Frequency(scale[degree] + (12 * octave), 'midi');
        //console.log(scale[degree] + (12 * octave));
        synth.triggerAttackRelease(pitch, dur, time, vel);
    }

    playNoteArrayOnSynth(synth, noteArray, scale, octaveShift, time) {
        if (!noteArray) return;

        //console.log(note);
        for (let note of noteArray) {
            //let scale = this.gameEngine.paletteAttributes[this.player.grid[note.cell.x][note.cell.y]];
            this.playNoteOnSynth(synth, note.pitch, scale, octaveShift, note.dur, time, note.vel);
        }
    }

    nextDiv(div) {
        return Transport.getSecondsAtTime(Transport.nextSubdivision(div));
    }
}
