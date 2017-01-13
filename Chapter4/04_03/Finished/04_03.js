var Hapi = require('hapi');
var mongoose = require('mongoose');
var Fitbit = require('fitbit-node');

var client = new Fitbit('', '');
var redirect_uri = "http://localhost:8080/fitbit_oauth_callback";
var scope = "activity profile";

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;

var userSchema = mongoose.Schema({
    userid: String,
    accessToken: String,
    refreshToken: String
});

var User = mongoose.model('User', userSchema);

var server = new Hapi.Server();
server.connection({
    port: 8080
});


server.route([
    // Auth callback
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
                updateUser(result.user_id, result.access_token, result.refresh_token);
                reply().redirect("/api/v1/users/" + result.user_id);
            })
        }
    },
    {
        method: 'GET',
        config: {
            json: {
                space: 2
            }
        },
        path: '/api/v1/users',
        handler: function(request, reply) {
            var result = User.find();
            result.exec(function(err, users) {
                userlist = [];
                users.forEach(function(userDoc) {
                    user = userDoc.toObject();
                    user._links = [{
                            "rel": "self",
                            "href": "http://localhost:8080/api/v1/users/" + user.userid,
                            "method": "GET"
                        },
                        {
                            "rel": "self",
                            "href": "http://localhost:8080/api/v1/users/" + user.userid,
                            "method": "DELETE"
                        },
                        {
                            "rel": "summary",
                            "href": "http://localhost:8080/api/v1/users/" + user.userid + "/activities/summary",
                            "method": "GET"
                        },
                        {
                            "rel": "activities",
                            "href": "http://localhost:8080/api/v1/users/" + user.userid + "/activities",
                            "method": "GET"
                        },
                        {
                            "rel": "activities",
                            "href": "http://localhost:8080/api/v1/users/" + user.userid + "/activities",
                            "method": "POST"
                        }
                    ]
                    userlist.push(user);
                })
                reply(userlist);
            })
        }
    },
    {
        method: 'DELETE',
        path: '/api/v1/users/{fitbitid}',
        handler: function(request, reply) {
            User.findOneAndRemove({
                userid: request.params.fitbitid
            }, function(err, response) {
                reply().code(204);
            })
        }
    },
    {
        method: 'GET',
        path: '/api/v1/users/{fitbitid}',
        handler: function(request, reply) {
            var result = User.findOne({
                "userid": request.params.fitbitid
            });
            result.exec(function(err, user) {
                client.get("/profile.json", user.accessToken).then(function(results) {
                    reply(results);
                })
            })
        }
    },
    {
        method: 'GET',
        config: {
            json: {
                space: 2
            }
        },
        path: '/api/v1/users/{fitbitid}/activities/summary',
        handler: function(request, reply) {
            var result = User.findOne({
                "userid": request.params.fitbitid
            });
            result.exec(function(err, user) {
                if (!user) {
                    reply().redirect("/fitbit")
                }
                var requestDate = getFitbitDate(request.query.date);
                var requestUrl = "/activities/date/" + requestDate + ".json";
                client.get(requestUrl, user.accessToken).then(function(results) {
                    reply(results[0]["summary"]);
                })
            })
        }
    },
    {
        method: 'GET',
        config: {
            json: {
                space: 2
            }
        },
        path: '/api/v1/users/{fitbitid}/activities',
        handler: function(request, reply) {
            var result = User.findOne({
                "userid": request.params.fitbitid
            });
            result.exec(function(err, user) {
                if (!user) {
                    reply().redirect("/fitbit")
                }
                var requestDate = getFitbitDate(request.query.date);
                var queryString = "?afterDate=" + requestDate +
                    "&sort=asc&offset=0&limit=50";
                var requestUrl = "/activities/list.json" + queryString;
                client.get(requestUrl, user.accessToken).then(function(results) {
                    reply(results[0]["activities"]);
                })
            })
        }
    },
    {
        method: 'POST',
        path: '/api/v1/users/{fitbitid}/activities',
        handler: function(request, reply) {
            var result = User.findOne({
                "userid": request.params.fitbitid
            });
            result.exec(function(err, user) {
                var requestDate = getFitbitDate(request.query.date);
                var activity = {
                    "activityName": "Cycling",
                    "manualCalories": 300,
                    "startTime": "09:00:00",
                    "durationMillis": 1000 * 60 * 30,
                    "date": requestDate
                }
                var requestUrl = "/activities.json";
                client.post(requestUrl, user.accessToken, activity).then(function(results) {
                    reply(results);
                })
            })
        }
    },
    {
        method: 'DELETE',
        path: '/api/v1/users/{fitbitid}/activities/{activityid}',
        handler: function(request, reply) {
            var result = User.findOne({
                "userid": request.params.fitbitid
            });
            result.exec(function(err, user) {
                var requestUrl = "/activities/" + request.params.activityid + ".json";
                client.delete(requestUrl, user.accessToken).then(function(results, response) {
                    console.log(results);
                    reply().code(204);
                })
            })
        }
    },
    {
        method: 'GET',
        path: '/',
        handler: function(request, reply) {
            reply('Hello world from hapi');
        }
    }
]);

function updateUser(userid, accessToken, refreshToken) {
    var newUserInfo = {
        'userid': userid,
        'accessToken': accessToken,
        'refreshToken': refreshToken
    };
    var newUser = new User(newUserInfo);
    User.update({
        "userid": userid
    }, newUser, {
        upsert: true
    }, function(err) {
        return;
    });
}

function getFitbitDate(requestDate) {
    // YYYY-MM-DD
    if (requestDate) {
        var returnDate = requestDate;
    } else {
        var d = new Date();
        dateArray = [d.getFullYear(), d.getMonth() + 1, d.getDate()];
        var returnDate = dateArray.join('-');
    }
    return returnDate;
}

server.start(function(err) {
    console.log('Hapi is listening to http://localhost:8080');
});