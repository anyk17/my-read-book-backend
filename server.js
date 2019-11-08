"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var path_1 = require("path");
var bodyParser = require("body-parser");
var cors = require("cors");
var compression = require("compression");
var cookieParser = require("cookie-parser");
var API_KEY = 'MY-API-KEY';
var DIST_FOLDER = path_1.join(process.cwd(), '../my-read-books/dist/my-read-books/');
var authy = require('authy')(API_KEY);
// Express server
var app = express();
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
var PORT = process.env.PORT || 4000;
// Example Express Rest API endpoints
// app.get('/api/**', (req, res) => { });
// Serve static files from /browser
app.post('/auth/login', function (req, res) {
    if (req.body.login === 'foo' && req.body.password === 'bar') {
        authy.send_approval_request('193505887', {
            message: 'Request to login to My Read Books'
            // tslint:disable-next-line:only-arrow-functions
        }, null, null, function (err, authResponse) {
            if (err) {
                res.status(400).send(res);
            }
            else {
                res.status(200).send({ token: authResponse.approval_request.uuid });
            }
        });
    }
    else {
        res.status(401).send('Bad credentials');
    }
});
app.get('/auth/status', function (req, res) {
    authy.check_approval_status(req.headers.token, function (err, authResponse) {
        if (err) {
            res.status(400).send(err);
        }
        else {
            if (authResponse.approval_request.status === 'approved') {
                res.cookie('authentication', 'super-encrypted-value-indicating-that-user-is-authenticated!', {
                    maxAge: 5 * 60 * 1000,
                    httpOnly: true
                });
                if (req.headers.remember === 'true') {
                    res.cookie('remember', authResponse.approval_request._authy_id, {
                        maxAge: 30 * 60 * 60 * 1000,
                        httpOnly: true
                    });
                }
            }
            res.status(200).send({ status: authResponse.approval_request.status });
        }
    });
});
app.get('/auth/isLogged', function (req, res) {
    res.status(200).send({ authenticated: req.cookies.authentication === 'super-encrypted-value-indicating-that-user-is-authenticated!' });
});
// ---- SERVE STATIC FILES ---- //
app.get('*.*', express.static(DIST_FOLDER, { maxAge: '1y' }));
// ---- SERVE APLICATION PATHS ---- //
app.all('*', function (req, res) {
    res.status(200).sendFile("/", { root: DIST_FOLDER });
});
// Start up the Node server
app.listen(PORT, function () {
    console.log("Node Express server listening on http://localhost:" + PORT);
});
