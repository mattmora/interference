"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lanceGg = require("lance-gg");

var _client = _interopRequireDefault(require("@ircam/sync/client"));

var _InterferenceRenderer = _interopRequireDefault(require("../client/InterferenceRenderer"));

var _Performer = _interopRequireDefault(require("../common/Performer"));

var _Egg = _interopRequireDefault(require("../common/Egg"));

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

var durs = ['4n', '8n', '6n'];
var noteIndex = 0;
var rhythmIndex = 0;
var viewLock = false;

var InterferenceClientEngine =
/*#__PURE__*/
function (_ClientEngine) {
  _inherits(InterferenceClientEngine, _ClientEngine);

  /// INITIALIZATION AND CONNECTION
  function InterferenceClientEngine(gameEngine, options) {
    var _this;

    _classCallCheck(this, InterferenceClientEngine);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(InterferenceClientEngine).call(this, gameEngine, options, _InterferenceRenderer.default));
    _this.syncClient = null;
    _this.transport = _tone.Transport;
    _this.player = null;
    _this.room = null;
    _this.players = [];
    _this.eggs = [];
    _this.eggSounds = {};
    _this.performanceView = false;
    _this.controls = new _lanceGg.KeyboardControls(_assertThisInitialized(_this));
    _this.prevState = 'setup';

    _this.gameEngine.on('client__postStep', _this.stepLogic.bind(_assertThisInitialized(_this)));

    _this.gameEngine.on('eggBounce', function (e) {
      _this.onEggBounce(e);
    });

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
        console.log(e.code);

        if (document.activeElement === roomNameInput) {
          if (e.code === 'Enter') {
            var regex = /^\w+$/;

            if (regex.exec(roomNameInput.value) !== null) {
              _this2.assignToRoom(roomNameInput.value.substring(0, 20));
            } else {
              roomNameErrorText.style.display = 'inline';
            }
          }
        } else {
          if (e.code === 'Backquote') {
            if (_this2.transport.state !== 'started') {
              _this2.transport.start();

              _this2.transport.seconds = _this2.syncClient.getSyncTime(); //this.sequencerLoop(0);
            } else {
              _this2.transport.pause();
            }
          } else if (e.code === 'KeyV') {
            console.log('view');
            if (!viewLock) _this2.performanceView = !_this2.performanceView;
          } else if (e.code === 'Slash') {
            console.log('lock');
            viewLock = !viewLock;
          }
        }
      }); //this.transport.timeSignature = 4;

      this.reverb = new _tone.Reverb(1).toMaster();
      this.reverb.generate();
      this.bitcrusher = new _tone.BitCrusher(4).toMaster();
      this.autowah = new _tone.AutoWah().connect(this.reverb);
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
      }).toMaster(); // BUILDERS
      // Tetris Chain

      this.tetrisChainSynth = new _tone.Synth({
        oscillator: {
          type: 'triangle',
          modulationFrequency: 0.2
        },
        envelope: {
          attack: 0.1,
          decay: 0.1,
          sustain: 0.5,
          release: 0.1
        }
      }).toMaster();
      this.tetrisChainSequence = new _tone.Sequence(function (time, note) {
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
  }, {
    key: "connect",
    value: function connect() {
      var _this3 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return _get(_getPrototypeOf(InterferenceClientEngine.prototype), "connect", this).call(this).then(function () {
        _this3.socket.on('assignedRoom', function (roomName) {
          _this3.room = roomName;

          _this3.transport.start();

          _this3.startSyncClient(_this3.socket);

          _this3.startEffects();
        });
      });
    }
  }, {
    key: "startSyncClient",
    value: function startSyncClient(socket) {
      var _this4 = this;

      var startTime = performance.now();
      this.syncClient = new _client.default(function () {
        return (performance.now() - startTime) / 1000;
      });
      this.syncClient.start( // send function
      function (pingId, clientPingTime) {
        var request = [];
        request[0] = 0; // we send a ping

        request[1] = pingId;
        request[2] = clientPingTime; //console.log('[ping] - id: %s, pingTime: %s', request[1], request[2]);

        _this4.socket.emit('syncClientData', request);
      }, // receive function  
      function (callback) {
        // unpack args before executing the callback
        _this4.socket.on('syncServerData', function (data) {
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
    }
  }, {
    key: "assignToRoom",
    value: function assignToRoom(roomName) {
      if (this.socket) {
        this.socket.emit('assignToRoom', roomName);
        document.getElementById('startMenuWrapper').style.display = 'none'; // NETWORKED CONTROLS
        // These inputs will also be processed on the server

        console.log('binding keys'); //this.controls.bindKey('space', 'space');

        this.controls.bindKey('open bracket', '[');
        this.controls.bindKey('close bracket / å', ']');
        this.controls.bindKey('n', 'n');
        this.controls.bindKey('b', 'b'); // begin

        this.controls.bindKey('c', 'c'); // change color
      }
    } ///////////////////////////////////////////////////////////////////////////////////////////
    /// SOUND HANDLING

  }, {
    key: "stepLogic",
    value: function stepLogic() {
      if (this.room === null) return; //if we yet to be assigned a room, don't do this stuff

      this.player = this.gameEngine.world.queryObject({
        playerId: this.gameEngine.playerId
      });
      this.players = this.gameEngine.world.queryObjects({
        instanceType: _Performer.default
      });
      this.eggs = this.gameEngine.world.queryObjects({
        instanceType: _Egg.default
      });
      var stage = this.player.stage;

      if (stage === 'setup') {} else if (stage === 'intro') {
        if (this.transport.state !== 'started' && this.prevStage !== stage) {
          this.transport.start();
          this.transport.seconds = this.syncClient.getSyncTime();
        }

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = this.eggs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var e = _step.value;
            if (!Object.keys(this.eggSounds).includes(e.toString())) this.constructEggSounds(e);
            var vol = 1 - 0.3 * Math.abs(this.player.number - Math.floor(e.position.x / this.gameEngine.playerWidth));
            if (vol < 0) vol = 0;
            this.eggSounds[e.toString()].drone.volume.rampTo(vol, 0.1);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }

      this.prevStage = stage;
    }
  }, {
    key: "onEggBounce",
    value: function onEggBounce(e) {
      if (!Object.keys(this.eggSounds).includes(e.toString())) this.constructEggSounds(e);
      var leftBound = this.player.number * this.gameEngine.playerWidth;
      var rightBound = (this.player.number + 1) * this.gameEngine.playerWidth;

      if (leftBound < e.position.x && e.position.x < rightBound) {
        this.eggSounds[e.toString()].bounce.triggerAttackRelease('8n');
      }
    }
  }, {
    key: "startEffects",
    value: function startEffects() {//this.bitcrusher.start();
    }
  }, {
    key: "constructEggSounds",
    value: function constructEggSounds(e) {
      //console.log('making egg sounds');
      console.log(e.toString());
      this.eggSounds[e.toString()] = {
        drone: new _tone.NoiseSynth({
          noise: {
            type: 'pink'
          },
          envelope: {
            attack: 1,
            decay: 0.1,
            sustain: 1,
            release: 0.1
          }
        }),
        bounce: new _tone.NoiseSynth({
          noise: {
            type: 'white'
          },
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.1,
            release: 0.5
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

  }]);

  return InterferenceClientEngine;
}(_lanceGg.ClientEngine);

exports.default = InterferenceClientEngine;
//# sourceMappingURL=InterferenceClientEngine.js.map