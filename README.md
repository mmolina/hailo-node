# Hailo API wrapper [![Build Status](https://travis-ci.org/mmolina/hailo-node.svg?branch=master)](https://travis-ci.org/mmolina/hailo-node)

Node module for accessing the Hailo API. Happy hailing! :)

## Disclaimer

This is an unofficial client for the Hailo API. The author is just a layman
Hailo user :)
For some official information, visit [Hailo Developer](https://developer.hailoapp.com/ 'Hailo Developer').

## Installation

```bash
npm install hailo
```

## API

You'll need an API key (promply provided by Hailo), and you'll interact with the client like:

```javascript
var Hailo = require('hailo');
var hailo = new Hailo('MySecretAPIKey');

var promiseUp = hailo.statusUp();

```

**Note:** Please remember that all the methods return promises, treat them as such.

### .statusUp()
Is the Hailo API working?

### .driversEta(String latitude, String longitude)
The ETA endpoint allows you to retrieve an Estimated Time of Arrival for cabs near to a given location.

### .driversNear(String latitude, String longitude)
Get the location and service type of Hailo drivers near a given location.

### .request(Object parameters)
Returns a Promise of a call to the API endpoint with specified parameters.  
If there is not response or the HTTP code for it isn't `200` it'll throw an error. Otherwise it'll parse the body of the response returned by the Hailo API.

This method is called from each of the previous ones, so they don't need to worry about the request, response, etc.

The required parameters are:
 * resource: The API resource to request
 * method: The HTTP method to use (GET, POST, etc.)
 * qs: The request parameters themselves, query string.

For example:
```json
{
  resource: '/foo/bar'
  , method: 'GET'
  , qs: {
    'latitude': x
    , 'longitude': y
  }
}
```

## Tests

There are some [mocha](http://visionmedia.github.io/mocha/) tests included in the source. To run them just execute:

```bash
npm test
```

You'll need mocha installed for that, but it should be already installed if you already ran `npm install`.


## License

Apache 2.0
