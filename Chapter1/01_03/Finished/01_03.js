var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({
    port: 8080
});

// Create the data store for the test API
var todolist = [{
        "task": "Walk the cat",
        "owner": "Kirsten"
    },
    {
        "task": "Water the plants",
        "owner": "Kirsten"
    }
]

server.route([
    // Get ToDo List
    {
        method: 'GET',
        path: '/api/v1/todolist',
        handler: function(request, reply) {
            reply(todolist);
        }
    },

    {
        method: 'POST',
        path: '/api/v1/todolist',
        handler: function(request, reply) {
            newTask = {
                "task": request.payload.task,
                "owner": request.payload.owner
            };
            todolist.push(newTask);
            reply(todolist).code(201);
        }
    },

    // Get single task
    {
        method: 'GET',
        path: '/api/v1/todolist/{index}',
        handler: function(request, reply) {
            reply(todolist[request.params.index - 1])
        }
    },
    // Update single task
    {
        method: 'PUT',
        path: '/api/v1/todolist/{index}',
        handler: function(request, reply) {
            newTask = {
                "task": request.payload.task,
                "owner": request.payload.owner
            };
            todolist[request.params.index - 1] = newTask;
            reply(todolist);
        }
    },
    {
        method: 'DELETE',
        path: '/api/v1/todolist/{index}',
        handler: function(request, reply) {
            delete todolist[request.params.index - 1];
            reply().code(204);
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

server.start(function(err) {
    console.log('Hapi is listening to http://localhost:8080');
});