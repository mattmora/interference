"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lanceGg = require("lance-gg");

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var Performer =
/*#__PURE__*/
function (_DynamicObject) {
  _inherits(Performer, _DynamicObject);

  _createClass(Performer, null, [{
    key: "netScheme",
    get: function get() {
      return Object.assign({
        number: {
          type: _lanceGg.BaseTypes.TYPES.INT16
        },
        palette: {
          type: _lanceGg.BaseTypes.TYPES.UINT8
        },
        ammo: {
          type: _lanceGg.BaseTypes.TYPES.INT16
        },
        direction: {
          type: _lanceGg.BaseTypes.TYPES.UINT8
        },
        stage: {
          type: _lanceGg.BaseTypes.TYPES.STRING
        },
        gridString: {
          type: _lanceGg.BaseTypes.TYPES.STRING
        },
        xPos: {
          type: _lanceGg.BaseTypes.TYPES.INT16
        },
        yPos: {
          type: _lanceGg.BaseTypes.TYPES.INT16
        }
      }, _get(_getPrototypeOf(Performer), "netScheme", this));
    }
  }]);

  function Performer(gameEngine, options, props) {
    var _this;

    _classCallCheck(this, Performer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Performer).call(this, gameEngine, options, props));
    _this.class = Performer;
    _this.grid = [[]];
    return _this;
  }

  _createClass(Performer, [{
    key: "move",
    value: function move(xStep, yStep) {
      this.xPos += xStep;
      this.yPos += yStep;
      var rightBound = this.gameEngine.playersByRoom[this._roomName].length * this.gameEngine.playerWidth;
      var leftBound = this.gameEngine.playerHeight;

      if (this.xPos >= rightBound) {
        this.xPos -= rightBound;
      }

      if (this.yPos >= leftBound) {
        this.yPos -= leftBound;
      }

      if (this.xPos < 0) {
        this.xPos += rightBound;
      }

      if (this.yPos < 0) {
        this.yPos += leftBound;
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.gameEngine.queryNotes({
          ownerId: this.playerId
        })[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var n = _step.value;
          //console.log(n);
          n.move(xStep, yStep);
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
    key: "moveTo",
    value: function moveTo(xPos, yPos) {
      var xStep = xPos - this.xPos;
      var yStep = yPos - this.yPos;
      this.xPos = xPos;
      this.yPos = yPos;
      var rightBound = this.gameEngine.playersByRoom[this._roomName].length * this.gameEngine.playerWidth;
      var leftBound = this.gameEngine.playerHeight;

      if (this.xPos >= rightBound) {
        this.xPos -= rightBound;
      }

      if (this.yPos >= leftBound) {
        this.yPos -= leftBound;
      }

      if (this.xPos < 0) {
        this.xPos += rightBound;
      }

      if (this.yPos < 0) {
        this.yPos += leftBound;
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.gameEngine.queryNotes({
          ownerId: this.playerId
        })[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var n = _step2.value;
          //console.log(n);
          n.move(xStep, yStep);
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
    key: "paint",
    value: function paint() {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.gameEngine.queryNotes({
          ownerId: this.playerId
        })[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var n = _step3.value;
          //console.log(n);
          n.paint();
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
    key: "syncTo",
    value: function syncTo(other) {
      _get(_getPrototypeOf(Performer.prototype), "syncTo", this).call(this, other);
    }
  }, {
    key: "toString",
    value: function toString() {
      return "Performer::".concat(_get(_getPrototypeOf(Performer.prototype), "toString", this).call(this), " number=").concat(this.number, " ");
    }
  }]);

  return Performer;
}(_lanceGg.DynamicObject);

exports.default = Performer;
//# sourceMappingURL=Performer.js.map