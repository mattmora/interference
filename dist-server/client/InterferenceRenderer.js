"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lanceGg = require("lance-gg");

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

var paletteTable = [//'default': 
{
  bg: 'black',
  c1: 'white',
  c2: 'white',
  c3: 'white',
  c4: 'white'
}, //'rain': 
{
  bg: '#3e2f5b',
  c1: '#d7dedc',
  c2: '#706563',
  c3: '#457eac',
  c4: '#748386'
}, //'celeste': 
{
  bg: '#a5d8ff',
  c1: '#ff8266',
  c2: '#4381af',
  c3: '#ac86b0',
  c4: '#4b719c'
}, //'pyre': 
{
  bg: '#a32323',
  c1: '#2375a8',
  c2: '#fbf6f7',
  c3: '#f0ae62',
  c4: '#011936'
}, //'journey': 
{
  bg: '#fad68a',
  c1: '#7f2819',
  c2: '#a25a11',
  c3: '#d5a962',
  c4: '#fef8e8'
}, //'kirby': 
{
  bg: '#a8c256',
  c1: '#f4a4a7',
  c2: '#e84c41',
  c3: '#f9df6a',
  c4: '#fa8334'
}];
var animLengths = {
  eggSpawn: 20,
  eggBreak: 30,
  eggNote: 10
};
var transportSyncCount = 0;
var game = null;
var client = null;
var canvas = [];
var ctx = [];
var w = 0;
var h = 0;
var leftViewBound = 0; // bounds of area to be rendered in game coordinates

