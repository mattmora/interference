"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lanceGg = require("lance-gg");

var _client = _interopRequireDefault(require("@ircam/sync/client"));

var _InterferenceRenderer = _interopRequireDefault(require("../client/InterferenceRenderer"));

var _tone = require("tone");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var keyCodeTable = {
  3: 'break',
  8: 'backspace',
  // backspace / delete
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
var durs = ['4n', '8n', '6n'];
var noteIndex = 0;
var rhythmIndex = 0;
var viewLock = false;

var InterferenceClientEngine =
/*#__PURE__*/
function (_ClientEngine) {
  _inherits(InterferenceClientEngine, _ClientEngine);

  function InterferenceClientEngine(gameEngine, options) {
    var _this;

    _classCallCheck(this, InterferenceClientEngine);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(InterferenceClientEngine).call(this, gameEngine, options, _InterferenceRenderer.default));
    _this.syncClient = null;
    _this.transport = _tone.Transport;
    _this.notestack = [];
    _this.rhythmstack = ['4n'];
    _this.room = null;
    _this.performanceView = false;
    return _this;
  }

  _createClass(InterferenceClientEngine, [{
    key: "start",
    value: function start() {
      var _this2 = this;

      _get(_getPrototypeOf(InterferenceClientEngine.prototype), "start", this).call(this);

      var btn = document.getElementById('startButton');
      var roomNameInput = document.getElementById('roomNameInput');
      var roomNameErrorText = document.querySelector('#startMenu .room-input-error');

      btn.onclick = function () {
        var regex = /^\w+$/;

        if (regex.exec(roomNameInput.value) !== null) {
          _this2.assignToRoom(roomNameInput.value.substring(0, 20));
        } else {
          roomNameErrorText.style.display = 'inline';
        }
      }; // LOCAL CONTROLS
      // Any inputs that do nothing server-side (i.e. doesn't need to be known by other players)


      document.addEventListener('keypress', function (e) {
        if (document.activeElement === roomNameInput) {
          if (keyCodeTable[e.keyCode] === 'enter') {
            var regex = /^\w+$/;

            if (regex.exec(roomNameInput.value) !== null) {
              _this2.assignToRoom(roomNameInput.value.substring(0, 20));
            } else {
              roomNameErrorText.style.display = 'inline';
            }
          }
        } else {
          if (keyCodeTable[e.keyCode] === 'space') {
            console.log('space');

            if (_this2.transport.state !== 'started') {
              _this2.transport.start();

              _this2.transport.seconds = _this2.syncClient.getSyncTime();

              _this2.sequencerLoop(0);
            } else {
              _this2.transport.pause();
            }
          }

          if (keyCodeTable[e.keyCode] === 'v') {
            if (!viewLock) _this2.performanceView = !_this2.performanceView;
          }

          if (keyCodeTable[e.keyCode] === 'forward slash / ç') {
            viewLock = !viewLock;
          }
        }
      }); // NETWORKED CONTROLS
      // These inputs will also be processed on the server

      console.log('binding keys');
      this.controls = new _lanceGg.KeyboardControls(this); //this.controls.bindKey('space', 'space');

      this.controls.bindKey('n', 'n');
      this.controls.bindKey('c', 'c');
      this.synth = new _tone.Synth({
        oscillator: {
          type: 'sine',
          modulationFrequency: 0.2
        },
        envelope: {
          attack: 0,
          decay: 0.1,
          sustain: 0,
          release: 0.1
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
  }, {
    key: "connect",
    value: function connect() {
      var _this3 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return _get(_getPrototypeOf(InterferenceClientEngine.prototype), "connect", this).call(this).then(function () {
        _this3.socket.on('assignedRoom', function (roomName) {
          _this3.room = roomName;
          var startTime = performance.now();
          _this3.syncClient = new _client.default(function () {
            return (performance.now() - startTime) / 1000;
          });

          _this3.syncClient.start( // send function
          function (pingId, clientPingTime) {
            var request = [];
            request[0] = 0; // we send a ping

            request[1] = pingId;
            request[2] = clientPingTime; //console.log('[ping] - id: %s, pingTime: %s', request[1], request[2]);

            _this3.socket.emit('syncClientData', request);
          }, // receive function  
          function (callback) {
            // unpack args before executing the callback
            _this3.socket.on('syncServerData', function (data) {
              var response = data;

              if (response[0] === 1) {
                // this is a pong
                var pingId = response[1];
                var clientPingTime = response[2];
                var serverPingTime = response[3];
                var serverPongTime = response[4]; //console.log('[pong] - id: %s, clientPingTime: %s, serverPingTime: %s, serverPongTime: %s',
                //pingId, clientPingTime, serverPingTime, serverPongTime);

                callback(pingId, clientPingTime, serverPingTime, serverPongTime);
              }
            });
          }, // status report function
          function (status) {} //console.log(status); }
          );
        });
      });
    }
  }, {
    key: "assignToRoom",
    value: function assignToRoom(roomName) {
      if (this.socket) {
        this.socket.emit('assignToRoom', roomName);
        document.getElementById('startMenuWrapper').style.display = 'none';
      }
    }
  }, {
    key: "sequencerLoop",
    value: function sequencerLoop(thisTime) {
      var _this4 = this;

      this.rhythmstack = ['4n'];
      console.log('step');

      if (this.notestack.length && this.rhythmstack.length) {
        if (noteIndex >= this.notestack.length) noteIndex = 0;
        if (rhythmIndex >= this.rhythmstack.length) rhythmIndex = 0;
        this.synth.triggerAttackRelease(this.notestack[noteIndex], '8n', thisTime);
        this.transport.scheduleOnce(function (nextTime) {
          _this4.sequencerLoop(nextTime);
        }, _tone.Transport.getSecondsAtTime(_tone.Transport.nextSubdivision(this.rhythmstack[rhythmIndex])));
        noteIndex++;
        rhythmIndex++;
      } else {
        noteIndex = 0;
        rhythmIndex = 0;
        this.transport.scheduleOnce(function (nextTime) {
          _this4.sequencerLoop(nextTime);
        }, _tone.Transport.getSecondsAtTime(_tone.Transport.nextSubdivision('1m')));
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

  }]);

  return InterferenceClientEngine;
}(_lanceGg.ClientEngine);

exports.default = InterferenceClientEngine;
//# sourceMappingURL=InterferenceClientEngine.js.map