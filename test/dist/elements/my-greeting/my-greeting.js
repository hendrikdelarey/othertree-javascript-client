'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Polymer = require('polymer');

var MyGreeting = function () {
    function MyGreeting() {
        _classCallCheck(this, MyGreeting);
    }

    _createClass(MyGreeting, [{
        key: 'beforeRegister',
        value: function beforeRegister() {
            this.is = 'my-greeting';
            this.properties = {
                greeting: {
                    type: String,
                    value: 'Welcome!',
                    notify: true
                }
            };
        }
    }, {
        key: 'onClick',
        value: function onClick() {
            var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0,
                    v = c === 'x' ? r : r & 0x3 | 0x8;
                return v.toString(16);
            });
            var client = new OtherTreeClient('http://othertree-dev-cloudservice.cloudapp.net:8080/', guid);
            console.log(client);
        }
    }, {
        key: 'created',
        value: function created() {}
    }, {
        key: 'ready',
        value: function ready() {}
    }, {
        key: 'attached',
        value: function attached() {}
    }, {
        key: 'detached',
        value: function detached() {}
    }, {
        key: 'attributeChanged',
        value: function attributeChanged() {}
    }]);

    return MyGreeting;
}();

Polymer(MyGreeting);