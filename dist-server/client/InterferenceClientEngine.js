"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lanceGg = require("lance-gg");

var _client = _interopRequireDefault(require("@ircam/sync/client"));

var _InterferenceRenderer = _interopRequireDefault(require("../client/InterferenceRenderer"));

var _Note = _interopRequireDefault(require("../common/Note"));

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

var InterferenceClientEngine =
/*#__PURE__*/
function (_ClientEngine) {
  _inherits(InterferenceClientEngine, _ClientEngine);

  ///////////////////////////////////////////////////////////////////////////////////////////
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
    _this.viewLock = false;
    _this.controls = new _lanceGg.KeyboardControls(_assertThisInitialized(_this));
    _this.prevState = 'setup';
    _this.fullscreen = false;
    _this.optionSelection = {};
    _this.localControls = {
      //'Backquote': 'ToggleTransport',
      'KeyF': 'ToggleFullscreen',
      'KeyH': 'ToggleCursor',
      'KeyV': 'ToggleView',
      'Slash': 'ToggleLock'
    };
    _this.currentStep = null;

    _this.gameEngine.on('client__postStep', _this.stepLogic.bind(_assertThisInitialized(_this)));

    _this.gameEngine.on('eggBounce', function (e) {
      _this.onEggBounce(e);
    }); //this.gameEngine.on('playerHitEgg', e => { this.onPlayerHitEgg(e) });


    _this.gameEngine.on('eggBroke', function (e) {
      _this.onEggBroke(e);
    });

    return _this;
  }

  _createClass(InterferenceClientEngine, [{
    key: "executeLocalControl",
    value: function executeLocalControl(controlString) {
      if (controlString === 'ToggleTransport') {
        if (this.transport.state !== 'started') {
          this.transport.start();
          this.transport.seconds = this.syncClient.getSyncTime(); //this.sequencerLoop(0);
        } else {
          this.transport.pause();
        }
      } else if (controlString === 'ToggleFullscreen') {
        if (!this.viewLock) {
          var elem = this.renderer.canvas;

          if (!document.fullscreenElement) {
            elem.requestFullscreen({
              navigationUI: 'hide'
            }).then({}).catch(function (err) {//alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
          } else {
            document.exitFullscreen();
          }
        }
      } else if (controlString === 'ToggleCursor') {
        if (!this.viewLock) {
          if (document.pointerLockElement === document.body || document.mozPointerLockElement === document.body) {
            document.exitPointerLock();
          } else {
            document.body.requestPointerLock();
          }
        }
      } else if (controlString === 'ToggleView') {
        //console.log('view');
        if (!this.viewLock) this.performanceView = !this.performanceView;
      } else if (controlString === 'ToggleLock') {
        //console.log('lock');
        this.viewLock = !this.viewLock;
      }
    }
  }, {
    key: "executeOption",
    value: function executeOption(optionString) {
      console.log(optionString);
    }
  }, {
    key: "start",
    value: function start() {
      var _this2 = this;

      _get(_getPrototypeOf(InterferenceClientEngine.prototype), "start", this).call(this);

      var btn = document.getElementById('startButton');
      var roomNameInput = document.getElementById('roomNameInput');
      var roomNameErrorText = document.querySelector('#startMenu .room-input-error');

      btn.onclick = function () {
        var regex = /^\w+$/;

        if (regex.exec(roomNameInput.value) != null) {
          _this2.assignToRoom(roomNameInput.value.substring(0, 20));
        } else {
          roomNameErrorText.style.display = 'inline';
        }
      };

      document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock; // LOCAL CONTROLS
      // Any inputs that do nothing server-side (i.e. doesn't need to be known by other players)

      document.addEventListener('keypress', function (e) {
        //console.log(e.code);
        if (document.activeElement === roomNameInput) {
          if (e.code === 'Enter') {
            var regex = /^\w+$/;

            if (regex.exec(roomNameInput.value) != null) {
              _this2.assignToRoom(roomNameInput.value.substring(0, 20));
            } else {
              roomNameErrorText.style.display = 'inline';
            }
          }
        } else {
          if (_this2.optionSelection[e.code]) {
            _this2.executeOption(_this2.optionSelection[e.code]);
          }

          if (_this2.localControls[e.code]) {
            _this2.executeLocalControl(_this2.localControls[e.code]);
          }
        }
      }); //this.transport.timeSignature = 4;

      this.reverb = new _tone.Reverb(1).toMaster();
      this.delay = new _tone.FeedbackDelay(); //this.bitcrusher = new BitCrusher(4).connect(this.reverb); 

      this.autowah = new _tone.AutoWah().toMaster();
      this.autowah.connect(this.reverb);
      this.synth = new _tone.Synth({
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0,
          decay: 0.1,
          sustain: 0,
          release: 0.1
        }
      }).toMaster(); // BUILDERS
      // Tetris Chain

      this.eggMelodySynth = new _tone.PolySynth(9, _tone.Synth).toMaster();
      var events = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      this.eggMelodySequence = new _tone.Sequence(function (time, step) {
        _this2.currentStep = step;
        var seqStep = _this2.player.sequences.melody[step];
        if (seqStep) _this2.playStepOnSynth(_this2.eggMelodySynth, seqStep, 1, time, true);
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
    } ///////////////////////////////////////////////////////////////////////////////////////////
    /// SOUND HANDLING AND CLIENT LOGIC

  }, {
    key: "stepLogic",
    value: function stepLogic() {
      if (this.room == null) return; //if we yet to be assigned a room, don't do this stuff

      this.player = this.gameEngine.world.queryObject({
        playerId: this.gameEngine.playerId
      });
      this.players = this.gameEngine.world.queryObjects({
        instanceType: _Performer.default
      });
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.players[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var p = _step.value;
          if (p.gridString != null) p.grid = JSON.parse(p.gridString);

          var _arr = Object.keys(p.sequences);

          for (var _i = 0; _i < _arr.length; _i++) {
            var sound = _arr[_i];
            p.sequences[sound] = JSON.parse(p[sound]);
          }
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

      this.eggs = this.gameEngine.world.queryObjects({
        instanceType: _Egg.default
      });
      var stage = this.player.stage;

      if (stage === 'setup') {} else if (stage === 'intro') {
        if (this.transport.state !== 'started') {
          // && this.prevStage !== stage) {
          this.transport.start();
          this.transport.seconds = this.syncClient.getSyncTime();
        }

        if (this.eggMelodySequence.state !== 'started') {
          //console.log('start seq');
          this.eggMelodySequence.start(this.nextDiv('1m'));
        }

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = this.eggs[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var e = _step2.value;
            if (!Object.keys(this.eggSounds).includes(e.toString())) this.constructEggSounds(e);
            var vol = 1 - 0.3 * Math.abs(this.player.number - Math.floor(e.position.x / this.gameEngine.playerWidth));
            if (vol < 0) vol = 0;
            this.eggSounds[e.toString()].drone.volume.rampTo(vol, 0.1);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
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

      if (this.gameEngine.positionIsInPlayer(e.position.x, this.player)) {
        this.eggSounds[e.toString()].bounce.triggerAttackRelease('8n');
      }
    }
  }, {
    key: "onEggBroke",
    value: function onEggBroke(e) {
      console.log('egg broke');
      this.eggSounds[e.toString()].drone.triggerRelease();

      if (this.gameEngine.positionIsInPlayer(e.position.x, this.player)) {
        this.eggSounds[e.toString()].break.start(this.nextDiv('4n'));
        this.optionSelection['Digit1'] = 'tetrisChain';
      }
    }
  }, {
    key: "startEffects",
    value: function startEffects() {
      //this.bitcrusher.start();
      this.reverb.generate();
    }
  }, {
    key: "constructEggSounds",
    value: function constructEggSounds(e) {
      var _this5 = this;

      //console.log('making egg sounds');
      var scale = this.gameEngine.paletteAttributes[this.player.palette].scale;
      var synth = new _tone.Synth({
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.005,
          decay: 0.5,
          sustain: 0,
          release: 0.1
        }
      });
      this.eggSounds[e.toString()] = {
        drone: new _tone.NoiseSynth({
          noise: {
            type: 'pink'
          },
          envelope: {
            attack: 1,
            decay: 0.1,
            sustain: 1,
            release: 0.5
          }
        }),
        bounce: new _tone.NoiseSynth({
          noise: {
            type: 'pink'
          },
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.1,
            release: 0.5
          }
        }).toMaster(),
        breakSynth: synth.toMaster(),
        break: new _tone.Sequence(function (time, note) {
          var scale = _this5.gameEngine.paletteAttributes[_this5.player.palette].scale;

          _this5.playScaleNoteOnSynth(synth, note, scale, 6, '64n', time, 0.5);
        }, [[0, 1, 2, 3, 1, 2, 3, 4], null, null, null], '4n')
      };
      this.eggSounds[e.toString()].drone.connect(this.autowah);
      this.eggSounds[e.toString()].bounce.connect(this.reverb);
      this.eggSounds[e.toString()].breakSynth.connect(this.reverb);
      this.eggSounds[e.toString()].drone.triggerAttack('+0', 0.1);
      this.eggSounds[e.toString()].break.loop = true;
    }
  }, {
    key: "playScaleNoteOnSynth",
    value: function playScaleNoteOnSynth(synth, note, scale, octaveShift, dur, time, vel) {
      if (!note) return; //console.log(note);

      var degree = note % scale.length;
      var octave = Math.floor(note / scale.length) + octaveShift;
      var pitch = (0, _tone.Frequency)(scale[degree] + 12 * octave, 'midi'); //console.log(scale[degree] + (12 * octave));

      synth.triggerAttackRelease(pitch, dur, time, vel);
    }
  }, {
    key: "playStepOnSynth",
    value: function playStepOnSynth(synth, stepArray, octaveShift, time) {
      if (!stepArray) return; //console.log(note);

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = stepArray[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var note = _step3.value;
          //let scale = this.gameEngine.paletteAttributes[this.player.grid[note.cell.x][note.cell.y]];
          var scale = this.gameEngine.paletteAttributes[this.player.palette].scale;
          this.playScaleNoteOnSynth(synth, note.pitch, scale, octaveShift, note.dur, time, note.vel);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }, {
    key: "nextDiv",
    value: function nextDiv(div) {
      return _tone.Transport.getSecondsAtTime(_tone.Transport.nextSubdivision(div));
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