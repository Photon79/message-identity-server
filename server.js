require('es6-promise').polyfill();

var 
    express = require('express'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    jsrsasign = require('jsrsasign'),
    yaml = require('parser-yaml'),
    denodeify = require('denodeify'),
    request = require('request'),
    get = denodeify(request.get),
    post = denodeify(request.post),
    config = yaml.parseFileSync('config.yml'),
    cors = require('./cors'),
    app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.get('/', function(req, res) {
    res.send('Welcome to the Sample Backend for Layer Authentication');
});

var api_version = config.layer.api_version;
var layerProviderID = process.env.LAYER_PROVIDER_ID || config.layer.provider_id;
var layerKeyID = process.env.LAYER_KEY_ID || config.layer.key_id;
var layerAppID = process.env.LAYER_APP_ID || config.layer.app_id;
var privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
    try {
        privateKey = fs.readFileSync('layer-key.pem').toString();
    } catch (e) {
        console.error('Couldn\'t find Private Key file: layer-key.pem');
    }
}

app.post('/authenticate', function(req, res) {
    var userId = req.body.user_id;

    post('https://api.layer.com/nonces', {
        headers: {
            'Accept': 'application/vnd.layer+json; version=' + api_version,
            'Content-Type': 'application/json'
        }
    }).then(function(result) {
        return JSON.parse(result.body).nonce;
    }).then(function(nonce) {
        if (!userId) {
            console.log(1);
            throw new Error({code: 400, message: 'Missing `user_id` body parameter.'});
        }

        if (!layerProviderID) {
            console.log(2);
            throw new Error({code: 500, message: 'Couldn\'t find LAYER_PROVIDER_ID'});
        }

        if (!layerKeyID) {
            console.log(3);
            throw new Error({code: 500, message: 'Couldn\'t find LAYER_KEY_ID'});
        }

        if (!privateKey) {
            console.log(4);
            throw new Error({code: 500, message: 'Couldn\'t find Private Key'});
        }

        var header = JSON.stringify({
            typ: 'JWT', // Expresses a MIMEType of application/JWT
            alg: 'RS256', // Expresses the type of algorithm used to sign the token, must be RS256
            cty: 'layer-eit;v=1', // Express a Content Type of application/layer-eit;v=1
            kid: layerKeyID
        });

        var currentTimeInSeconds = Math.round(new Date() / 1000);
        var expirationTime = currentTimeInSeconds + 10000;

        var claim = JSON.stringify({
            iss: layerProviderID, // The Layer Provider ID
            prn: userId, // User Identifier
            iat: currentTimeInSeconds, // Integer Time of Token Issuance 
            exp: expirationTime, // Integer Arbitrary time of Token Expiration
            nce: nonce // Nonce obtained from the Layer Client SDK
        });

        var jws = null;
        try {
            jws = jsrsasign.jws.JWS.sign('RS256', header, claim, privateKey);
        } catch (e) {
            console.log(5);
            throw new Error({code: 500, message: 'Could not create signature. Invalid Private Key: ' + e});
        }

        return jws;
    }).then(function(identity_token) {
        if (!layerAppID) {
            console.log(6);
            throw new Error({code: 500, message: 'Couldn\'t find LAYER_APP_ID'});
        }

        return post('https://api.layer.com/sessions', {
            body: {
                app_id: layerAppID,
                identity_token: identity_token
            },
            json: true,
            headers: {
                'Accept': 'application/vnd.layer+json; version=' + api_version,
                'Content-Type': 'application/json'
            }
        });
    }).then(function(result) {
        if (result.statusCode === 201)
            return res.status(200).json(result.body);
        
        res.status(result.statusCode).json(result.body);
    }).catch(function(error) {
        return res.status(500).json(error);
    });
});

var port = process.env.PORT || 3000;

app.listen(port, function() {
    console.log('Express server running on localhost:%d', port);
});