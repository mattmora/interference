"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lanceGg = require("lance-gg");

var _Note = _interopRequireDefault(require("./Note"));

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

//const palettes = ['rain', 'celeste', 'pyre', 'journey', 'kirby'];
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
      playerWidth: 16,
      playerHeight: 9,
      eggHPRange: 4,
      eggHPMin: 3,
      startingAmmo: 2,
      reloadSize: 2,
      leftBound: 0,
      topBound: 0,
      bottomBound: 9,
      transportSyncInterval: 200,
      eggRadius: 1,
      eggBaseXVelocity: 0.15,
      palettes: [1, 2, 3, 4, 5],
      paletteAttributes: [{
        //default
        scale: [0, 2, 4, 5, 7],
        gridWidth: 0,
        gridHeight: 0,
        subdivision: '1n'
      }, {
        //rain
        scale: [0, 4, 6, 9, 11],
        gridWidth: 16,
        gridHeight: 9,
        subdivision: '16n'
      }, {
        //celeste
        scale: [0, 2, 3, 5, 7],
        gridWidth: 16,
        gridHeight: 9,
        subdivision: '16n'
      }, {
        //pyre
        scale: [0, 2, 3, 7, 10],
        gridWidth: 16,
        gridHeight: 9,
        subdivision: '16n'
      }, {
        //journey
        scale: [0, 2, 4, 7, 9],
        gridWidth: 16,
        gridHeight: 9,
        subdivision: '16n'
      }, {
        //kirby
        scale: [0, 2, 4, 5, 7],
        gridWidth: 16,
        gridHeight: 9,
        subdivision: '16n'
      }]
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
          this.quantizedMovement(r);
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
    key: "quantizedMovement",
    value: function quantizedMovement(r) {
      if (this.eggsByRoom[r]) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = this.eggsByRoom[r][Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var e = _step3.value;
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
    }
  }, {
    key: "resolveCollisions",
    value: function resolveCollisions(r) {
      /*
      if (stepInfo.isReenact)
          return;
      */
      if (this.eggsByRoom[r]) {
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = this.eggsByRoom[r][Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var e = _step4.value;

            // bounce off walls
            if (e.position.x - this.eggRadius < this.leftBound) {
              e.velocity.x *= -1;
              e.position.x = this.leftBound + this.eggRadius;
              this.emit('eggBounce', e);
            } else if (e.position.x + this.eggRadius > this.rightBoundByRoom[r]) {
              e.velocity.x *= -1;
              e.position.x = this.rightBoundByRoom[r] - this.eggRadius;
              this.emit('eggBounce', e);
            }

            if (e.position.y - this.eggRadius < this.topBound) {
              e.velocity.y *= -1;
              e.position.y = this.topBound + this.eggRadius;
              this.emit('eggBounce', e);
            } else if (e.position.y + this.eggRadius > this.bottomBound) {
              e.velocity.y *= -1;
              e.position.y = this.bottomBound - this.eggRadius;
              this.emit('eggBounce', e);
            } // check if broken


            if (e.hp <= 0 && !e.broken) {
              e.broken = true;
              this.emit('eggBroke', e);
            }
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
    value: function gameLogic(r) {
      if (this.eggsByRoom[r]) {
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = this.eggsByRoom[r][Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var e = _step5.value;

            if (e.hp <= 0) {
              e.velocity.x = 0;
              e.velocity.y = 0;
            }
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
  }, {
    key: "playerHitEgg",
    value: function playerHitEgg(p, e, isServer) {
      if (e.hp <= 0) return;
      if (p.ammo <= 0) return;
      var pal = p.palette;
      var pos = this.playerQuantizedPosition(p, e.position.x, e.position.y, this.paletteAttributes[pal].gridWidth, this.paletteAttributes[pal].gridHeight);
      var scale = this.paletteAttributes[pal].scale; //TODO should base this on grid

      var step = pos[0];
      var pitch = this.paletteAttributes[pal].gridHeight - pos[1] + scale.length * 4;
      var dur = '16n';
      var seq = p.sequences[e.sound];

      if (seq[step]) {
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = seq[step][Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var note = _step6.value;
            if (note.pitch === pitch) note = '2n';else seq[step].push(new _Note.default({
              pitch: pitch,
              dur: dur,
              vel: 1,
              cell: {
                x: pos[0],
                y: pos[1]
              },
              step: step
            }));
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
      } else seq[step] = [new _Note.default({
        pitch: pitch,
        dur: dur,
        vel: 1,
        cell: {
          x: pos[0],
          y: pos[1]
        },
        step: step
      })];

      p[e.sound] = JSON.stringify(seq);
      p.ammo--;
      this.emit('playerHitEgg', e);

      if (isServer) {
        e.hp--;
        console.log(e.hp);
      }
    }
  }, {
    key: "positionIsInPlayer",
    value: function positionIsInPlayer(x, p) {
      var leftBound = p.number * this.playerWidth;
      var rightBound = (p.number + 1) * this.playerWidth;
      return leftBound < x && x < rightBound;
    }
  }, {
    key: "quantizedPosition",
    value: function quantizedPosition(x, y, divX, divY) {
      var cellX = Math.floor(x / (this.playerWidth / divX)) * (this.playerWidth / divX);
      var cellY = Math.floor(y / (this.playerHeight / divY)) * (this.playerHeight / divY);
      return [cellX, cellY];
    }
  }, {
    key: "playerQuantizedPosition",
    value: function playerQuantizedPosition(p, x, y, divX, divY) {
      var cell = this.quantizedPosition(x, y, divX, divY);
      var playerCellX = cell[0] - p.number * divX;
      var playerCellY = cell[1];
      return [playerCellX, playerCellY];
    }
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
      var players = this.playersByRoom[player._roomName];
      var eggs = this.eggsByRoom[player._roomName];
      var eggsByType = {};

      if (eggs) {
        eggsByType = this.groupBy(eggs, 'sound');
      }

      if (player.stage === 'setup') {
        //TODO need to update a bunch of stuff on a color change, 
        // also need to be careful when referencing the player palette vs a cell palette, player palette should not change after setup?
        if (inputData.input == 'c') {
          player.palette = this.palettes[(this.palettes.indexOf(player.palette) + 1) % this.palettes.length];
          console.log(player.palette);
        }

        if (isServer) {
          // stuff that should only be processed on the server, such as randomness, which would otherwise cause discrepancies
          // or actions that require more info than is available to one player
          //console.log(inputData.input);
          if (inputData.input == '[') {
            var newNumber = player.number - 1;
            if (newNumber < 0) newNumber = players.length - 1;
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
              for (var _iterator7 = players[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                var p = _step7.value;
                if (p.number === newNumber) p.number = player.number;
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

            player.number = newNumber;
          } else if (inputData.input == ']') {
            var _newNumber = player.number + 1;

            if (_newNumber >= players.length) _newNumber = 0;
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
              for (var _iterator8 = players[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                var _p = _step8.value;
                if (_p.number === _newNumber) _p.number = player.number;
              }
            } catch (err) {
              _didIteratorError8 = true;
              _iteratorError8 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion8 && _iterator8.return != null) {
                  _iterator8.return();
                }
              } finally {
                if (_didIteratorError8) {
                  throw _iteratorError8;
                }
              }
            }

            player.number = _newNumber;
          } else if (inputData.input == 'b') {
            this.emit('beginPerformance', player);
          }
        }
      } else if (player.stage === 'intro') {
        if (isServer) {
          if (inputData.input == 'q') {
            var _iteratorNormalCompletion9 = true;
            var _didIteratorError9 = false;
            var _iteratorError9 = undefined;

            try {
              for (var _iterator9 = eggsByType.melody[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                var e = _step9.value;

                if (this.positionIsInPlayer(e.position.x, player)) {
                  this.playerHitEgg(player, e, isServer);
                }
              }
            } catch (err) {
              _didIteratorError9 = true;
              _iteratorError9 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion9 && _iterator9.return != null) {
                  _iterator9.return();
                }
              } finally {
                if (_didIteratorError9) {
                  throw _iteratorError9;
                }
              }
            }
          }

          if (inputData.input == 'w') {
            var _iteratorNormalCompletion10 = true;
            var _didIteratorError10 = false;
            var _iteratorError10 = undefined;

            try {
              for (var _iterator10 = eggsByType.perc[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                var _e = _step10.value;

                if (this.positionIsInPlayer(_e.position.x, player)) {
                  this.playerHitEgg(player, _e, isServer);
                }
              }
            } catch (err) {
              _didIteratorError10 = true;
              _iteratorError10 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion10 && _iterator10.return != null) {
                  _iterator10.return();
                }
              } finally {
                if (_didIteratorError10) {
                  throw _iteratorError10;
                }
              }
            }
          }

          if (inputData.input == 'e') {
            var _iteratorNormalCompletion11 = true;
            var _didIteratorError11 = false;
            var _iteratorError11 = undefined;

            try {
              for (var _iterator11 = eggsByType.bass[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                var _e2 = _step11.value;

                if (this.positionIsInPlayer(_e2.position.x, player)) {
                  this.playerHitEgg(player, _e2, isServer);
                }
              }
            } catch (err) {
              _didIteratorError11 = true;
              _iteratorError11 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion11 && _iterator11.return != null) {
                  _iterator11.return();
                }
              } finally {
                if (_didIteratorError11) {
                  throw _iteratorError11;
                }
              }
            }
          }
        }
      }
      /*
      else if (inputData.input == 'n') {
          let scale = paletteAttributes.scale[player.palette];
          player.notestack = player.notestack.concat(
              String.fromCharCode(scale[Math.floor(Math.random() * scale.length)])
          );
          console.log(player.notestack);
      } */

    }
  }]);

  return InterferenceGameEngine;
}(_lanceGg.GameEngine);

exports.default = InterferenceGameEngine;
//# sourceMappingURL=InterferenceGameEngine.js.map