var rightViewBound = 0;
var time = 0;
var players = [];
var playerId = 0;
var thisPlayer = null;
var eggs = [];
var prevNotestack = '';
var prevRhythmstack = '';
var bg = paletteTable[0].bg;
var c1 = paletteTable[0].c1;
var c2 = paletteTable[0].c2;
var c3 = paletteTable[0].c3;
var c4 = paletteTable[0].c4;

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
    _this.ctx = _this.canvas.getContext('2d');
    canvas[0] = document.createElement('canvas');
    ctx[0] = canvas[0].getContext('2d');
    ctx[0].lineWidth = 1;
    canvas[1] = document.createElement('canvas');
    ctx[1] = canvas[1].getContext('2d');
    ctx[1].lineWidth = 1;
    w = canvas[0].width = canvas[1].width = _this.canvas.width = window.innerWidth;
    h = canvas[0].height = canvas[1].height = _this.canvas.height = window.innerHeight;
    document.body.insertBefore(_this.canvas, document.getElementById('logo'));
    window.addEventListener('resize', function () {
      _this.setRendererSize();
    });
    return _this;
  }

  _createClass(InterferenceRenderer, [{
    key: "draw",
    value: function draw(t, dt) {
      _get(_getPrototypeOf(InterferenceRenderer.prototype), "draw", this).call(this, t, dt);

      if (client.room == null) return;
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


      this.ctx.clearRect(0, 0, w, h);
      ctx[0].clearRect(0, 0, w, h);
      ctx[1].clearRect(0, 0, w, h); // Transform the canvas
      // Note that we need to flip the y axis since Canvas pixel coordinates
      // goes from top to bottom, while physics does the opposite.

      ctx[0].save();
      ctx[1].save(); //ctx.scale(this.clientEngine.zoom, this.clientEngine.zoom);  // Zoom in and flip y axis
      // Draw all things

      this.drawPlayers();
      this.drawSequences();
      this.drawEggs();
      /*()
      ctx[1].fillStyle = c1;
      ctx[1].font = "20px Lucida Console";
      ctx[1].fillText(playerId, 50, 25);
      ctx[1].fillText(time, 50, 50);
      ctx[1].fillText(client.transport.position, 50, 75);
      */

      this.ctx.drawImage(canvas[0], 0, 0);
      this.ctx.drawImage(canvas[1], 0, 0);
      ctx[0].restore();
      ctx[1].restore();
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

          this.fillColor(p, 'bg', 0);
          this.fillRect(_x, 0, w / n, h / n, false, 0);
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
      ctx[0].fillStyle = 'white';
      this.fillTriangle(x, 1.05 * h / n, x - 0.25 * w / n, 1.15 * h / n, x + 0.25 * w / n, 1.15 * h / n, false, 0);
    }
  }, {
    key: "drawSequences",
    value: function drawSequences() {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = players[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var p = _step2.value;

          if (p.sequences != null) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
              for (var _iterator3 = p.sequences.perc[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var step = _step3.value;
                if (step != null) this.drawStep(p, step, 'perc');
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

            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
              for (var _iterator4 = p.sequences.bass[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var _step6 = _step4.value;
                if (_step6 != null) this.drawStep(p, _step6, 'bass');
              }
            } catch (err) {
              _didIteratorError4 = true;
              _iteratorError4 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
                  _iterator4.return();
                }
              } finally {
                if (_didIteratorError4) {
                  throw _iteratorError4;
                }
              }
            }

            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
              for (var _iterator5 = p.sequences.melody[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                var _step7 = _step5.value;
                if (_step7 != null) this.drawStep(p, _step7, 'melody');
              }
            } catch (err) {
              _didIteratorError5 = true;
              _iteratorError5 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
                  _iterator5.return();
                }
              } finally {
                if (_didIteratorError5) {
                  throw _iteratorError5;
                }
              }
            }
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
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = eggs[Symbol.iterator](), _step8; !(_iteratorNormalCompletion6 = (_step8 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var e = _step8.value;

          if (leftBound < e.position.x && e.position.x < rightBound) {
            var scale = this.mapToRange(e.animFrames.spawn, 0, animLengths.eggSpawn, 0.0, 1.0);
            ctx[1].fillStyle = 'white';
            ctx[1].strokeStyle = 'black'; //let gamePos = game.quantizedPosition(e.position.x, e.position.y, 32, 18);
            //let pos = this.gamePositionToCanvasPosition(gamePos[0], gamePos[1]);

            var pos = this.gamePositionToCanvasPosition(e.position.x, e.position.y);
            var x = pos[0];
            var y = pos[1];
            var dimX = this.gameXDimToCanvasXDim(game.eggRadius) * scale;
            var dimY = this.gameYDimToCanvasYDim(game.eggRadius) * scale;

            if (e.hp > 0) {
              if (e.sound === 'melody') {
                this.fillEllipse(x, y, dimX, dimY, 0, 0, 2 * Math.PI, true, 1);
              } else if (e.sound === 'bass') {
                this.fillRect(x - dimX, y - dimY, dimX * 2, dimY * 2, true, 1);
              } else if (e.sound === 'perc') {
                this.fillQuad(x - dimX, y, x, y - dimY, x + dimX, y, x, y + dimY, true, 1);
              }
            } else this.drawBrokenEgg(e, x, y, dimX, dimY, true, 1);
          }

          if (e.animFrames.spawn < animLengths.eggSpawn) e.animFrames.spawn++;
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return != null) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }
    }
  }, {
    key: "drawStep",
    value: function drawStep(p, step, sound) {
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = step[Symbol.iterator](), _step9; !(_iteratorNormalCompletion7 = (_step9 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var n = _step9.value;
          if (p.animFrames[sound][step] == null) p.animFrames[sound][step] = [];
          if (p.animFrames[sound][step][n.pitch] == null) p.animFrames[sound][step][n.pitch] = 0;
          var animFrame = p.animFrames[sound][step][n.pitch]; //console.log(p.animFrames[sound][step][n.pitch]);

          var pal = p.palette;
          var gridWidth = game.paletteAttributes[pal].gridWidth;
          var gridHeight = game.paletteAttributes[pal].gridHeight;
          var pos = this.playerCellToCanvasPosition(p, n.cell.x, n.cell.y, game.paletteAttributes[pal].gridWidth, gridHeight);
          var dimX = this.gameXDimToCanvasXDim(game.playerWidth / gridWidth);
          var dimY = this.gameYDimToCanvasYDim(game.playerHeight / gridHeight);
          var x = pos[0];
          var y = pos[1];
          var c = 'c4';
          var layer = 1;

          if (sound === 'melody') {
            x += dimX * 0.5;
            y += dimY * 0.5;
            dimX *= this.mapToRange(animFrame, 0, animLengths.eggNote, gridWidth, 1);
            dimY *= this.mapToRange(animFrame, 0, animLengths.eggNote, gridHeight, 1);

            if (n.step !== client.currentStep) {
              if (n.dur === '2n') {
                c = 'c2';
                layer = 0;
              } else c = 'c1';
            }

            this.fillColor(p, c, layer);
            this.fillEllipse(x, y, dimX / 2, dimY / 2, 0, 0, 2 * Math.PI, false, layer);
          } else if (sound === 'bass') {
            y = this.mapToRange(animFrame, 0, animLengths.eggNote, 0, y);
            dimY *= this.mapToRange(animFrame, 0, animLengths.eggNote, gridHeight, 1);

            if (n.step !== client.currentStep) {
              if (n.dur === '2n') {
                c = 'c3';
                dimX *= gridWidth / 2;
                layer = 0;
              } else c = 'c2';
            }

            this.fillColor(p, c, layer);
            this.fillRect(x, y, dimX, dimY, false, layer);
          } else if (sound === 'perc') {
            if (n.step !== client.currentStep) {
              if (n.dur === '2n') {
                c = 'c1';
                layer = 0;
              } else c = 'c3';
            }

            this.fillColor(p, c, layer);
            this.fillRect(x, y, dimX, dimY, false, layer);
          }

          if (p.animFrames[sound][step][n.pitch] < animLengths.eggNote) p.animFrames[sound][step][n.pitch]++;
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return != null) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }
    }
  }, {
    key: "setRendererSize",
    value: function setRendererSize() {
      w = canvas[0].width = canvas[1].width = this.canvas.width = window.innerWidth;
      h = canvas[0].height = canvas[1].height = this.canvas.height = window.innerHeight;
    }
  }, {
    key: "gamePositionToCanvasPosition",
    value: function gamePositionToCanvasPosition(gameX, gameY) {
      var canvasX = Math.floor(this.mapToRange(gameX, leftViewBound, rightViewBound, 0, w));
      var canvasY = Math.floor(this.mapToRange(gameY, 0, game.playerHeight, 0, h / players.length));
      return [canvasX, canvasY];
    }
  }, {
    key: "gameXDimToCanvasXDim",
    value: function gameXDimToCanvasXDim(gameX) {
      return Math.floor(this.mapToRange(gameX, 0, game.playerWidth, 0, w / players.length));
    }
  }, {
    key: "gameYDimToCanvasYDim",
    value: function gameYDimToCanvasYDim(gameY) {
      return Math.floor(this.mapToRange(gameY, 0, game.playerHeight, 0, h / players.length));
    }
  }, {
    key: "playerCellToCanvasPosition",
    value: function playerCellToCanvasPosition(p, cellX, cellY, cellsXPerPlayer, cellsYPerPlayer) {
      //let gameX = game.cellWidth * (cellX + (p.number * game.playerCellWidth));
      //let gameY = game.cellHeight * cellY;
      var gameX = game.playerWidth / cellsXPerPlayer * (cellX + p.number * cellsXPerPlayer);
      var gameY = game.playerHeight / cellsYPerPlayer * cellY;
      return this.gamePositionToCanvasPosition(gameX, gameY);
    }
  }, {
    key: "mapToRange",
    value: function mapToRange(val, l1, h1, l2, h2) {
      return l2 + (h2 - l2) * (val - l1) / (h1 - l1);
    }
  }, {
    key: "drawBrokenEgg",
    value: function drawBrokenEgg(e, x, y, radiusX, radiusY, stroke, layer) {
      var gapX = radiusX * (e.animFrames.break / animLengths.eggBreak);
      var gapY = radiusY * (e.animFrames.break / animLengths.eggBreak);
      this.fillEllipse(x + gapX, y - gapY, radiusX, radiusY, 0, 0, 0.5 * Math.PI, stroke, layer);
      this.fillEllipse(x - gapX, y - gapY, radiusX, radiusY, 0, 0.5 * Math.PI, Math.PI, stroke, layer);
      this.fillEllipse(x - gapX, y + gapY, radiusX, radiusY, 0, Math.PI, 1.5 * Math.PI, stroke, layer);
      this.fillEllipse(x + gapX, y + gapY, radiusX, radiusY, 0, 1.5 * Math.PI, 2 * Math.PI, stroke, layer);
      if (e.animFrames.break < animLengths.eggBreak) e.animFrames.break++;
    }
  }, {
    key: "fillColor",
    value: function fillColor(p, which, layer) {
      if (paletteTable[p.palette]) {
        ctx[layer].fillStyle = paletteTable[p.palette][which];
      } else ctx[layer].fillStyle = paletteTable[0][which];
    }
  }, {
    key: "fillEllipse",
    value: function fillEllipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, stroke, layer) {
      ctx[layer].beginPath();
      ctx[layer].ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
      ctx[layer].fill();
      if (stroke) ctx[layer].stroke();
    }
  }, {
    key: "fillTriangle",
    value: function fillTriangle(x1, y1, x2, y2, x3, y3, stroke, layer) {
      ctx[layer].beginPath();
      ctx[layer].moveTo(x1, y1);
      ctx[layer].lineTo(x2, y2);
      ctx[layer].lineTo(x3, y3);
      ctx[layer].fill();
      ctx[layer].closePath();
      if (stroke) ctx[layer].stroke();
    }
  }, {
    key: "fillRect",
    value: function fillRect(x, y, dimX, dimY, stroke, layer) {
      ctx[layer].fillRect(x, y, dimX, dimY);
      if (stroke) ctx[layer].strokeRect(x, y, dimX, dimY);
    }
  }, {
    key: "fillQuad",
    value: function fillQuad(x1, y1, x2, y2, x3, y3, x4, y4, stroke, layer) {
      ctx[layer].beginPath();
      ctx[layer].moveTo(x1, y1);
      ctx[layer].lineTo(x2, y2);
      ctx[layer].lineTo(x3, y3);
      ctx[layer].lineTo(x4, y4);
      ctx[layer].fill();
      ctx[layer].closePath();
      if (stroke) ctx[layer].stroke();
    }
  }]);

  return InterferenceRenderer;
}(_lanceGg.Renderer);

exports.default = InterferenceRenderer;
//# sourceMappingURL=InterferenceRenderer.js.map