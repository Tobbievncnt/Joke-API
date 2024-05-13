// Import necessary modules
import http from 'http';
import { parse } from 'url';
import { StringDecoder } from 'string_decoder';

// Create a new StringDecoder instance for decoding request data
const decoder = new StringDecoder('utf-8');

// Database of jokes
let db = [
    { id: 1, title: "Why did the scarecrow win an award?", comedian: "unknown", year: "2000" },
    { id: 2, title: "Parallel lines have so much in common.", comedian: "unknown", year: "2005" },
    { id: 3, title: "I told my wife she was drawing her eyebrows too high.", comedian: "unknown", year: "2010" }
];

// Create an HTTP server
const server = http.createServer((req, res) => {
    // Extract request details
    const { url, method } = req;
    const parsedUrl = parse(url, true);
    const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');
    const queryStringObject = parsedUrl.query;

    // Buffer for collecting request data
    let buffer = '';
    req.on('data', data => {
        buffer += decoder.write(data);
    });

    // Handle end of request
    req.on('end', () => {
        buffer += decoder.end();

        // Choose the appropriate handler based on the request path
        const chosenHandler = typeof (router[path]) !== 'undefined' ? router[path] : handlers.notFound;

        // Prepare data object to pass to handler
        const data = {
            path,
            queryStringObject,
            method,
            payload: buffer
        };

        // Call the chosen handler
        chosenHandler(data, (statusCode, payload) => {
            // Set response status code and content type
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
            payload = typeof (payload) == 'object' ? payload : {};
            const payloadString = JSON.stringify(payload);
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            
            // Send response
            res.end(payloadString);

            // Log the response
            console.log('Returning this response: ', statusCode, payloadString);
        });
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

// Define request handlers
const handlers = {};

// Handler for jokes route
handlers.jokes = (data, callback) => {
    // Handle GET request
    if (data.method === 'GET') {
        callback(200, db);
    } 
    // Handle POST request
    else if (data.method === 'POST' && data.path === '') {
        const { title, comedian, year } = JSON.parse(data.payload);
        const newJoke = { id: db.length + 1, title, comedian, year };
        db.push(newJoke);
        callback(200, newJoke);
    } 
    // Handle PATCH and DELETE requests
    else if (data.method === 'PATCH' || data.method === 'DELETE') {
        const jokeId = parseInt(data.path.split('/')[1]);
        const jokeIndex = db.findIndex(joke => joke.id === jokeId);
        if (jokeIndex === -1) {
            callback(404, { error: 'Joke not found' });
        } else {
            if (data.method === 'PATCH') {
                const { title, comedian, year } = JSON.parse(data.payload);
                db[jokeIndex] = { ...db[jokeIndex], title, comedian, year };
                callback(200, db[jokeIndex]);
            } else if (data.method === 'DELETE') {
                const deletedJoke = db.splice(jokeIndex, 1);
                callback(200, deletedJoke[0]);
            }
        }
    } 
    // Handle other methods
    else {
        callback(405);
    }
};

// Handler for not found routes
handlers.notFound = (data, callback) => {
    callback(404);
};

// Define router mapping paths to handlers
const router = {
    jokes: handlers.jokes,
};
