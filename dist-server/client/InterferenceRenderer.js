"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lanceGg = require("lance-gg");

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

var paletteTable = {
  'rain': {
    bg: '#3e2f5b',
    c1: '#d7dedc',
    c2: '#706563',
    c3: '#457eac',
    c4: '#748386'
  },
  'default': {
    bg: 'black',
    c1: 'white',
    c2: 'white',
    c3: 'white',
    c4: 'white'
  }
};
var transportSyncCount = 0;
var game = null;
var client = null;
var ctx = null;
var w = 0;
var h = 0;
var time = 0;
var players = [];
var playerId = 0;
var thisPlayer = null;
var prevNotestack = '';
var prevRhythmstack = '';
var bg = paletteTable['default'].bg;
var c1 = paletteTable['default'].c1;
var c2 = paletteTable['default'].c2;
var c3 = paletteTable['default'].c3;
var c4 = paletteTable['default'].c4;

var InterferenceRenderer =
/*#__PURE__*/
function (_Renderer) {
  _inherits(InterferenceRenderer, _Renderer);

  function InterferenceRenderer(gameEngine, clientEngine) {
    var _this;

    _classCallCheck(this, InterferenceRenderer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(InterferenceRenderer).call(this, gameEngine, clientEngine));
    game = _this.gameEngine;
    client = _this.clientEngine;
    _this.canvas = document.createElement('canvas');
    w = _this.canvas.width = window.innerWidth;
    h = _this.canvas.height = window.innerHeight;
    document.body.insertBefore(_this.canvas, document.getElementById('logo'));
    ctx = _this.ctx = _this.canvas.getContext('2d');
    _this.ctx.lineWidth = 5;
    window.addEventListener('resize', function () {
      _this.setRendererSize();
    });
    return _this;
  }

  _createClass(InterferenceRenderer, [{
    key: "draw",
    value: function draw(t, dt) {
      _get(_getPrototypeOf(InterferenceRenderer.prototype), "draw", this).call(this, t, dt);

      if (client.room === null) return;
      time = client.syncClient.getSyncTime();
      players = game.world.queryObjects({
        instanceType: _Performer.default
      });
      playerId = game.playerId;
      thisPlayer = game.world.queryObject({
        playerId: playerId
      });
      bg = paletteTable[thisPlayer.palette].bg;
      c1 = paletteTable[thisPlayer.palette].c1;
      c2 = paletteTable[thisPlayer.palette].c2;
      c3 = paletteTable[thisPlayer.palette].c3;
      c4 = paletteTable[thisPlayer.palette].c4;

      if (client.transport.state === 'started') {
        if (transportSyncCount >= game.transportSyncInterval) {
          client.transport.seconds = time;
          transportSyncCount = 0;
          console.log(client.transport.state);
        }

        transportSyncCount++;
      } // Clear the canvas


      ctx.clearRect(0, 0, w, h); // Transform the canvas
      // Note that we need to flip the y axis since Canvas pixel coordinates
      // goes from top to bottom, while physics does the opposite.

      ctx.save(); //ctx.scale(this.clientEngine.zoom, this.clientEngine.zoom);  // Zoom in and flip y axis
      // Draw all things

      this.drawField();
      /*
      if (this.gameEngine.playerId < 5) {
          Tone.Transport.seconds = t/1000;
          ctx.fillStyle = 'red';
      } */

      ctx.fillStyle = 'black';
      ctx.font = "20px Georgia";
      ctx.fillText(playerId, 50, 25);
      ctx.fillText(time, 50, 50);
      ctx.fillText(client.transport.position, 50, 75);
      ctx.restore();
    }
  }, {
    key: "drawField",
    value: function drawField() {
      var n = players.length;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = players[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var p = _step.value;
          var _i = p.number;

          var _x = _i / n * w;

          var _y = _i / n * h;

          ctx.fillStyle = paletteTable[p.palette].bg;
          ctx.fillRect(_x, 0, w / n, h / n);
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

      if (thisPlayer) {
        var i = thisPlayer.number;
        var x = i / n * w;
        var y = i / n * h;
        ctx.strokeStyle = 'black';
        ctx.strokeRect(x, 0, w / n, h / n);

        if (thisPlayer.notestack !== prevNotestack) {
          client.notestack = [];

          for (var c = 0; c < thisPlayer.notestack.length; c++) {
            client.notestack.push((0, _tone.Frequency)(thisPlayer.notestack.charCodeAt(c), 'midi').toNote());
          }

          prevNotestack = thisPlayer.notestack;
          console.log(client.notestack);
        }

        if (thisPlayer.rhythmstack !== prevRhythmstack) {
          client.rhythmstack = thisPlayer.rhythmstack.split(' ');
          prevRhythmstack = thisPlayer.rhythmstack;
          console.log(client.rhythmstack);
        }
      }
    }
  }, {
    key: "drawPerformers",
    value: function drawPerformers(p, t, dt) {
      /*
      this.drawCircle(x, y, game.headRadius, true);
      for (let i = 0; i < p.bodyParts.length; i++) {
          let nextPos = p.bodyParts[i];
          if (isThisPerformer) ctx.fillStyle = this.rainbowColors();
          this.drawCircle(nextPos.x, nextPos.y, game.bodyRadius, true);
      }
       // draw eyes
      let angle = +w.direction;
      if (w.direction === game.directionStop) {
          angle = - Math.PI / 2;
      }
      let eye1 = new TwoVector(Math.cos(angle + game.eyeAngle), Math.sin(angle + game.eyeAngle));
      let eye2 = new TwoVector(Math.cos(angle - game.eyeAngle), Math.sin(angle - game.eyeAngle));
      eye1.multiplyScalar(game.eyeDist).add(w.position);
      eye2.multiplyScalar(game.eyeDist).add(w.position);
      ctx.fillStyle = 'black';
      this.drawCircle(eye1.x, eye1.y, game.eyeRadius, true);
      this.drawCircle(eye2.x, eye2.y, game.eyeRadius, true);
      ctx.fillStyle = 'white';
       // update status
      if (isPerformer) {
          document.getElementById('wiggle-length').innerHTML = 'Wiggle Length: ' + Math.floor(t) + ' ' + Math.floor(dt);
      } */
    }
  }, {
    key: "setRendererSize",
    value: function setRendererSize() {
      w = this.canvas.width = window.innerWidth;
      h = this.canvas.height = window.innerHeight;
    }
  }, {
    key: "drawFood",
    value: function drawFood(f) {
      ctx.strokeStyle = ctx.fillStyle = 'Orange';
      this.drawCircle(f.position.x, f.position.y, game.foodRadius, true);
      ctx.strokeStyle = ctx.fillStyle = 'White';
    }
  }, {
    key: "drawCircle",
    value: function drawCircle(x, y, radius, fill) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      fill ? ctx.fill() : ctx.stroke();
      ctx.closePath();
    }
  }, {
    key: "drawBounds",
    value: function drawBounds() {
      ctx.beginPath();
      ctx.moveTo(-game.spaceWidth / 2, -game.spaceHeight / 2);
      ctx.lineTo(-game.spaceWidth / 2, game.spaceHeight / 2);
      ctx.lineTo(game.spaceWidth / 2, game.spaceHeight / 2);
      ctx.lineTo(game.spaceWidth / 2, -game.spaceHeight / 2);
      ctx.lineTo(-game.spaceWidth / 2, -game.spaceHeight / 2);
      ctx.closePath();
      ctx.stroke();
    }
  }]);

  return InterferenceRenderer;
}(_lanceGg.Renderer);

exports.default = InterferenceRenderer;
//# sourceMappingURL=InterferenceRenderer.js.map