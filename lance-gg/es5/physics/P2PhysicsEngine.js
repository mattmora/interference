var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import PhysicsEngine from './PhysicsEngine';
import p2 from 'p2';

/**
 * CannonPhysicsEngine is a three-dimensional lightweight physics engine
 */

var P2PhysicsEngine = function (_PhysicsEngine) {
    _inherits(P2PhysicsEngine, _PhysicsEngine);

    function P2PhysicsEngine(options) {
        _classCallCheck(this, P2PhysicsEngine);

        var _this = _possibleConstructorReturn(this, (P2PhysicsEngine.__proto__ || Object.getPrototypeOf(P2PhysicsEngine)).call(this, options));

        _this.options.dt = _this.options.dt || 1 / 60;
        _this.world = new p2.World({ gravity: [0, 0] });
        _this.p2 = p2;
        return _this;
    }

    // entry point for a single step of the Simple Physics


    _createClass(P2PhysicsEngine, [{
        key: 'step',
        value: function step(dt, objectFilter) {
            this.world.step(dt || this.options.dt);
        }

        // add a circle

    }, {
        key: 'addCircle',
        value: function addCircle(radius, mass) {

            // create a body, add shape, add to world
            var body = new p2.Body({ mass: mass, position: [0, 0] });
            body.addShape(new p2.Circle({ radius: radius }));
            this.world.addBody(body);

            return body;
        }
    }, {
        key: 'addBox',
        value: function addBox(width, height, mass) {

            // create a body, add shape, add to world
            var body = new p2.Body({ mass: mass, position: [0, 0] });
            body.addShape(new p2.Box({ width: width, height: height }));
            this.world.addBody(body);

            return body;
        }
    }, {
        key: 'removeObject',
        value: function removeObject(obj) {
            this.world.removeBody(obj);
        }
    }]);

    return P2PhysicsEngine;
}(PhysicsEngine);

export default P2PhysicsEngine;