'use strict';

require('mocha-as-promised')();

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var expect = chai.expect;


// Provides a testable Hailo instance, with mock-requests and hookable to test
// config, getters and setters. This may be an overkill because later on we
// are actually building a mock API, and should also cover these tests
function getSpyableHailo() {
  var Hailo = require('../lib/hailo');
  var hailo = new Hailo('MySecretAPIKey');

  hailo.request = function(params) {
    hailo.LAST_REQUEST = params;
  }

  return hailo;
}

var hailo = getSpyableHailo();

describe('Hailo client config', function() {
  describe('.setApiKey', function(){
    it('Set a valid API Key', function() {
      var validKey = 'ThisIsAValidKey';
      hailo.setApiKey(validKey);
      expect(hailo.getConfig('apiKey')).to.equal(validKey);
    })
    it('Set an invalid API Key', function() {
      var invalidKey = null;
      expect(hailo.setApiKey.bind(null, invalidKey)).to.throw('Invalid apiKey');
    })
  })

  describe('.setEndPoint', function(){
    it('Set a new API End Point', function() {
      var newEndPoint = 'http://api.hailoapp.com/v2/';
      hailo.setEndPoint(newEndPoint);
      expect(hailo.getConfig('endPoint')).to.equal(newEndPoint);
    })
  })
});


// Test that the requests are done to the right URLs, and with the right params
describe('status', function() {
  describe('Status UP', function() {
    it('GET status up', function() {
      hailo.statusUp();
      expect(hailo.LAST_REQUEST).to.deep.equal({
        method: 'GET'
        , resource: '/status/up'
      })
    });
  });
});


describe('drivers', function() {
  describe('eta', function() {
    it('GET drivers eta by lat/long', function() {
      var latitude = 51.510761;
      var longitude = 0.1174437;
      hailo.driversEta(latitude, longitude);
      expect(hailo.LAST_REQUEST).to.deep.equal({
        method: 'GET'
        , resource: '/drivers/eta'
        , qs: {
          latitude: 51.510761
          , longitude: 0.1174437
        }
      })
    });
  });
});

describe('drivers', function() {
  describe('near', function() {
    it('GET drivers near a given lat/long', function() {
      var latitude = 51.510761;
      var longitude = 0.1174437;
      hailo.driversNear(latitude, longitude);
      expect(hailo.LAST_REQUEST).to.deep.equal({
        method: 'GET'
        , resource: '/drivers/near'
        , qs: {
          latitude: 51.510761
          , longitude: 0.1174437
        }
      })
    });
  });
});


// Now let's mock up the Hailo API using restify
var restify = require('restify');

var server = restify.createServer({
  name: 'Hailo Mock API server'
  , version: '1.0.0'
});

server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/status/up', function (req, res, next) {
  res.send([]);
  return next();
});

server.get('/drivers/eta', function (req, res, next) {
  if(req.header('Authorization') != 'token MyAPIKeyForTheMockServer') {
    res.send({
      status: false,
      payload: "Must be signed in to call this endpoint[endpoint=near, service=com.hailocab.api.drivers, from=com.hailocab.hailo-2-api]",
      code: 201,
      dotted_code: "com.hailocab.kernel.auth.badrole",
      context: [ ]
    });
  }
  else if(req.params.latitude == 51.510761) {
    res.send({
      "etas": [
        {
          "eta": 6,
          "count": 3,
          "service_type": "regular"
        },
        {
          "eta": 6,
          "count": 3,
          "service_type": "executive"
        }
      ]
    });
  }
  else {
    res.send({})
  }

  return next();
});

server.get('/drivers/near', function (req, res, next) {
  if(req.header('Authorization') != 'token MyAPIKeyForTheMockServer') {
    res.send({
      status: false,
      payload: "Must be signed in to call this endpoint[endpoint=near, service=com.hailocab.api.drivers, from=com.hailocab.hailo-2-api]",
      code: 201,
      dotted_code: "com.hailocab.kernel.auth.badrole",
      context: [ ]
    });
  }
  else {
    res.send({
      "drivers": [
        {
          "latitude": 51.50808,
          "longitude": -0.116408,
          "service_type": "regular"
        },
        {
          "latitude": 51.504695,
          "longitude": -0.113202,
          "service_type": "regular"
        },
        {
          "latitude": 51.51135,
          "longitude": -0.127148,
          "service_type": "regular"
        },
        {
          "latitude": 51.511745,
          "longitude": -0.117742,
          "service_type": "regular"
        },
        {
          "latitude": 51.509996,
          "longitude": -0.118696,
          "service_type": "regular"
        }
      ]
    });
  }
  return next();
});


server.listen(8081, function () {});

// The mock server is now running, test it!
var Hailo = require('../lib/hailo');
var hailoCli = new Hailo('MyAPIKeyForTheMockServer');
// Point the client to the mock API server
hailoCli.setEndPoint('http://localhost:8081');

describe('status', function() {
  describe('Status UP', function() {
    it('GET status up, empty array', function() {
      return expect(hailoCli.statusUp()).to.eventually.be.empty;
    });
  });
});

describe('drivers', function() {
  describe('eta', function() {
    it('GET drivers eta by lat/long', function() {
      var latitude = 51.510761;
      var longitude = 0.1174437;
      return expect(
        hailoCli.driversEta(latitude, longitude)).to.eventually.deep.equal({
          "etas": [
            {
              "eta": 6,
              "count": 3,
              "service_type": "regular"
            },
            {
              "eta": 6,
              "count": 3,
              "service_type": "executive"
            }
          ]
        });
      });
    it('GET drivers eta by different lat/long', function() {
      var latitude = 52.510761;
      var longitude = 0.1174437;
      return expect(
        hailoCli.driversEta(latitude, longitude)).to.eventually.deep.equal({});
      });
    it('GET drivers eta requires Auth', function() {
      // Set an invalid API Key
      hailoCli.setApiKey('123456789');
      return expect(hailoCli.driversEta()).to.eventually.deep.equal({
        status: false,
        payload: "Must be signed in to call this endpoint[endpoint=near, service=com.hailocab.api.drivers, from=com.hailocab.hailo-2-api]",
        code: 201,
        dotted_code: "com.hailocab.kernel.auth.badrole",
        context: [ ]
      });
    });
  });
});

describe('drivers', function() {
  describe('near', function() {
    it('GET drivers near a given lat/long', function() {
      hailoCli = new Hailo('MyAPIKeyForTheMockServer');
      hailoCli.setEndPoint('http://localhost:8081');
      return expect(hailoCli.driversNear()).to.eventually.deep.equal({
        "drivers": [
          {
            "latitude": 51.50808,
            "longitude": -0.116408,
            "service_type": "regular"
          },
          {
            "latitude": 51.504695,
            "longitude": -0.113202,
            "service_type": "regular"
          },
          {
            "latitude": 51.51135,
            "longitude": -0.127148,
            "service_type": "regular"
          },
          {
            "latitude": 51.511745,
            "longitude": -0.117742,
            "service_type": "regular"
          },
          {
            "latitude": 51.509996,
            "longitude": -0.118696,
            "service_type": "regular"
          }
        ]
      });
      // alternativily, omit the return and do .notify(done);
    });
  });
});
