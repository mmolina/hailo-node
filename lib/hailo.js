'use strict';

var Promise = require('bluebird');
var request = require('request');
var requestPromise = Promise.promisify(request);

// Default details to connect to the Hailo API
Hailo.DEFAULT_ENDPOINT = 'https://api.hailoapp.com';

// Use node.js' default timeout:
Hailo.DEFAULT_TIMEOUT = require('http').createServer().timeout;

Hailo.USER_AGENT = {
  module: require('../package.json').name
  , version: require('../package.json').version
  , lang: 'node'
  , lang_version: process.version
  , platform: process.platform
};

Hailo.USER_AGENT_SERIALIZED = null;

function Hailo(apiKey) {
  if (!this instanceof Hailo) {
    return new Hailo(apiKey);
  }

  this._apiConfig = {
    apiKey: null
    , endPoint: Hailo.DEFAULT_ENDPOINT
    , timeout: Hailo.DEFAULT_TIMEOUT
    , userAgent: JSON.stringify(Hailo.USER_AGENT)
  };

  this.setApiKey(apiKey);
}

Hailo.prototype = {

  statusUp: function() {
    return this.request({
      resource: '/status/up'
      , method: 'GET'
    });
  },

  driversEta: function(latitude, longitude) {
    return this.request({
      resource: '/drivers/eta'
      , method: 'GET'
      , qs: {
        'latitude': latitude
        , 'longitude': longitude
      }
    });
  },

  driversNear: function(latitude, longitude) {
    return this.request({
      resource: '/drivers/near'
      , method: 'GET'
      , qs: {
        'latitude': latitude
        , 'longitude': longitude
      }
    });
  },

  request: function(params) {
    // Inject some headers into the params e.g. Authhentication, User Agent
    params.headers = {
      'User-Agent': this.getConfig('userAgent')
      , 'Authorization': 'token ' + this.getConfig('apiKey')
    };
    // Build the URL using the end point setting and the resource
    params.url = this.getConfig('endPoint') + params.resource;

    return requestPromise(params)
    // Catch response errors
    .then (function(res) {
        if (!res || !res[0]) throw new Error('No response');
        if (res[0].statusCode != 200) throw new Error(res[1]);
        return res[1];
    })
    // Parse JSON, or return
    .then (function(body) {
        if (body) {
          try {
            return JSON.parse(body);
          }
          catch (e) {
            throw new Error('Invalid response');
          }
        }
    });
  },

  /******************************
   * Config setters and getters *
   ******************************/
  setApiKey: function(key) {
    if (key) {
      this._setConfig('apiKey', key);
    }
    else {
      throw new Error('Invalid apiKey');
    }
  },

  setEndPoint: function(endPoint) {
    if (endPoint) {
      this._setConfig('endPoint', endPoint);
    }
  },

  _setConfig: function(key, value) {
    this._apiConfig[key] = value;
  },

  getConfig: function(key) {
    return this._apiConfig[key];
  }
}

module.exports = Hailo;
