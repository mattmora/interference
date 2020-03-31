"use strict";

import { ClientEngine, KeyboardControls, TwoVector } from 'lance-gg';
import SyncClient from '@ircam/sync/client';
import InterferenceRenderer from '../client/InterferenceRenderer';
import Note from '../common/Note';
import Performer from '../common/Performer';
import Egg from '../common/Egg';
import { Transport, Frequency, Sequence, Synth, PolySynth, NoiseSynth, MembraneSynth, FMSynth } from 'tone';
import { Reverb, Distortion, Volume } from 'tone';

export default class InterferenceClientEngine extends ClientEngine {

    ///////////////////////////////////////////////////////////////////////////////////////////
    /// INITIALIZATION AND CONNECTION
    constructor(gameEngine, options) {
        super(gameEngine, options, InterferenceRenderer);

        this.syncClient = null;
        this.transportSyncCount = 0;
        this.transport = Transport;
        this.room = null;
        this.player = null;
        this.players = [];
        this.playersChanged = false;
        this.soundingPlayers = [];
        this.eggs = [];
        this.eggSynths = {};
        this.performanceView = false;
        this.viewLock = false;
        this.controls = new KeyboardControls(this);
        this.prevStage = 'setup';
        this.fullscreen = false;
        this.optionSelection = {};
        this.localControls = {
            //'Backquote': 'ToggleTransport',
            'KeyF': 'ToggleFullscreen',
            'KeyH': 'ToggleCursor',
            'KeyV': 'ToggleView',
            'Slash': 'ToggleLock',
            'KeyX': 'ToggleEndGameControl',
            'Digit0': 'ReleaseAll'
        };
        this.melodySequence = null;
        this.bassSequence = null;
        this.percSequence = null;
        this.melodyStep = 0;
        this.bassStep = 0;
        this.percStep = 0;
        this.sequences = {};
        this.pitchSetIndex = 0;

        this.isSpectator = false;
        this.showControlText = true;
        this.isLeader = true;

        this.params = {};

        this.gameEngine.on('client__preStep', this.preStepLogic.bind(this));
        this.gameEngine.on('client__postStep', this.postStepLogic.bind(this));
        this.gameEngine.on('updatePalette', () => { this.onUpdatePalette() });
        this.gameEngine.on('eggBounce', e => { this.onEggBounce(e) });
        this.gameEngine.on('playerHitEgg', e => { this.onPlayerHitEgg(e) });
        this.gameEngine.on('eggBroke', e => { this.onEggBroke(e) });
    }

    executeLocalControl(controlString) {
        if (controlString === 'ToggleTransport') {
            if (this.transport.state !== 'started') {
                this.transport.start('+0.1');
                this.transport.seconds = this.syncClient.getSyncTime();
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
                    this.renderer.setRendererSize();
                } else {
                    document.exitFullscreen();
                    this.renderer.setRendererSize();
                }
            }
        }
        else if (controlString === 'ToggleCursor') {
            this.showControlText = !this.showControlText;
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
        else if (controlString === 'ToggleEndGameControl') {
            if (this.isSpectator) return
            this.optionSelection['KeyO'] = 'endGame';
            setTimeout(() => { 
                if (this.optionSelection['KeyO'] != null) delete this.optionSelection['KeyO'];
            }, 1000);
        }
        // else if (controlString === 'ReleaseAll')
        // {
        //     for (let player of this.soundingPlayers)
        //     {
        //         let p = player.number;
        //         if (this.melodySynth[p] == null) continue;
        //         this.melodySynth[p].releaseAll('+0.1');
        //         this.bassSynth[p].releaseAll('+0.1');
        //         this.percSynth[p].releaseAll('+0.1');
        //         if (this.eggSynths[p] == null) continue;
        //         for (let key in this.eggSynths[p])
        //         {
        //             this.eggSynths[p][key].drone.triggerRelease('+0.1');
        //             this.eggSynths[p][key].bounce.triggerRelease('+0.1');
        //             this.eggSynths[p][key].breakSynth.triggerRelease('+0.1');
        //         }
        //     }
        // }
    }

