var Hapi = require('hapi');
var Fitbit = require('fitbit-node');

var client = new Fitbit('', '');
var redirect_uri = "http://localhost:8080/fitbit_oauth_callback";
var scope = "activity profile";

var server = new Hapi.Server();
server.connection({
    port: 8080
});

server.route([{
        method: 'GET',
        path: '/',
        handler: function(request, reply) {
            reply('Hello world from hapi');
        }
    },
    {
        method: 'GET',
        path: '/fitbit',
        handler: function(request, reply) {
            reply().redirect(client.getAuthorizeUrl(scope, redirect_uri));
        }
    },
    {
        method: 'GET',
        path: '/fitbit_oauth_callback',
        handler: function(request, reply) {
            client.getAccessToken(request.query.code, redirect_uri).then(function(result) {
                client.get("/profile.json", result.access_token).then(function(profile) {
                    reply(profile);
                })
            })
        }
    }
]);

server.start(function(err) {
    console.log('Hapi is listening to http://localhost:8080');
});
