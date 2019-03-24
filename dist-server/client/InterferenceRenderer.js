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
  'celeste': {
    bg: '#a5d8ff',
    c1: '#ff8266',
    c2: '#4381af',
    c3: '#ac86b0',
    c4: '#4b719c'
  },
  'pyre': {
    bg: '#a32323',
    c1: '#2375a8',
    c2: '#fbf6f7',
    c3: '#f0ae62',
    c4: '#011936'
  },
  'journey': {
    bg: '#fad68a',
    c1: '#7f2819',
    c2: '#a25a11',
    c3: '#d5a962',
    c4: '#fef8e8'
  },
  'kirby': {
    bg: '#a8c256',
    c1: '#f4a4a7',
    c2: '#e84c41',
    c3: '#f9df6a',
    c4: '#fa8334'
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
var leftViewBound = 0; // bounds of area to be rendered in game coordinates

var rightViewBound = 0;
var time = 0;
var players = [];
var playerId = 0;
var thisPlayer = null;
var graphicNotes = [];
var eggs = [];
var animFrames = {
  eggBreak: 0
};
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
    ctx.lineWidth = 1;
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
      playerId = game.playerId;
      thisPlayer = game.world.queryObject({
        playerId: playerId
      });

      if (client.performanceView) {
        players = [thisPlayer];
        leftViewBound = thisPlayer.number * game.playerWidth;
        rightViewBound = (thisPlayer.number + 1) * game.playerWidth;
      } else {
        players = game.world.queryObjects({
          instanceType: _Performer.default
        });
        leftViewBound = 0;
        rightViewBound = players.length * game.playerWidth;
      }

      graphicNotes = client.graphicNotes;
      eggs = game.world.queryObjects({
        instanceType: _Egg.default
      });
      bg = paletteTable[thisPlayer.palette].bg;
      c1 = paletteTable[thisPlayer.palette].c1;
      c2 = paletteTable[thisPlayer.palette].c2;
      c3 = paletteTable[thisPlayer.palette].c3;
      c4 = paletteTable[thisPlayer.palette].c4;

      if (client.transport.state === 'started') {
        if (transportSyncCount >= game.transportSyncInterval) {
          client.transport.seconds = time;
          transportSyncCount = 0; //console.log(client.transport.state);
        }

        transportSyncCount++;
      } // Clear the canvas


      ctx.clearRect(0, 0, w, h); // Transform the canvas
      // Note that we need to flip the y axis since Canvas pixel coordinates
      // goes from top to bottom, while physics does the opposite.

      ctx.save(); //ctx.scale(this.clientEngine.zoom, this.clientEngine.zoom);  // Zoom in and flip y axis
      // Draw all things

      this.updateClientSequencer();
      this.drawPlayers();
      this.drawNoteGraphics();
      this.drawEggs();
      /*
      if (this.gameEngine.playerId < 5) {
          Tone.Transport.seconds = t/1000;
          ctx.fillStyle = 'red';
      } */

      ctx.fillStyle = c1;
      ctx.font = "20px Lucida Console";
      ctx.fillText(playerId, 50, 25);
      ctx.fillText(time, 50, 50);
      ctx.fillText(client.transport.position, 50, 75);
      ctx.restore();
    }
  }, {
    key: "drawPlayers",
    value: function drawPlayers() {
      var n = players.length;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = players[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var p = _step.value;

          var _i = p.number - leftViewBound / game.playerWidth;

          var _x = w / n * _i;

          this.fillColor(p, 'bg');
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

      var i = thisPlayer.number;
      var x = w / n * (i + 0.5);
      ctx.fillStyle = 'white';
      this.triangle(x, 1.05 * h / n, x - 0.25 * w / n, 1.15 * h / n, x + 0.25 * w / n, 1.15 * h / n);
    }
  }, {
    key: "drawNoteGraphics",
    value: function drawNoteGraphics() {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = graphicNotes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var g = _step2.value;

          if (g.type === 'egg') {
            var pos = this.playerCellToCanvasPosition(thisPlayer, g.cell.x, g.cell.y);
            var c = 'c1';
            if (g.step === client.currentStep) c = 'c2';
            this.fillColor(thisPlayer, c);
            ctx.fillRect(pos[0], pos[1], this.gameDistanceToCanvasDistance(game.cellWidth), this.gameDistanceToCanvasDistance(game.cellHeight));
          }
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
  }, {
    key: "drawEggs",
    value: function drawEggs() {
      var leftBound = leftViewBound - game.eggRadius;
      var rightBound = rightViewBound + game.eggRadius;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = eggs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var e = _step3.value;

          if (leftBound < e.position.x && e.position.x < rightBound) {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            var pos = this.gamePositionToCanvasPosition(e.position.x, e.position.y);
            if (e.hp > 0) this.circle(pos[0], pos[1], this.gameDistanceToCanvasDistance(game.eggRadius));else this.drawBrokenEgg(pos[0], pos[1], this.gameDistanceToCanvasDistance(game.eggRadius));
          }
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
    key: "updateClientSequencer",
    value: function updateClientSequencer() {
      if (thisPlayer) {
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
    key: "gamePositionToCanvasPosition",
    value: function gamePositionToCanvasPosition(gameX, gameY) {
      var canvasX = this.mapToRange(gameX, leftViewBound, rightViewBound, 0, w);
      var canvasY = this.mapToRange(gameY, 0, game.playerHeight, 0, h / players.length);
      return [canvasX, canvasY];
    }
  }, {
    key: "gameDistanceToCanvasDistance",
    value: function gameDistanceToCanvasDistance(gameDist) {
      var canvasDist = this.mapToRange(gameDist, 0, game.playerWidth, 0, w / players.length);
      return canvasDist;
    }
  }, {
    key: "playerCellToCanvasPosition",
    value: function playerCellToCanvasPosition(p, cellX, cellY) {
      var gameX = game.cellWidth * (cellX + p.number * game.playerCellWidth);
      var gameY = game.cellHeight * cellY;
      return this.gamePositionToCanvasPosition(gameX, gameY);
    }
  }, {
    key: "mapToRange",
    value: function mapToRange(val, l1, h1, l2, h2) {
      return Math.floor(l2 + (h2 - l2) * (val - l1) / (h1 - l1));
    }
  }, {
    key: "drawBrokenEgg",
    value: function drawBrokenEgg(x, y, radius) {
      var gap = radius * (animFrames.eggBreak * 0.02);
      ctx.beginPath();
      ctx.arc(x - gap, y, radius, 0.25 * Math.PI, 1.25 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + gap, y, radius, 1.25 * Math.PI, 2.25 * Math.PI);
      ctx.fill();
      ctx.stroke();
      if (animFrames.eggBreak < 60) animFrames.eggBreak++;
    }
  }, {
    key: "fillColor",
    value: function fillColor(p, which) {
      if (paletteTable[p.palette]) {
        ctx.fillStyle = paletteTable[p.palette][which];
      } else ctx.fillStyle = paletteTable['default'][which];
    }
  }, {
    key: "circle",
    value: function circle(x, y, radius) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    }
  }, {
    key: "triangle",
    value: function triangle(x1, y1, x2, y2, x3, y3) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.fill();
      ctx.closePath();
    }
  }]);

  return InterferenceRenderer;
}(_lanceGg.Renderer);

exports.default = InterferenceRenderer;
//# sourceMappingURL=InterferenceRenderer.js.map