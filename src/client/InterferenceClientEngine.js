import { ClientEngine, KeyboardControls } from 'lance-gg';
import SyncClient from '@ircam/sync/client';
import InterferenceRenderer from '../client/InterferenceRenderer';
import Performer from '../common/Performer';
import Egg from '../common/Egg';
import { Transport, Frequency, Part, Sequence, Synth, MonoSynth, PolySynth, NoiseSynth, FMSynth } from 'tone';
import { Reverb, FeedbackDelay, BitCrusher, AutoWah } from 'tone';

const durs = ['4n', '8n', '6n'];
const scaleTable = {
    'rain':     [0, 4, 6, 9, 11],
    'celeste':  [0, 2, 3, 5, 7],
    'pyre':     [0, 2, 3, 7, 10],
    'journey':  [0, 2, 4, 7, 9],
    'kirby':    [0, 2, 4, 5, 7],
    'default':  [0, 2, 4, 5, 7]
}
let noteIndex = 0;
let rhythmIndex = 0;
let viewLock = false;

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
        this.controls = new KeyboardControls(this);
        this.prevState = 'setup';
        this.fullscreen = false;
        this.optionSelection = {};
        this.graphicNotes = [];
        this.sequence = [];
        this.currentStep = null;

        this.gameEngine.on('client__postStep', this.stepLogic.bind(this));
        this.gameEngine.on('eggBounce', e => { this.onEggBounce(e) });
        this.gameEngine.on('playerHitEgg', e => { this.onPlayerHitEgg(e) });
        this.gameEngine.on('eggBroke', e => { this.onEggBroke(e) });
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

        document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;

        // LOCAL CONTROLS
        // Any inputs that do nothing server-side (i.e. doesn't need to be known by other players)
        document.addEventListener('keypress', e => {
            //console.log(e.code);
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
                if (this.optionSelection[e.code]) {
                    this.executeOption(optionSelection[e.code]);
                }
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
                else if (e.code === 'KeyF') {
                    if (!viewLock) {
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
                else if (e.code === 'KeyH') {
                    if (!viewLock) {
                        if (document.pointerLockElement === document.body || 
                            document.mozPointerLockElement === document.body) {
                            document.exitPointerLock();
                        } else {
                            document.body.requestPointerLock();
                        }
                    }
                }
                else if (e.code === 'KeyV') {
                    //console.log('view');
                    if (!viewLock) this.performanceView = !this.performanceView;
                }
                else if (e.code === 'Slash') {
                    //console.log('lock');
                    viewLock = !viewLock;
                }
            }
        });

        //this.transport.timeSignature = 4;

        this.reverb = new Reverb(1).toMaster();
        this.delay = new FeedbackDelay()
        //this.bitcrusher = new BitCrusher(4).connect(this.reverb); 
        this.autowah = new AutoWah().toMaster()
        this.autowah.connect(this.reverb);  

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

        // BUILDERS

        // Tetris Chain
        this.tetrisChainSynth = new PolySynth(9, Synth).toMaster();

        let events = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        this.tetrisChainSequence = new Sequence((time, step) => {
            this.currentStep = step;
            if (this.sequence[step]) this.playScaleNoteOnPolySynth(this.tetrisChainSynth, this.sequence[step].notes, 1, this.sequence[step].durs, time)
        }, events, '16n');
 
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
            //console.log('binding keys');
            this.controls.bindKey('space', 'space');
            this.controls.bindKey('open bracket', '[');
            this.controls.bindKey('close bracket / å', ']');
            this.controls.bindKey('n', 'n');
            this.controls.bindKey('b', 'b'); // begin
            this.controls.bindKey('c', 'c'); // change color
        }
    } 

    ///////////////////////////////////////////////////////////////////////////////////////////
    /// SOUND HANDLING AND CLIENT LOGIC

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
            if (this.tetrisChainSequence.state !== 'started') {
                //console.log('start seq');
                this.tetrisChainSequence.start(this.nextDiv('1m'));
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

    executeOption(optionString) {

    }

    onEggBounce(e) {
        if (!Object.keys(this.eggSounds).includes(e.toString())) this.constructEggSounds(e);
        if (this.gameEngine.positionIsInPlayer(e.position.x, this.player)) {
            this.eggSounds[e.toString()].bounce.triggerAttackRelease('8n');
        }
    }

    onPlayerHitEgg(e) {
        let scale = scaleTable[this.player.palette];
        let pos = this.gameEngine.playerCellAtPosition(this.player, e.position.x, e.position.y);
        let step = pos[0];
        let note = (this.gameEngine.playerCellHeight - pos[1]) + (scale.length * 4);
        let dur = '16n';
        //let note = (this.gameEngine.cellsPerPlayer - 1) - ((pos[1] * this.gameEngine.playerCellWidth) + pos[0]);
        if (this.sequence[step]) {
            if (this.sequence[step].notes.includes(note)) {
                this.sequence[step].durs[this.sequence[step].notes.indexOf(note)] = '2n';
                dur = '2n';
            }
            else {
                this.sequence[step].notes.push(note);
                this.sequence[step].durs.push('16n');
            }
        }
        else this.sequence[step] = { notes: [note], durs: ['16n'] };
        this.graphicNotes.push({ 
            type: 'egg',
            duration: dur,
            step: step,
            cell: { 
                x: pos[0], 
                y: pos[1] 
            },
            animFrame: 0
        });
    }

    onEggBroke(e) {
        console.log('egg broke');
        this.eggSounds[e.toString()].drone.triggerRelease();
        if (this.gameEngine.positionIsInPlayer(e.position.x, this.player)) {
            this.eggSounds[e.toString()].break.start(this.nextDiv('4n'));
            this.optionSelection.up = 'tetrisChain';
        }
    }

    startEffects() {
        //this.bitcrusher.start();
        this.reverb.generate();
    }

    constructEggSounds(e) {
        //console.log('making egg sounds');
        let scale = scaleTable[this.player.palette]
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
                this.playScaleNoteOnSynth(synth, note, 6, '64n', time)
            }, [[0, 1, 2, 3, 1, 2, 3, 4], null, null, null], '4n')
        };

        this.eggSounds[e.toString()].drone.connect(this.autowah);
        this.eggSounds[e.toString()].bounce.connect(this.reverb);
        this.eggSounds[e.toString()].breakSynth.connect(this.reverb);
        this.eggSounds[e.toString()].drone.triggerAttack('+0', 0.1);
        this.eggSounds[e.toString()].break.loop = true;
    }

    playScaleNoteOnSynth(synth, note, octaveShift, dur, time) {
        if (!note) return;
        //console.log(note);
        let scale = scaleTable[this.player.palette];
        let degree = note % scale.length;
        let octave = Math.floor(note / scale.length) + octaveShift;
        //console.log(scale[degree] + (12 * octave));
        synth.triggerAttackRelease(Frequency(scale[degree] + (12 * octave), 'midi'), dur, time);
    }

    playScaleNoteOnPolySynth(synth, notes, octaveShift, durs, time) {
        if (!notes) return;
        //console.log(note);
        let chord = [];
        for (let note of notes) {
            let scale = scaleTable[this.player.palette];
            let degree = note % scale.length;
            let octave = Math.floor(note / scale.length) + octaveShift;
            //console.log(scale[degree] + (12 * octave));
            chord.push(Frequency(scale[degree] + (12 * octave), 'midi'));
        }
        synth.triggerAttackRelease(chord, durs, time);
    }

    nextDiv(div) {
        return Transport.getSecondsAtTime(Transport.nextSubdivision(div));
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
