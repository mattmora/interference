import { ClientEngine, KeyboardControls } from 'lance-gg';
import SyncClient from '@ircam/sync/client';
import InterferenceRenderer from '../client/InterferenceRenderer';
import { Transport, Synth, Frequency } from 'tone';

const keyCodeTable = {
    3: 'break',
    8: 'backspace', // backspace / delete
    9: 'tab',
    12: 'clear',
    13: 'enter',
    16: 'shift',
    17: 'ctrl',
    18: 'alt',
    19: 'pause/break',
    20: 'caps lock',
    27: 'escape',
    28: 'conversion',
    29: 'non-conversion',
    32: 'space',
    33: 'page up',
    34: 'page down',
    35: 'end',
    36: 'home',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    41: 'select',
    42: 'print',
    43: 'execute',
    44: 'Print Screen',
    45: 'insert',
    46: 'delete',
    48: '0',
    49: '1',
    50: '2',
    51: '3',
    52: '4',
    53: '5',
    54: '6',
    55: '7',
    56: '8',
    57: '9',
    58: ':',
    59: 'semicolon (firefox), equals',
    60: '<',
    61: 'equals (firefox)',
    63: 'ß',
    64: '@',
    65: 'a',
    66: 'b',
    67: 'c',
    68: 'd',
    69: 'e',
    70: 'f',
    71: 'g',
    72: 'h',
    73: 'i',
    74: 'j',
    75: 'k',
    76: 'l',
    77: 'm',
    78: 'n',
    79: 'o',
    80: 'p',
    81: 'q',
    82: 'r',
    83: 's',
    84: 't',
    85: 'u',
    86: 'v',
    87: 'w',
    88: 'x',
    89: 'y',
    90: 'z',
    91: 'Windows Key / Left ⌘ / Chromebook Search key',
    92: 'right window key',
    93: 'Windows Menu / Right ⌘',
    96: 'numpad 0',
    97: 'numpad 1',
    98: 'numpad 2',
    99: 'numpad 3',
    100: 'numpad 4',
    101: 'numpad 5',
    102: 'numpad 6',
    103: 'numpad 7',
    104: 'numpad 8',
    105: 'numpad 9',
    106: 'multiply',
    107: 'add',
    108: 'numpad period (firefox)',
    109: 'subtract',
    110: 'decimal point',
    111: 'divide',
    112: 'f1',
    113: 'f2',
    114: 'f3',
    115: 'f4',
    116: 'f5',
    117: 'f6',
    118: 'f7',
    119: 'f8',
    120: 'f9',
    121: 'f10',
    122: 'f11',
    123: 'f12',
    124: 'f13',
    125: 'f14',
    126: 'f15',
    127: 'f16',
    128: 'f17',
    129: 'f18',
    130: 'f19',
    131: 'f20',
    132: 'f21',
    133: 'f22',
    134: 'f23',
    135: 'f24',
    144: 'num lock',
    145: 'scroll lock',
    160: '^',
    161: '!',
    163: '#',
    164: '$',
    165: 'ù',
    166: 'page backward',
    167: 'page forward',
    169: 'closing paren (AZERTY)',
    170: '*',
    171: '~ + * key',
    173: 'minus (firefox), mute/unmute',
    174: 'decrease volume level',
    175: 'increase volume level',
    176: 'next',
    177: 'previous',
    178: 'stop',
    179: 'play/pause',
    180: 'e-mail',
    181: 'mute/unmute (firefox)',
    182: 'decrease volume level (firefox)',
    183: 'increase volume level (firefox)',
    186: 'semi-colon / ñ',
    187: 'equal sign',
    188: 'comma',
    189: 'dash',
    190: 'period',
    191: 'forward slash / ç',
    192: 'grave accent / ñ / æ',
    193: '?, / or °',
    194: 'numpad period (chrome)',
    219: 'open bracket',
    220: 'back slash',
    221: 'close bracket / å',
    222: 'single quote / ø',
    223: '`',
    224: 'left or right ⌘ key (firefox)',
    225: 'altgr',
    226: '< /git >',
    230: 'GNOME Compose Key',
    231: 'ç',
    233: 'XF86Forward',
    234: 'XF86Back',
    240: 'alphanumeric',
    242: 'hiragana/katakana',
    243: 'half-width/full-width',
    244: 'kanji',
    255: 'toggle touchpad'
};

const durs = ['4n', '8n', '6n'];
let noteIndex = 0;
let rhythmIndex = 0;
let viewLock = false;

export default class InterferenceClientEngine extends ClientEngine {

    constructor(gameEngine, options) {
        super(gameEngine, options, InterferenceRenderer);

        this.syncClient = new SyncClient(() => { return performance.now() / 1000 });

        this.transport = Transport;
        this.notestack = [];
        this.rhythmstack = ['4n'];
        this.room = null;
        this.performanceView = false;
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
            if (document.activeElement === roomNameInput) {
                if (keyCodeTable[e.keyCode] === 'enter') {
                    let regex = /^\w+$/;
                    if (regex.exec(roomNameInput.value) !== null) {
                        this.assignToRoom(roomNameInput.value.substring(0, 20));
                    } else {
                        roomNameErrorText.style.display = 'inline';
                    }
                }
            }
            else {
                if (keyCodeTable[e.keyCode] === 'space') {
                    console.log('space');
                    if (this.transport.state !== 'started') {
                        this.transport.start();
                        this.transport.seconds = this.syncClient.getSyncTime();
                        this.sequencerLoop(0);
                    }   
                    else {
                        this.transport.pause();
                    }
                }
                if (keyCodeTable[e.keyCode] === 'v') {
                    if (!viewLock) this.performanceView = !this.performanceView;
                }
                if (keyCodeTable[e.keyCode] === 'forward slash / ç') {
                    viewLock = !viewLock;
                }
            }
        });

        // NETWORKED CONTROLS
        // These inputs will also be processed on the server
        console.log('binding keys');
        this.controls = new KeyboardControls(this);
        //this.controls.bindKey('space', 'space');
        this.controls.bindKey('n', 'n');
        this.controls.bindKey('c', 'c');


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
            this.socket.on('assignedRoom', roomName => { 
                this.room = roomName;
            });
        });
    }

    assignToRoom(roomName) {
        if (this.socket) {
            this.socket.emit('assignToRoom', roomName);
            document.getElementById('startMenuWrapper').style.display = 'none';
        }
    }

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
