"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lanceGg = require("lance-gg");

var _Note = _interopRequireDefault(require("../common/Note"));

var _Performer = _interopRequireDefault(require("../common/Performer"));

var _Egg = _interopRequireDefault(require("../common/Egg"));

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
var sequences = null;
var eggs = [];
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
    canvas[1] = document.createElement('canvas');
    ctx[1] = canvas[1].getContext('2d');
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
      players = game.world.queryObjects({
        instanceType: _Performer.default
      });

      if (client.performanceView) {
        leftViewBound = thisPlayer.xPos;
        rightViewBound = leftViewBound + game.playerWidth;
      } else {
        leftViewBound = 0;
        rightViewBound = players.length * game.playerWidth;
      }

      sequences = client.sequences;
      eggs = game.world.queryObjects({
        instanceType: _Egg.default
      });
      bg = paletteTable[thisPlayer.palette].bg;
      c1 = paletteTable[thisPlayer.palette].c1;
      c2 = paletteTable[thisPlayer.palette].c2;
      c3 = paletteTable[thisPlayer.palette].c3;
      c4 = paletteTable[thisPlayer.palette].c4; // Clear the canvas

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

      if (!client.performanceView) {
        ctx[1].fillStyle = 'white';
        ctx[1].strokeStyle = 'black';
        this.strokeWeight(1, 1);
        ctx[1].font = "20px Lucida Console"; //ctx[1].fillText(playerId, 50, 25);

        time = Number(time).toFixed(3);
        ctx[1].fillText(time, w * 0.05, h * 0.95);
        ctx[1].strokeText(time, w * 0.05, h * 0.95);
        ctx[1].fillText(thisPlayer.number, w * 0.05, h * 0.85);
        ctx[1].strokeText(thisPlayer.number, w * 0.05, h * 0.85); //ctx[1].fillText(client.transport.position, 50, 75);
      }

      this.ctx.drawImage(canvas[0], 0, 0);
      this.ctx.drawImage(canvas[1], 0, 0);
      ctx[0].restore();
      ctx[1].restore();
    }
  }, {
    key: "drawPlayers",
    value: function drawPlayers() {
      var n = players.length;
      if (client.performanceView) n = 1;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = players[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var p = _step.value;
          var i = p.number - leftViewBound / game.playerWidth;
          var xDim = this.gameXDimToCanvasXDim(game.playerWidth / game.paletteAttributes[p.palette].gridWidth);
          var yDim = this.gameYDimToCanvasYDim(game.playerHeight / game.paletteAttributes[p.palette].gridHeight);

          for (var xIdx = 0; xIdx < p.grid.length; xIdx++) {
            var _x = w / n * i + xIdx * xDim;

            for (var yIdx = 0; yIdx < p.grid[xIdx].length; yIdx++) {
              var y = yIdx * yDim;
              this.fillColor(p.grid[xIdx][yIdx], 'bg', 0);
              this.fillRect(_x, y, xDim, yDim, false, 0);
            }
          }

          this.fillColor('default', 'bg', 1);

          for (var a = 0; a < p.ammo; a++) {
            var _x2 = w / n * i;

            var x1 = _x2 + (a + 1) * (w / n / (p.ammo + 1));
            var y1 = h / n * 0.92;
            this.fillTriangle(x1, y1, x1 - 0.02 * w / n, y1 + 0.04 * h / n, x1 + 0.02 * w / n, y1 + 0.04 * h / n, false, 1);
          }

          if (p.number === 0) {
            i = players.length - leftViewBound / game.playerWidth;

            for (var _xIdx = 0; _xIdx < p.grid.length; _xIdx++) {
              var _x3 = w / n * i + _xIdx * xDim;

              for (var _yIdx = 0; _yIdx < p.grid[_xIdx].length; _yIdx++) {
                var _y = _yIdx * yDim;

                this.fillColor(p.grid[_xIdx][_yIdx], 'bg', 0);
                this.fillRect(_x3, _y, xDim, yDim, false, 0);
              }
            }

            this.fillColor('default', 'bg', 1);

            for (var _a = 0; _a < p.ammo; _a++) {
              var _x4 = w / n * i;

              var _x5 = _x4 + (_a + 1) * (w / n / (p.ammo + 1));

              var _y2 = h / n * 0.92;

              this.fillTriangle(_x5, _y2, _x5 - 0.02 * w / n, _y2 + 0.04 * h / n, _x5 + 0.02 * w / n, _y2 + 0.04 * h / n, false, 1);
            }
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

      var x = w / n * (thisPlayer.number + 0.5);
      ctx[0].fillStyle = 'white';
      this.fillTriangle(x, 1.05 * h / n, x - 0.25 * w / n, 1.15 * h / n, x + 0.25 * w / n, 1.15 * h / n, false, 0);
    }
  }, {
    key: "drawSequences",
    value: function drawSequences() {
      this.strokeWeight(2, 0);
      this.strokeWeight(2, 1);

      var _arr = Object.keys(sequences);

      for (var _i = 0; _i < _arr.length; _i++) {
        var ownerId = _arr[_i];

        if (sequences[ownerId].bass != null) {
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = sequences[ownerId].bass[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var step = _step2.value;
              if (step != null) this.drawStep(step, 'bass');
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

        if (sequences[ownerId].melody != null) {
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = sequences[ownerId].melody[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var _step4 = _step3.value;
              if (_step4 != null) this.drawStep(_step4, 'melody');
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

        if (sequences[ownerId].perc != null) {
          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (var _iterator4 = sequences[ownerId].perc[Symbol.iterator](), _step5; !(_iteratorNormalCompletion4 = (_step5 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              var _step6 = _step5.value;
              if (_step6 != null) this.drawStep(_step6, 'perc');
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
        }
      }
    }
  }, {
    key: "drawEggs",
    value: function drawEggs() {
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = eggs[Symbol.iterator](), _step7; !(_iteratorNormalCompletion5 = (_step7 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var e = _step7.value;
          var scale = this.mapToRange(e.animFrames.spawn, 0, animLengths.eggSpawn, 0.0, 1.0);
          this.fillColor(0, 'c1', 1);
          this.strokeColor(0, 'bg', 1);
          var dimX = this.gameXDimToCanvasXDim(game.eggRadius) * scale;
          var dimY = this.gameYDimToCanvasYDim(game.eggRadius) * scale;
          var pos = this.gamePositionToCanvasPosition(e.position.x, e.position.y);
          var x = pos[0];
          var y = pos[1];
          this.strokeWeight((dimX + dimY) * 0.0625, 1);

          if (e.hp > 0) {
            if (e.sound === 'melody') {
              this.fillEllipse(x, y, dimX, dimY, 0, 0, 2 * Math.PI, true, 1);
            } else if (e.sound === 'bass') {
              this.fillRect(x - dimX, y - dimY, dimX * 2, dimY * 2, true, 1);
            } else if (e.sound === 'perc') {
              this.fillQuad(x - dimX, y, x, y - dimY, x + dimX, y, x, y + dimY, true, 1);
            }
          } else this.drawBrokenEgg(e, x, y, dimX, dimY, true, 1);

          if (e.position.x < game.playerWidth) {
            pos = this.gamePositionToCanvasPosition(e.position.x + players.length * game.playerWidth, e.position.y);
            x = pos[0];
            y = pos[1];
            this.strokeWeight((dimX + dimY) * 0.0625, 1);

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
  }, {
    key: "drawStep",
    value: function drawStep(step, sound) {
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = step[Symbol.iterator](), _step8; !(_iteratorNormalCompletion6 = (_step8 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var n = _step8.value;
          //console.log(p.animFrames[sound][step][n.pitch]);
          var gridWidth = game.paletteAttributes[n.palette].gridWidth;
          var gridHeight = game.paletteAttributes[n.palette].gridHeight;
          var pos = this.cellToCanvasPosition(n.xPos, n.yPos, gridWidth, gridHeight);
          var dimX = this.gameXDimToCanvasXDim(game.playerWidth / gridWidth);
          var dimY = this.gameYDimToCanvasYDim(game.playerHeight / gridHeight);
          var x = pos[0];
          var y = pos[1];
          var c = 'bg';
          var layer = 1;

          if (sound === 'melody') {
            x += dimX * 0.5;
            y += dimY * 0.5; //dimX *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, gridWidth, 1);

            dimY *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, gridHeight, 1);
            c = 'c1';

            if (n.dur === '2n') {
              c = 'c2';
              dimX *= 2;
              dimY *= 2;
              layer = 0;
            }

            if (n.step === client.melodyStep) c = 'c4';
            this.fillColor(n.palette, c, layer);
            this.strokeColor(n.palette, 'bg', layer);
            this.fillEllipse(x, y, dimX / 2, dimY / 2, 0, 0, 2 * Math.PI, true, layer);
          } else if (sound === 'bass') {
            y = this.mapToRange(n.animFrame, 0, animLengths.eggNote, 0, y);
            dimY *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, gridHeight, 1);
            c = 'c2';

            if (n.dur === '2n') {
              c = 'c3';
              dimX *= gridWidth / 2;
              layer = 0;
            }

            if (n.step === client.bassStep) c = 'c4';
            this.fillColor(n.palette, c, layer);
            this.strokeColor(n.palette, 'bg', layer);
            this.fillRect(x, y, dimX, dimY, true, layer);
          } else if (sound === 'perc') {
            x += dimX * 0.5;
            y += dimY * 0.5;
            dimY *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, gridHeight / 2, 1);
            var x1 = x - dimX * 0.5;
            var y1 = y;
            var x2 = x;
            var y2 = y - dimY * 0.5;
            var x3 = x + dimX * 0.5;
            var y3 = y;
            var x4 = x;
            var y4 = y + dimY * 0.5;
            c = 'c3';

            if (n.dur === '2n') {
              c = 'c1';
              x2 += dimX;
              x4 -= dimX;
              layer = 0;
            }

            if (n.step === client.percStep) c = 'c4';
            this.fillColor(n.palette, c, layer);
            this.strokeColor(n.palette, 'bg', layer);
            this.fillQuad(x1, y1, x2, y2, x3, y3, x4, y4, true, layer);
          }

          if (n.xPos < gridWidth) {
            var _pos = this.cellToCanvasPosition(n.xPos + gridWidth * players.length, n.yPos, gridWidth, gridHeight);

            var _x6 = _pos[0];
            var _y3 = _pos[1];
            var _c = 'bg';
            var _layer = 1;

            if (sound === 'melody') {
              _x6 += dimX * 0.5;
              _y3 += dimY * 0.5; //dimX *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, gridWidth, 1);

              dimY *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, gridHeight, 1);
              _c = 'c1';

              if (n.dur === '2n') {
                _c = 'c2';
                dimX *= 2;
                dimY *= 2;
                _layer = 0;
              }

              if (n.step === client.melodyStep) _c = 'c4';
              this.fillColor(n.palette, _c, _layer);
              this.strokeColor(n.palette, 'bg', _layer);
              this.fillEllipse(_x6, _y3, dimX / 2, dimY / 2, 0, 0, 2 * Math.PI, true, _layer);
            } else if (sound === 'bass') {
              _y3 = this.mapToRange(n.animFrame, 0, animLengths.eggNote, 0, _y3);
              dimY *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, gridHeight, 1);
              _c = 'c2';

              if (n.dur === '2n') {
                _c = 'c3';
                dimX *= gridWidth / 2;
                _layer = 0;
              }

              if (n.step === client.bassStep) _c = 'c4';
              this.fillColor(n.palette, _c, _layer);
              this.strokeColor(n.palette, 'bg', _layer);
              this.fillRect(_x6, _y3, dimX, dimY, true, _layer);
            } else if (sound === 'perc') {
              _x6 += dimX * 0.5;
              _y3 += dimY * 0.5;
              dimY *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, gridHeight / 2, 1);

              var _x7 = _x6 - dimX * 0.5;

              var _y4 = _y3;
              var _x8 = _x6;

              var _y5 = _y3 - dimY * 0.5;

              var _x9 = _x6 + dimX * 0.5;

              var _y6 = _y3;
              var _x10 = _x6;

              var _y7 = _y3 + dimY * 0.5;

              _c = 'c3';

              if (n.dur === '2n') {
                _c = 'c1';
                _x8 += dimX;
                _x10 -= dimX;
                _layer = 0;
              }

              if (n.step === client.percStep) _c = 'c4';
              this.fillColor(n.palette, _c, _layer);
              this.strokeColor(n.palette, 'bg', _layer);
              this.fillQuad(_x7, _y4, _x8, _y5, _x9, _y6, _x10, _y7, true, _layer);
            }
          }

          if (n.animFrame < animLengths.eggNote) n.animFrame++;
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
    key: "setRendererSize",
    value: function setRendererSize() {
      w = canvas[0].width = canvas[1].width = this.canvas.width = window.innerWidth;
      h = canvas[0].height = canvas[1].height = this.canvas.height = window.innerHeight;
    }
  }, {
    key: "gamePositionToCanvasPosition",
    value: function gamePositionToCanvasPosition(gameX, gameY) {
      var div = players.length;
      if (client.performanceView) div = 1;
      var canvasX = Math.floor(this.mapToRange(gameX, leftViewBound, rightViewBound, 0, w));
      var canvasY = Math.floor(this.mapToRange(gameY, 0, game.playerHeight, 0, h / div));
      return [canvasX, canvasY];
    }
  }, {
    key: "gameXDimToCanvasXDim",
    value: function gameXDimToCanvasXDim(gameX) {
      var div = players.length;
      if (client.performanceView) div = 1;
      return this.mapToRange(gameX, 0, game.playerWidth, 0, w / div);
    }
  }, {
    key: "gameYDimToCanvasYDim",
    value: function gameYDimToCanvasYDim(gameY) {
      var div = players.length;
      if (client.performanceView) div = 1;
      return this.mapToRange(gameY, 0, game.playerHeight, 0, h / div);
    }
  }, {
    key: "cellToCanvasPosition",
    value: function cellToCanvasPosition(cellX, cellY, cellsXPerPlayer, cellsYPerPlayer) {
      var gameX = game.playerWidth / cellsXPerPlayer * cellX;
      var gameY = game.playerHeight / cellsYPerPlayer * cellY;
      return this.gamePositionToCanvasPosition(gameX, gameY);
    }
  }, {
    key: "playerCellToCanvasPosition",
    value: function playerCellToCanvasPosition(p, cellX, cellY, cellsXPerPlayer, cellsYPerPlayer) {
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
    key: "strokeWeight",
    value: function strokeWeight(weight, layer) {
      ctx[layer].lineWidth = weight;
    }
  }, {
    key: "strokeColor",
    value: function strokeColor(pal, which, layer) {
      if (paletteTable[pal]) {
        ctx[layer].strokeStyle = paletteTable[pal][which];
      } else ctx[layer].strokeStyle = paletteTable[0][which];
    }
  }, {
    key: "fillColor",
    value: function fillColor(pal, which, layer) {
      if (paletteTable[pal]) {
        ctx[layer].fillStyle = paletteTable[pal][which];
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