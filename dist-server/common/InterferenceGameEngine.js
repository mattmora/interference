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
      // map: { setup: { variations: [0]['intro'], 
      // intro: ['buildMelody', 'buildBass', 'buildPerc'],
      // buildMelody: ['fight']
      // fight
      // },
      playerWidth: 16,
      playerHeight: 9,
      eggSounds: ['melody', 'bass', 'perc'],
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
        gridWidth: 1,
        gridHeight: 1,
        melody: {
          subdivision: '1n',
          length: 0
        },
        bass: {
          subdivision: '1n',
          length: 0
        },
        perc: {
          subdivision: '1n',
          length: 0
        }
      }, {
        //rain
        scale: [0, 4, 6, 9, 11],
        gridWidth: 16,
        gridHeight: 9,
        melody: {
          subdivision: '16n',
          length: 16
        },
        bass: {
          subdivision: '16n',
          length: 16
        },
        perc: {
          subdivision: '16n',
          length: 16
        }
      }, {
        //celeste
        scale: [0, 2, 3, 5, 7],
        gridWidth: 16,
        gridHeight: 9,
        melody: {
          subdivision: '16n',
          length: 16
        },
        bass: {
          subdivision: '16n',
          length: 16
        },
        perc: {
          subdivision: '16n',
          length: 16
        }
      }, {
        //pyre
        scale: [0, 2, 3, 7, 10],
        gridWidth: 16,
        gridHeight: 9,
        melody: {
          subdivision: '16n',
          length: 16
        },
        bass: {
          subdivision: '16n',
          length: 16
        },
        perc: {
          subdivision: '16n',
          length: 16
        }
      }, {
        //journey
        scale: [0, 2, 4, 7, 9],
        gridWidth: 16,
        gridHeight: 9,
        melody: {
          subdivision: '16n',
          length: 16
        },
        bass: {
          subdivision: '16n',
          length: 16
        },
        perc: {
          subdivision: '16n',
          length: 16
        }
      }, {
        //kirby
        scale: [0, 2, 4, 5, 7],
        gridWidth: 16,
        gridHeight: 9,
        melody: {
          subdivision: '16n',
          length: 16
        },
        bass: {
          subdivision: '16n',
          length: 16
        },
        perc: {
          subdivision: '16n',
          length: 16
        }
      }]
    }); // game variables

    Object.assign(_assertThisInitialized(_this), {
      shadowIdCount: _this.options.clientIDSpace,
      rooms: [],
      playersByRoom: {},
      eggsByRoom: {},
      rightBoundByRoom: {},
      eggSoundsToUse: _this.eggSounds
    });

    _this.on('preStep', _this.preStepLogic.bind(_assertThisInitialized(_this)));

    _this.on('postStep', _this.postStepLogic.bind(_assertThisInitialized(_this)));

    return _this;
  }

  _createClass(InterferenceGameEngine, [{
    key: "getNewShadowId",
    value: function getNewShadowId() {
      var id = this.shadowIdCount;
      this.shadowIdCount++;
      return id;
    } // based on lance findLocalShadow; instead of finding the shadow of a server obj,
    // looks for the server copy of a shadow obj, and removes the shadow if the server copy if found

  }, {
    key: "resolveShadowObject",
    value: function resolveShadowObject(shadowObj) {
      var _arr = Object.keys(this.world.objects);

      for (var _i = 0; _i < _arr.length; _i++) {
        var localId = _arr[_i];
        if (Number(localId) >= this.options.clientIDSpace) continue;
        var serverObj = this.world.objects[localId];

        if (serverObj.hasOwnProperty('inputId') && serverObj.inputId === shadowObj.inputId) {
          this.removeObjectFromWorld(shadowObj.id);
          return serverObj;
        }
      }

      return null;
    }
  }, {
    key: "registerClasses",
    value: function registerClasses(serializer) {
      serializer.registerClass(_Note.default);
      serializer.registerClass(_Performer.default);
      serializer.registerClass(_Egg.default);
    }
  }, {
    key: "start",
    value: function start() {
      _get(_getPrototypeOf(InterferenceGameEngine.prototype), "start", this).call(this);
    }
  }, {
    key: "wrap",
    value: function wrap(n, mod) {
      return (n % mod + mod) % mod;
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
      }), '_roomName');
      this.rooms = Object.keys(this.playersByRoom);
      this.eggsByRoom = this.groupBy(this.world.queryObjects({
        instanceType: _Egg.default
      }), '_roomName');
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
    value: function gameLogic(r) {
      if (this.eggsByRoom[r]) {
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = this.eggsByRoom[r][Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var e = _step4.value;

            if (e.hp <= 0) {
              e.velocity.x = 0;
              e.velocity.y = 0;
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
    } // based on lance GameWorld.queryObjects

  }, {
    key: "queryPlayers",
    value: function queryPlayers(query) {
      var queriedPlayers = [];
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = this.world.queryObjects({
          instanceType: _Performer.default
        })[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var p = _step5.value;
          var conditions = [];

          var _arr2 = Object.keys(query);

          for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
            var k = _arr2[_i2];
            conditions.push(!(k in query) || query[k] !== null && p[k] === query[k]);
          } // all conditions are true, object is qualified for the query


          if (conditions.every(function (value) {
            return value;
          })) {
            queriedPlayers.push(p);
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

      return queriedPlayers;
    }
  }, {
    key: "playerHitEgg",
    value: function playerHitEgg(p, e, isServer) {
      this.emit('playerHitEgg', e);
    } // based on lance GameWorld.queryObjects

  }, {
    key: "queryNotes",
    value: function queryNotes(query) {
      var queriedNotes = [];
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = this.world.queryObjects({
          instanceType: _Note.default
        })[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var note = _step6.value;
          var conditions = [];

          var _arr3 = Object.keys(query);

          for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
            var k = _arr3[_i3];
            conditions.push(!(k in query) || query[k] !== null && note[k] === query[k]);
          } // all conditions are true, object is qualified for the query


          if (conditions.every(function (value) {
            return value;
          })) {
            queriedNotes.push(note);
          }
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

      return queriedNotes;
    }
  }, {
    key: "playerHitEgg",
    value: function playerHitEgg(p, e, isServer) {
      this.emit('playerHitEgg', e);
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
          this.emit('updatePalette');
        } else if (isServer) {
          // stuff that should only be processed on the server, such as randomness, which would otherwise cause discrepancies
          // or actions that require more info than is available to one player
          //console.log(inputData.input);
          if (inputData.input == 'b') {
            this.emit('beginPerformance', player);
          } else if (inputData.input == '[') {
            var newNumber = player.number - 1;
            if (newNumber < 0) newNumber = players.length - 1;
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
              for (var _iterator7 = players[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                var p = _step7.value;

                if (p.number === newNumber) {
                  p.number = player.number;
                  p.move((p.number - newNumber) * this.playerWidth, 0);
                }
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

            player.move((newNumber - player.number) * this.playerWidth, 0);
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

                if (_p.number === _newNumber) {
                  _p.number = player.number;

                  _p.move((_p.number - _newNumber) * this.playerWidth, 0);
                }
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

            player.move((_newNumber - player.number) * this.playerWidth, 0);
            player.number = _newNumber;
          }
        }
      } else if (player.stage === 'intro') {} else if (player.stage === 'build') {
        if (inputData.input == 'space') {
          var _iteratorNormalCompletion9 = true;
          var _didIteratorError9 = false;
          var _iteratorError9 = undefined;

          try {
            for (var _iterator9 = eggs[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
              var e = _step9.value;

              if (this.positionIsInPlayer(e.position.x, player)) {
                //player.direction = 1;
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
        /*
        else if (inputData.input == 'w') {
            for (let e of eggsByType.perc) {
                if (this.positionIsInPlayer(e.position.x, player)) {
                    this.playerHitEgg(player, e, isServer);
                }
            }
        }
        else if (inputData.input == 'e') {
            for (let e of eggsByType.bass) {
                if (this.positionIsInPlayer(e.position.x, player)) {
                    this.playerHitEgg(player, e, isServer);
                }
            }
        } */

      } else if (player.stage === 'fight') {
        if (isServer) {
          if (inputData.input == 'w') {
            player.move(0, -1);
            player.paint();
          } else if (inputData.input == 'a') {
            player.move(-1, 0);
            player.paint();
          } else if (inputData.input == 's') {
            player.move(0, 1);
            player.paint();
          } else if (inputData.input == 'd') {
            player.move(1, 0);
            player.paint();
          }

          if (inputData.input == 'b') {
            this.emit('beginPerformance', player);
          }
        }
      }
    }
  }]);

  return InterferenceGameEngine;
}(_lanceGg.GameEngine);

exports.default = InterferenceGameEngine;
//# sourceMappingURL=InterferenceGameEngine.js.map