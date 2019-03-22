"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lanceGg = require("lance-gg");

var _Performer = _interopRequireDefault(require("./Performer"));

var _Egg = _interopRequireDefault(require("./Egg"));

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

var scaleTable = {
  'rain': [60, 64, 66, 69, 71],
  'celeste': [60, 62, 63, 65, 67],
  'pyre': [60, 62, 63, 67, 70],
  'journey': [60, 62, 64, 67, 69],
  'kirby': [60, 62, 64, 65, 67],
  'default': [60, 62, 64, 65, 67]
};
var palettes = ['rain', 'celeste', 'pyre', 'journey', 'kirby'];

var InterferenceGameEngine =
/*#__PURE__*/
function (_GameEngine) {
  _inherits(InterferenceGameEngine, _GameEngine);

  function InterferenceGameEngine(options) {
    var _this;

    _classCallCheck(this, InterferenceGameEngine);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(InterferenceGameEngine).call(this, options));
    _this.physicsEngine = new _lanceGg.SimplePhysicsEngine({
      gameEngine: _assertThisInitialized(_this),
      collisions: {
        autoResolve: false
      }
    }); // game constants

    Object.assign(_assertThisInitialized(_this), {
      cellSize: 1,
      playerWidth: 16,
      playerHeight: 9,
      leftBound: 0,
      topBound: 0,
      bottomBound: 9,
      transportSyncInterval: 200,
      eggRadius: 1,
      eggBaseXVelocity: 0.1
    }); // game variables

    Object.assign(_assertThisInitialized(_this), {
      rooms: [],
      playersByRoom: {},
      eggsByRoom: {},
      rightBoundByRoom: {}
    });

    _this.on('preStep', _this.preStepLogic.bind(_assertThisInitialized(_this)));

    _this.on('postStep', _this.postStepLogic.bind(_assertThisInitialized(_this)));

    return _this;
  }

  _createClass(InterferenceGameEngine, [{
    key: "registerClasses",
    value: function registerClasses(serializer) {
      serializer.registerClass(_Performer.default);
      serializer.registerClass(_Egg.default);
    }
  }, {
    key: "start",
    value: function start() {
      _get(_getPrototypeOf(InterferenceGameEngine.prototype), "start", this).call(this);
    }
  }, {
    key: "randPos",
    value: function randPos(roomName) {
      var x = Math.random() * this.playerWidth * this.playersByRoom[roomName].length;
      var y = Math.random() * this.playerHeight;
      return new _lanceGg.TwoVector(x, y);
    }
  }, {
    key: "velRandY",
    value: function velRandY() {
      var y = (Math.random() - 0.5) * this.eggBaseXVelocity;
      return new _lanceGg.TwoVector(this.eggBaseXVelocity, y);
    }
  }, {
    key: "preStepLogic",
    value: function preStepLogic(stepInfo) {
      this.playersByRoom = this.groupBy(this.world.queryObjects({
        instanceType: _Performer.default
      }), "_roomName");
      this.rooms = Object.keys(this.playersByRoom);
      this.eggsByRoom = this.groupBy(this.world.queryObjects({
        instanceType: _Egg.default
      }), "_roomName");
      this.rightBoundByRoom = {};
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.rooms[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var r = _step.value;
          this.rightBoundByRoom[r] = this.playersByRoom[r].length * this.playerWidth;
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
  }, {
    key: "postStepLogic",
    value: function postStepLogic(stepInfo) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.rooms[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var r = _step2.value;
          this.resolveCollisions(r);
          this.gameLogic(r);
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
    key: "resolveCollisions",
    value: function resolveCollisions(r) {
      /*
      if (stepInfo.isReenact)
          return;
      */
      if (this.eggsByRoom[r]) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = this.eggsByRoom[r][Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var e = _step3.value;
            console.log(e.position); // bounce off walls

            if (e.position.x - this.eggRadius < this.leftBound) {
              e.velocity.x *= -1;
              e.position.x = this.leftBound + this.eggRadius;
            } else if (e.position.x + this.eggRadius > this.rightBoundByRoom[r]) {
              e.velocity.x *= -1;
              e.position.x = this.rightBoundByRoom[r] - this.eggRadius;
            }

            if (e.position.y - this.eggRadius < this.topBound) {
              e.velocity.y *= -1;
              e.position.y = this.topBound + this.eggRadius;
            } else if (e.position.y + this.eggRadius > this.bottomBound) {
              e.velocity.y *= -1;
              e.position.y = this.bottomBound - this.eggRadius;
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
      /*
      this.world.forEachObject((id, obj) => {
      if (obj instanceof Egg) {
      // if the position changed, add a body part and trim the length
      let pos = obj.position.clone();
      if (obj.bodyParts.length === 0 || pos.subtract(obj.bodyParts[obj.bodyParts.length-1]).length() > 0.05) {
      obj.bodyParts.push(obj.position.clone());
      while (obj.bodyLength < obj.bodyParts.length) obj.bodyParts.shift();
      }
      // if not stopped, move along
      if (obj.direction === this.directionStop) return;
      let move = new TwoVector(Math.cos(obj.direction), Math.sin(obj.direction));
      move.multiplyScalar(0.05);
      obj.position.add(move);
      obj.position.y = Math.min(obj.position.y, this.spaceHeight / 2);
      obj.position.y = Math.max(obj.position.y, -this.spaceHeight / 2);
      obj.position.x = Math.min(obj.position.x, this.spaceWidth / 2);
      obj.position.x = Math.max(obj.position.x, -this.spaceWidth / 2);
      }
      });                */

    }
  }, {
    key: "gameLogic",
    value: function gameLogic(r) {}
  }, {
    key: "groupBy",
    value: function groupBy(arr, property) {
      return arr.reduce(function (grouped, current) {
        if (!grouped[current[property]]) grouped[current[property]] = [];
        grouped[current[property]].push(current);
        return grouped;
      }, {});
    }
  }, {
    key: "processInput",
    value: function processInput(inputData, playerId, isServer) {
      _get(_getPrototypeOf(InterferenceGameEngine.prototype), "processInput", this).call(this, inputData, playerId);

      var player = this.world.queryObject({
        playerId: playerId
      });

      if (player) {
        if (inputData.input == 'c') {
          player.palette = palettes[(palettes.indexOf(player.palette) + 1) % palettes.length];
          console.log(player.palette);
        }
      }

      if (isServer) {
        // stuff that should only be processed on the server, such as randomness, which would otherwise cause discrepancies
        if (inputData.input == 'n') {
          var scale = scaleTable[player.palette];
          player.notestack = player.notestack.concat(String.fromCharCode(scale[Math.floor(Math.random() * scale.length)]));
          console.log(player.notestack);
        }

        if (inputData.input == 'b') {
          this.emit('beginPerformance', player);
        }
      }
    }
  }]);

  return InterferenceGameEngine;
}(_lanceGg.GameEngine);

exports.default = InterferenceGameEngine;
//# sourceMappingURL=InterferenceGameEngine.js.map