    executeOption(optionString) {
        if (optionString === 'build') {
            if (this.room != 'outro') this.socket.emit('startBuildStage');
            else this.socket.emit('clearBrokenEggs');
            this.optionSelection = {};
        }
        else if (optionString === 'fight') {
            if (this.room != 'outro') this.socket.emit('startFightStage');
            else this.socket.emit('clearBrokenEggs');
            this.optionSelection = {};
        }
        // else if (optionString === 'faster') {
        //     this.socket.emit('changeTempo', 20);
        //     this.optionSelection = {};
        // }
        // else if (optionString === 'slower') {
        //     this.socket.emit('changeTempo', -20);
        //     this.optionSelection = {}; 
        // }
        else if (optionString === 'endGame') {
            if (!this.isLeader) return;
            this.socket.emit('endGame');
            delete this.optionSelection['KeyO'];
        }
    }

    start() {
        super.start()

        let btn = document.getElementById('startButton');
        let roomNameInput = document.getElementById('roomNameInput');
        let errorText = document.querySelector('#startMenu .room-error');
        let paramInput = document.getElementById('paramInput');

        btn.onclick = () => {
            let regex = /^\w+$/;
            if (regex.exec(roomNameInput.value) != null) {

                let paramString = paramInput.value.replace(/\s/g, '');
                let members = paramString.split(';');
                for (let m of members) {
                    m = m.split(':');
                    if (isNaN(Number(m[1]))) this.params[m[0]] = m[1];
                    else {
                        this.params[m[0]] = Number(m[1]);
                        //console.log(typeof this.params[m[0]]);
                    }
                }

                this.assignToRoom(roomNameInput.value.substring(0, 20));
            } else {
                errorText.textContent = 
                'Room name can only contain alphanumeric characters or underscores and must be at least 1 character long.';
            }
        };

        document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;

        // LOCAL CONTROLS
        // Any inputs that do nothing server-side (i.e. doesn't need to be known by other players)
        document.addEventListener('keypress', e => {
            //console.log(e.code);
            if (document.activeElement === roomNameInput || document.activeElement === paramInput) {
                if (e.code === 'Enter') {
                    let regex = /^\w+$/;
                    if (regex.exec(roomNameInput.value) != null) {

                        let paramString = paramInput.value.replace(/\s/g, '');
                        let members = paramString.split(';');
                        for (let m of members) {
                            m = m.split(':');
                            if (isNaN(Number(m[1]))) this.params[m[0]] = m[1];
                            else {
                                this.params[m[0]] = Number(m[1]);
                                //console.log(typeof this.params[m[0]]);
                            }
                        }

                        this.assignToRoom(roomNameInput.value.substring(0, 20));
                    } else {
                        errorText.textContent = 
                        'Room name can only contain alphanumeric characters or underscores and must be at least 1 character long.';
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
            this.socket.on('assignedRoom', (roomName, params) => { 
                document.getElementById('startMenuWrapper').style.display = 'none';

                this.params = params;
                // console.log(`params=${this.params}`);
                Object.assign(this.gameEngine.paramsByRoom[roomName], this.params);

               //if (this.isLeader) this.controls.bindKey('b', 'b'); // begin

                if (!this.isSpectator) {
                    // NETWORKED CONTROLS
                    // These inputs will also be processed on the server
                    //console.log('binding keys');
                    //this.controls.bindKey('space', 'space');
                    this.controls.bindKey('open bracket', '[');
                    this.controls.bindKey('close bracket / å', ']');
                    this.controls.bindKey('n', 'n');
                    this.controls.bindKey('c', 'c'); // change color
                    this.controls.bindKey('space', 'space');
                    this.controls.bindKey('q', 'q');
                    this.controls.bindKey('b', 'b'); // begin
                    this.controls.bindKey('r', 'r'); // remove note in outro
                    this.controls.bindKey('w', 'w');
                    this.controls.bindKey('e', 'e');
                    this.controls.bindKey('a', 'a');
                    this.controls.bindKey('s', 's');
                    this.controls.bindKey('d', 'd');
                    this.controls.bindKey('p', 'p');
                    this.controls.bindKey('back slash', 'back slash');
                }
                this.startSyncClient(this.socket);
                this.room = roomName;
                this.gameEngine.room = this.room;
                this.transport.start('+0.1');
            });
            this.socket.on('accessDenied', () => {
                let errorText = document.querySelector('#startMenu .room-error');
                errorText.textContent = 
                'Cannot join room. Performance in progress.';
            });
            // this.socket.on('changeTempo', bpm => {
            //     this.transport.scheduleOnce(() => {
            //         this.transport.bpm.value = bpm;
            //     }, this.nextDiv('1m'));
            // });
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
            this.gameEngine.setRoomParamsToDefault(roomName);
            Object.assign(this.gameEngine.paramsByRoom[roomName], this.params)
            this.isSpectator = this.params.spectator;
            this.ringView = this.params.ringView;
            this.isLeader = this.params.isLeader;
            this.socket.emit('assignToRoom', roomName, this.params);
        }
    } 

    ///////////////////////////////////////////////////////////////////////////////////////////
    /// SOUND HANDLING AND CLIENT LOGIC

    /// STEP
    preStepLogic() {
        if (this.room == null) return; //if we've yet to be assigned a room, don't do this stuff

        if (this.transport.state === 'started') {
            if (this.transportSyncCount >= this.gameEngine.paramsByRoom[this.room].transportSyncInterval) {
                this.transport.seconds = this.syncClient.getSyncTime();
                this.transportSyncCount = 0;
                //console.log(client.transport.state);
            }
            this.transportSyncCount++;
        }

        this.player = this.gameEngine.world.queryObject({ playerId: this.gameEngine.playerId });
        if (this.player == null && this.isSpectator) 
            this.player = this.gameEngine.world.queryObjects({ instanceType: Performer })[0];

        if (this.player != null) this.player.room = this.room;

        let palettes = []
        for (let player of this.soundingPlayers)
        {
            palettes[player.number] = player.palette;
        }

        let numPlayers = this.players.length;
        this.players = this.gameEngine.world.queryObjects({ instanceType: Performer });

        if (this.gameEngine.paramsByRoom[this.room].inPersonPerformance)
            this.soundingPlayers = [this.player];
        else this.soundingPlayers = this.players;

        if (numPlayers != this.players.length || this.reverb == null) this.initSound();

        let palettesChanged = false;
        for (let player of this.soundingPlayers)
        {
            if (palettes[player.number] != player.palette) palettesChanged = true;
        }
        if (palettesChanged) this.updateSound();
    }

    postStepLogic() {
        if (this.room == null) return; //if we've yet to be assigned a room, don't do this stuff
        if (this.player == null) return;
        if (this.melodySequence == null) this.initSequences();

        let roomName = this.player.room;

        if (this.gameEngine.paramsByRoom[roomName] == null) return;

        this.eggs = this.gameEngine.world.queryObjects({ instanceType: Egg });

        let stage = this.player.stage;

        this.pitchSetIndex = this.player.pitchSet;

        this.sequences = {};
        for (let note of this.gameEngine.world.queryObjects({ instanceType: Note })) {
            if (note.id >= this.gameEngine.options.clientIDSpace) {
                let serverCopy = this.gameEngine.resolveShadowObject(note);
                if (serverCopy != null) {
                    serverCopy.animFrame = note.animFrame;
                }
            }
            let playerWidth = this.gameEngine.paramsByRoom[roomName].playerWidth;
            let playerHeight = Number(this.gameEngine.paramsByRoom[roomName].playerHeight);
            let pal = this.gameEngine.paramsByRoom[roomName].paletteAttributes[note.palette];
            note.step = note.xPos % playerWidth;
            note.pitch = (playerHeight - note.yPos) + (pal.pitchSets[this.pitchSetIndex].length * 3);
            let number = this.gameEngine.world.queryObject({ playerId: note.ownerId }).number;
            if (this.sequences[number] == null) this.sequences[number] = {};
            if (this.sequences[number][note.sound] == null) this.sequences[number][note.sound] = [];
            if (this.sequences[number][note.sound][note.step] == null) this.sequences[number][note.sound][note.step] = [];
            this.sequences[number][note.sound][note.step].push(note);
        }
        //console.log(this.pitchSetIndex);

        if (stage === 'setup') {

        }
        else {
            if (this.transport.state !== 'started') {// && this.prevStage !== stage) {
                this.transport.start('+1');
                this.transport.seconds = this.syncClient.getSyncTime();
            }
            if (this.melodySequence.state !== 'started') {
                //console.log('start seq');
                this.melodySequence.start(this.nextDiv('1m'));
            }
            if (this.bassSequence.state !== 'started') {
                //console.log('start seq');
                this.bassSequence.start(this.nextDiv('4m'));
            }
            if (this.percSequence.state !== 'started') {
                //console.log('start seq');
                this.percSequence.start(this.nextDiv('2m'));
            }

            for (let e of this.eggs) {
                for (let player of this.soundingPlayers)
                {
                    let p = player.number;
                    if (this.eggSynths[p] == null) this.constructEggSynths(player, e);
                    else if (this.eggSynths[p][e.toString()] == null) this.constructEggSynths(player, e);
                    let playerWidth = this.gameEngine.paramsByRoom[roomName].playerWidth;
                    let eggPlayerDistance = Math.abs(p - (e.position.x / playerWidth));
                    if (eggPlayerDistance > (this.players.length * 0.5)) 
                        eggPlayerDistance = this.players.length - eggPlayerDistance;
                    let vol = (this.gameEngine.paramsByRoom[roomName].eggDroneVolume * eggPlayerDistance) - 3;
                    
                    this.eggSynths[p][e.toString()].drone.volume.value = vol;
                    let pal = this.gameEngine.paramsByRoom[roomName].paletteAttributes[player.palette];
                    let pitch = pal.scale[pal.pitchSets[this.pitchSetIndex][0]];
                    if (e.sound === 'melody') {
                        this.eggSynths[p][e.toString()].drone.setNote(Frequency(pitch + 72, 'midi'));
                    }
                    else if (e.sound === 'bass') {
                        this.eggSynths[p][e.toString()].drone.setNote(Frequency(pitch + 36, 'midi'));
                    }
                }
            }
        }
        if (stage == 'build') {

        }
        else if (stage == 'outro') {

        }
        else if (stage == 'fight') {
        }
        else if (stage == 'fightEnd') {
            if (this.prevStage == 'fight') {
                this.gameEngine.paramsByRoom[roomName].fightRate = 
                Number(this.gameEngine.paramsByRoom[roomName].fightRate) +
                Number(this.gameEngine.paramsByRoom[roomName].fightRateInc);
                if (this.gameEngine.paramsByRoom[roomName].fightRate > this.gameEngine.paramsByRoom[roomName].maxFightRate) {
                    this.gameEngine.paramsByRoom[roomName].fightRate = 
                    this.gameEngine.paramsByRoom[roomName].maxFightRate - this.gameEngine.paramsByRoom[roomName].fightRateDec;
                }

            }
        }
        if (stage != this.prevStage) this.updateSound();
        this.prevStage = stage;
    }

    /// GAME EVENTS

    onUpdatePalette() {
        let palettes = this.gameEngine.paramsByRoom[this.player.room].palettes;
        this.player.palette = palettes[(palettes.indexOf(this.player.palette) + 1) % palettes.length];
        this.socket.emit('updatePalette', this.player.palette);
        this.player.grid.fill(this.player.palette);
        this.updateSound();
    }

    onEggBounce(e) {
        for (let player of this.soundingPlayers)
        {
            let p = player.number
            if (this.eggSynths[p] == null) this.constructEggSynths(player, e);
            else if (this.eggSynths[p][e.toString()] == null) this.constructEggSynths(player, e);
            if (this.gameEngine.positionIsInPlayer(e.position.x, player)) {
                let pal = this.gameEngine.paramsByRoom[player.room].paletteAttributes[player.palette];
                let scale = pal.scale;
                let chord = pal.pitchSets[this.pitchSetIndex];
                let pitch = Math.floor(Math.random() * chord.length);
                if (e.sound === 'melody') {
                    this.playPitchOnSynth(this.eggSynths[p][e.toString()].bounce, pitch, chord, scale, 6, '16n', '+0.01', 0.2);
                }
                else if (e.sound === 'bass') {
                    this.playPitchOnSynth(this.eggSynths[p][e.toString()].bounce, pitch, chord, scale, 4, '16n', '+0.01', 0.2);
                }
                else if (e.sound === 'perc') {
                    this.eggSynths[p][e.toString()].bounce.triggerAttackRelease('16n', '+0.01', 0.2);
                }
            }
        }
    }

    onPlayerHitEgg(e) {
        let p = this.player;
        if (e.hp <= 0) return;
        if (p.ammo <= 0 && p.stage != 'outro') return;
        p.ammo--;
        e.hp--;

        let playerWidth = this.gameEngine.paramsByRoom[p.room].playerWidth;
        let playerHeight = this.gameEngine.paramsByRoom[p.room].playerHeight;
        let pal = this.gameEngine.paramsByRoom[p.room].paletteAttributes[p.palette];
        let shadowId = this.gameEngine.getNewShadowId();
        this.socket.emit('playerHitEgg', p.ammo, e.id, e.hp, e.position.x, e.position.y, e.sound, shadowId);
        let pos = this.gameEngine.quantizedPosition(e.position.x, e.position.y, playerWidth, playerHeight, p.room);
        let dur = pal[e.sound].subdivision;

        let notes = this.gameEngine.queryNotes({            
            ownerId: p.playerId, 
            //palette: p.grid[pos[0]%playerWidth + ((pos[1]%playerHeight) * playerWidth)],
            palette: p.palette,
            sound: e.sound, 
            //vel: 1, 
            xPos: pos[0],
            yPos: pos[1]
        });
        if (notes.length) notes[0].dur = '2n';
        else {
            let newNote = new Note(this.gameEngine, null, { 
                id: shadowId,
                ownerId: p.playerId, 
                //palette: p.grid[pos[0]%playerWidth + ((pos[1]%playerHeight) * playerWidth)],
                palette: p.palette,
                sound: e.sound, 
                sound: e.sound, 
                dur: dur,
                vel: 1, 
                xPos: pos[0],
                yPos: pos[1],
                position: new TwoVector(pos[0], pos[1])
            });
            newNote.inputId = shadowId;
            this.gameEngine.addObjectToWorld(newNote);
        }
    }

    onEggBroke(e) {
        //console.log('egg broke');
        for (let player of this.soundingPlayers)
        {
            let p = player.number;
            if (this.eggSynths[p] == null) this.constructEggSynths(player, e);
            else if (this.eggSynths[p][e.toString()] == null) this.constructEggSynths(player, e);

            this.eggSynths[p][e.toString()].drone.triggerRelease();
            if (this.gameEngine.positionIsInPlayer(e.position.x, player)) {
                this.eggSynths[p][e.toString()].break.start(this.nextDiv('4n'));
                if (p == this.player.number)
                {
                    this.optionSelection['Digit1'] = 'build';
                    this.optionSelection['Digit2'] = 'fight';
                    // this.optionSelection['Digit3'] = 'faster';
                    // this.optionSelection['Digit4'] = 'slower';
                    this.optionSelection['Numpad1'] = 'build';
                    this.optionSelection['Numpad2'] = 'fight';
                    // this.optionSelection['Numpad3'] = 'faster';
                    // this.optionSelection['Numpad4'] = 'slower';
                }
            }
        }
    }

    //// SOUND

    initSound() {
        //this.transport.timeSignature = 4;

        console.log('initSound' + this.players.length);

        this.reverb = new Reverb(1).toDestination();
        this.distVolume = new Volume(-12).toDestination();
        this.distVolume.connect(this.reverb);
        this.distortion = new Distortion(1).connect(this.distVolume);
        this.reverb.generate();

        this.eggVolume = new Volume(0).toDestination();
        this.eggVolume.connect(this.reverb);

        let roomName = this.room;

        this.melodySynth = {};
        this.bassSynth = {};
        this.percSynth = {};

        for (let player of this.soundingPlayers)
        {
            let pal = this.gameEngine.paramsByRoom[roomName].paletteAttributes[player.palette];

            let p = player.number;

            this.melodySynth[p] = new PolySynth(FMSynth, {
                "volume": -3,
                "modulationIndex": pal.melody.modulationIndex,
                "harmonicity": pal.melody.harmonicity,
                "oscillator": {
                    "type" : pal.melody.osc
                },
                "envelope" : {
                    "attack" : 0.01,
                    "decay" : 0.1,
                    "sustain": 0.2
                },
                "modulation" : {
                    "type" : pal.melody.modType
                },
                "modulationEnvelope" : {
                    "attack" : 0.03,
                    "decay" : 0.7
                }
            }).toDestination();
            this.melodySynth[p].connect(this.reverb);
    
            //this.gameEngine.paramsByRoom[roomName].playerHeight
            this.bassSynth[p] = new PolySynth(FMSynth, {
                "modulationIndex" : pal.bass.modulationIndex,
                "harmonicity": pal.bass.harmonicity,
                "oscillator": {
                    "type" : pal.bass.osc
                },
                "envelope" : {
                    "attack" : 0.01,
                    "decay" : 0.1,
                    "sustain": 0.5
                },
                "modulation" : {
                    "type" : pal.bass.modType
                },
                "modulationEnvelope" : {
                    "attack" : 0.01,
                    "decay" : 0.07
                }
            }).toDestination();
            this.bassSynth[p].connect(this.reverb);
    
            //this.gameEngine.playerHeight
            this.percSynth[p] = new PolySynth(MembraneSynth, {
                "volume" : -1,
                "pitchDecay" : pal.perc.pitchDecay,//0.05,
                "octaves" : pal.perc.octaves,//10 ,
                "oscillator" : {
                    "type" : pal.perc.osc//sine
                },
                "envelope" : {
                    "attack" : 0.001 ,
                    "decay" : 0.4 ,
                    "sustain" : 0.01 
                }
            });//.toDestination();
            this.percSynth[p].connect(this.distortion);
        }
    }

    initSequences()
    {
        console.log('initSequences');
        let roomName = this.room;
        
        let events = [];
        for (let i = 0; i < this.gameEngine.paramsByRoom[roomName].playerWidth; i++) {
           events.push(i);
        }

        let pal = this.gameEngine.paramsByRoom[roomName].paletteAttributes[this.player.palette];

        this.melodySequence = new Sequence((time, step) => {
            this.melodyStep = step;

            for (let player of this.soundingPlayers)
            {
                let p = player.number;
                if (this.sequences[p] == null) continue;
                if (this.sequences[p].melody == null) continue;
                if (this.melodySynth[p] == null) continue;
                let seqStep = this.sequences[p].melody[this.melodyStep];
                let octaveShift = this.gameEngine.paramsByRoom[roomName].melodyBuildOctave;
                if (this.player.stage == "fight" || this.player.stage == "fightEnd") 
                    octaveShift = this.gameEngine.paramsByRoom[roomName].melodyFightOctave;
                if (seqStep) this.playNoteArrayOnSynth(this.melodySynth[p], seqStep, octaveShift, time, true);
            }
        }, events, pal.melody.subdivision);

        this.bassSequence = new Sequence((time, step) => {
            this.bassStep = step; 

            for (let player of this.soundingPlayers)
            {
                let p = player.number;
                if (this.sequences[p] == null) continue;
                if (this.sequences[p].bass == null) continue;
                if (this.bassSynth[p] == null) continue;
                let seqStep = this.sequences[p].bass[this.bassStep];
                let octaveShift = this.gameEngine.paramsByRoom[roomName].bassBuildOctave;
                if (this.player.stage == "fight" || this.player.stage == "fightEnd") 
                    octaveShift = this.gameEngine.paramsByRoom[roomName].bassFightOctave;
                if (seqStep) this.playNoteArrayOnSynth(this.bassSynth[p], seqStep, octaveShift, time, true);       
            }
        }, events, pal.bass.subdivision);

        this.percSequence = new Sequence((time, step) => {
            this.percStep = step;

            for (let player of this.soundingPlayers)
            {
                let p = player.number;

                if (this.sequences[p] == null) continue;
                if (this.sequences[p].perc == null) continue;
                if (this.percSynth[p] == null) continue;
                let seqStep = this.sequences[p].perc[this.percStep];
                let octaveShift = this.gameEngine.paramsByRoom[roomName].percBuildOctave;
                if (player.stage == "fight" || player.stage == "fightEnd") 
                    octaveShift = this.gameEngine.paramsByRoom[roomName].percFightOctave;
                if (seqStep) this.playNoteArrayOnSynth(this.percSynth[p], seqStep, octaveShift, time, true);
            }
        }, events, pal.perc.subdivision);
    }

    // update sounds during the game as the stage and colors change
    updateSound()
    {
        console.log('updateSound');
        if (this.reverb == null) this.initSound();
        if (this.melodySequence == null) this.initSequences();

        let release = 0.5;
        let sustain = 0.5;
        let decay = 0.1;
        if (this.player.stage == "build") {
            this.transport.scheduleOnce(() => {
                this.melodySequence.playbackRate = this.gameEngine.paramsByRoom[this.room].buildRate;
                this.bassSequence.playbackRate = this.gameEngine.paramsByRoom[this.room].buildRate;
                this.percSequence.playbackRate = this.gameEngine.paramsByRoom[this.room].buildRate;   
            }, this.nextDiv('1m'));
            release = this.gameEngine.paramsByRoom[this.room].buildRelease;
        }
        else if (this.player.stage == "fight") {
            this.transport.scheduleOnce(() => {
                this.melodySequence.playbackRate = this.gameEngine.paramsByRoom[this.room].fightRate;
                this.bassSequence.playbackRate = this.gameEngine.paramsByRoom[this.room].fightRate;
                this.percSequence.playbackRate = this.gameEngine.paramsByRoom[this.room].fightRate;
            }, this.nextDiv('1m'));
            sustain = 0.0;
            decay = this.gameEngine.paramsByRoom[this.room].fightRelease;
        }
        else if (this.player.stage == "outro") {
            this.transport.scheduleOnce(() => {
                this.melodySequence.playbackRate = this.gameEngine.paramsByRoom[this.room].outroRate;
                this.bassSequence.playbackRate = this.gameEngine.paramsByRoom[this.room].outroRate;
                this.percSequence.playbackRate = this.gameEngine.paramsByRoom[this.room].outroRate; 
            }, this.nextDiv('1m'));
            release = this.gameEngine.paramsByRoom[this.room].outroRelease;
        }

        this.transport.scheduleOnce(() => {
            for (let player of this.soundingPlayers)
            {
                let pal = this.gameEngine.paramsByRoom[this.room].paletteAttributes[player.palette];
                let p = player.number;

                this.melodySynth[p].set({
                    "modulationIndex" : pal.melody.modulationIndex,
                    "harmonicity": pal.melody.harmonicity,
                    "oscillator": {
                        "type" : pal.melody.osc
                    },
                    "envelope" : {
                        "sustain" : sustain,
                        "release" : release
                    },

                    "modulation" : {
                        "type" : pal.melody.modType
                    },
                    "modulationEnvelope" : {
                        "attack" : 0.03,
                        "decay" : 0.7,
                        "sustain" : sustain,
                        "release" : release
                    }
                });

                this.bassSynth[p].set({
                    "modulationIndex" : pal.bass.modulationIndex,
                    "harmonicity": pal.bass.harmonicity,
                    "oscillator": {
                        "type" : pal.bass.osc
                    },
                    "envelope" : {
                        "attack" : 0.01,
                        "decay" : decay,
                        "sustain" : sustain,
                        "release" : release
                    },
                    "modulation" : {
                        "type" : pal.bass.modType
                    },
                    "modulationEnvelope" : {
                        "attack" : 0.01,
                        "decay" : 0.07,
                        "sustain" : sustain,
                        "release" : release
                    }
                });
            
                this.percSynth[p].set({
                    "pitchDecay" : pal.perc.pitchDecay,//0.05,
                    "octaves" : pal.perc.octaves,//10 ,
                    "oscillator" : {
                        "type" : pal.perc.osc//sine
                    },
                    "envelope" : {
                        "attack" : 0.001 ,
                        "decay" : 0.4 ,
                        "sustain" : 0.01 ,
                        "release" : release
                    }
                });
            }
        }, this.nextDiv('1m'));
    }

    constructEggSynths(player, e) {
        if (this.gameEngine.paramsByRoom[this.room] == null) return;

        let pal = this.gameEngine.paramsByRoom[this.room].paletteAttributes[player.palette];

        let p = player.number;

        if (this.eggSynths[p] == null) this.eggSynths[p] = {};

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
            this.eggSynths[p][e.toString()] = {
                drone: new FMSynth({
                    "modulationIndex" : 4,
                    "harmonicity": 4,
                    "oscillator": {
                        "type" : "sawtooth2",
                    },
                    "envelope" : {
                        "attack" : 0.5,
                        "decay" : 0.1,
                        "sustain": 0.5
                    },
                    "modulation" : {
                        "type" : "sine"
                    },
                    "modulationEnvelope" : {
                        "attack" : 0.03,
                        "decay" : 0.7,
                        "sustain" : 0.5
                    }
                }).connect(this.eggVolume),
                bounce: new FMSynth({
                    "modulationIndex" : 4,
                    "harmonicity": 4,
                    "oscillator": {
                        "type" : "sawtooth4",
                    },
                    "envelope" : {
                        "attack" : 0.01,
                        "decay" : 0.1,
                    },
                    "modulation" : {
                        "type" : "sine"
                    },
                    "modulationEnvelope" : {
                        "attack" : 0.03,
                        "decay" : 0.7
                    }
                }).connect(this.eggVolume),
                breakSynth: synth.connect(this.eggVolume), 
                break: new Sequence((time, pitch) => {
                    let scale = pal.scale;
                    let chord = pal.pitchSets[this.pitchSetIndex];
                    this.playPitchOnSynth(synth, pitch, chord, scale, 6, '4n', time, 0.2);
                }, [[4, 2, 3, 1, 3, 1, 2, 0], null, null, null], '4n')
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
            this.eggSynths[p][e.toString()] = {
                drone: new FMSynth({
                    "modulationIndex" : 4,
                    "harmonicity": 5,
                    "oscillator": {
                        "type" : "sawtooth2",
                    },
                    "envelope" : {
                        "attack" : 0.5,
                        "decay" : 0.28,
                        "sustain": 0.5
                    },
                    "modulation" : {
                        "type" : "square"
                    },
                    "modulationEnvelope" : {
                        "attack" : 0.5,
                        "decay" : 0.06, 
                        "sustain" : 0.5
                    }
                }).connect(this.eggVolume),
                bounce: new FMSynth({
                    "modulationIndex" : 6,
                    "harmonicity": 1.5,
                    "oscillator": {
                        "type" : "sawtooth4",
                    },
                    "envelope" : {
                        "attack" : 0.01,
                        "decay" : 0.28,
                        "sustain": 0.0
                    },
                    "modulation" : {
                        "type" : "square"
                    },
                    "modulationEnvelope" : {
                        "attack" : 0.01,
                        "decay" : 0.06
                    }
                }).connect(this.eggVolume),
                breakSynth: synth.connect(this.eggVolume), 
                break: new Sequence((time, pitch) => {
                    let scale = pal.scale;
                    let chord = pal.pitchSets[this.pitchSetIndex];
                    this.playPitchOnSynth(synth, pitch, chord, scale, 6, '4n', time, 0.2);
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
            this.eggSynths[p][e.toString()] = {
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
                }).connect(this.eggVolume),
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
                }).connect(this.eggVolume),
                breakSynth: synth.connect(this.eggVolume), 
                break: new Sequence((time, pitch) => {
                    let scale = pal.scale;
                    let chord = pal.pitchSets[this.pitchSetIndex];
                    this.playPitchOnSynth(synth, pitch, chord, scale, 6, '4n', time, 0.2);
                }, [[0, 4, null, null, null, null, 1, 5], null, null, null], '4n')
            };
        }

        let pitch = pal.scale[pal.pitchSets[this.pitchSetIndex][0]];
        if (e.sound === 'melody') {
            this.eggSynths[p][e.toString()].drone.triggerAttack(Frequency(pitch + 72, 'midi'), '+0.01', 0.2);
        }
        else if (e.sound === 'bass') {
            this.eggSynths[p][e.toString()].drone.triggerAttack(Frequency(pitch + 36, 'midi'), '+0.01', 0.3);    
        }
        else if (e.sound === 'perc') {
            this.eggSynths[p][e.toString()].drone.triggerAttack('+0.01', 0.02);
        }
        this.eggSynths[p][e.toString()].break.loop = 1;
    }

    playPitchOnSynth(synth, pitch, chord, scale, octaveShift, dur, time, vel) {
        let degree = pitch % chord.length;
        let octave = Math.floor(pitch / chord.length) + octaveShift;
        let midi = Frequency(scale[chord[degree]] + (12 * octave), 'midi');
        synth.triggerAttackRelease(midi, dur, time, vel);
    }

    playNoteArrayOnSynth(synth, noteArray, octaveShift, time) {
        if (!noteArray) return;
        let idArray = [];
        let pitchArray = [];
        let i = 0;
        for (let note of noteArray) {
            if (note.room == null) continue;
            let pal = this.gameEngine.paramsByRoom[note.room].paletteAttributes[note.palette];
            if (!pitchArray.includes(note.pitch)) {
                this.playPitchOnSynth(synth, note.pitch, pal.pitchSets[this.pitchSetIndex], pal.scale, octaveShift, note.dur, time + (i*0.0001), note.vel);
            }
            idArray.push(note.id);
            pitchArray.push(note.pitch);
            i++;
        }

        //this.socket.emit('paintStep', idArray);
    }

    paintNote(n) {
        if (this.isSpectator) return;
        n.paint();
        this.socket.emit('paintCell', n.id, n.xPos, n.yPos, n.palette);
    }

    nextDiv(div) {
        return Transport.getSecondsAtTime(Transport.nextSubdivision(div));
    }
}
