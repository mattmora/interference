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
    });

    _this.on('preStep', _this.moveAll.bind(_assertThisInitialized(_this))); // game variables


    Object.assign(_assertThisInitialized(_this), {
      playerWidth: 16,
      playerHeight: 9,
      transportSyncInterval: 200
    });
    /*
    Object.assign(this, {
        foodRadius: 0.1, headRadius: 0.15, bodyRadius: 0.1,
        eyeDist: 0.08, eyeRadius: 0.03, eyeAngle: 0.5,
        spaceWidth: 16, spaceHeight: 9, moveDist: 0.06,
        foodCount: 16, eatDistance: 0.3, collideDistance: 0.3,
        startBodyLength: 10, aiCount: 3, directionStop: 100
    }); */

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
    value: function randPos() {
      var x = (Math.random() - 0.5) * this.spaceWidth;
      var y = (Math.random() - 0.5) * this.spaceHeight;
      return new _lanceGg.TwoVector(x, y);
    }
  }, {
    key: "moveAll",
    value: function moveAll(stepInfo) {
      if (stepInfo.isReenact) return;
      this.world.forEachObject(function (id, obj) {
        if (obj instanceof _Performer.default) {
          /*
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
          */
        }
      });
    }
  }, {
    key: "processInput",
    value: function processInput(inputData, playerId, isServer) {
      _get(_getPrototypeOf(InterferenceGameEngine.prototype), "processInput", this).call(this, inputData, playerId);

      var player = this.world.queryObject({
        playerId: playerId
      });

      if (player) {
        if (inputData.input == 'n') {
          var scale = scaleTable[player.palette];
          player.notestack = player.notestack.concat(String.fromCharCode(scale[Math.floor(Math.random() * scale.length)]));
          console.log(player.notestack);
        } else if (inputData.input == 'c') {
          player.palette = palettes[(palettes.indexOf(player.palette) + 1) % palettes.length];
          console.log(player.palette);
        }
      }

      if (isServer) {} else {
        if (player) {
          if (inputData.input == 'space') {}
        }
      }
    }
  }]);

  return InterferenceGameEngine;
}(_lanceGg.GameEngine);

exports.default = InterferenceGameEngine;
//# sourceMappingURL=InterferenceGameEngine.js.map