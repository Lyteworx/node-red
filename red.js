#!/usr/bin/env node
/**
 * Copyright 2013, 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
var http = require('http');
var https = require('https');
var util = require("util");
var express = require("express");
var crypto = require("crypto");
try { bcrypt = require('bcrypt'); }
catch(e) { bcrypt = require('bcryptjs'); }
var path = require("path");
var fs = require("fs-extra");
var RED = require("./red/red.js");

process.env.RED_VERSION = RED.version();

var app = express();
var settings = require('./lib/settings');
var server = require('./lib/admin_server');
var basicAuthMiddleware = require('./lib/middleware/basic_auth');

try {

    RED.init(server,settings);
    
} catch(err) {
    if (err.code == "not_built") {
        console.log("Node-RED has not been built. See README.md for details");
    } else {
        console.log("Failed to start server:");
        if (err.stack) {
            console.log(err.stack);
        } else {
            console.log(err);
        }
    }
    
    process.exit(1);
}

if (settings.httpAdminRoot !== false && settings.httpAdminAuth) {
    RED.log.warn(RED.log._("server.httpadminauth-deprecated"));
    app.use(settings.httpAdminRoot, basicAuthMiddleware(settings.httpAdminAuth.user,settings.httpAdminAuth.pass));
}

if (settings.httpAdminRoot !== false) {
    app.use(settings.httpAdminRoot,RED.httpAdmin);
}
if (settings.httpNodeRoot !== false && settings.httpNodeAuth) {
    app.use(settings.httpNodeRoot,basicAuthMiddleware(settings.httpNodeAuth.user,settings.httpNodeAuth.pass));
}
if (settings.httpNodeRoot !== false) {
    app.use(settings.httpNodeRoot,RED.httpNode);
}

if (settings.httpStatic) {
    settings.httpStaticAuth = settings.httpStaticAuth || settings.httpAuth;
    if (settings.httpStaticAuth) {
        app.use("/",basicAuthMiddleware(settings.httpStaticAuth.user,settings.httpStaticAuth.pass));
    }
    app.use("/",express.static(settings.httpStatic));
}

function getListenPath() {
    var listenPath = 'http'+(settings.https?'s':'')+'://'+
                    (settings.uiHost == '0.0.0.0'?'127.0.0.1':settings.uiHost)+
                    ':'+settings.uiPort;
    if (settings.httpAdminRoot !== false) {
        listenPath += settings.httpAdminRoot;
    } else if (settings.httpStatic) {
        listenPath += "/";
    }
    return listenPath;
};

RED.start().then(function() {
    if (settings.httpAdminRoot !== false || settings.httpNodeRoot !== false || settings.httpStatic) {
        server.on('error', function(err) {
            if (err.errno === "EADDRINUSE") {
                RED.log.error(RED.log._("server.unable-to-listen", {listenpath:getListenPath()}));
                RED.log.error(RED.log._("server.port-in-use"));
            } else {
                RED.log.error(RED.log._("server.uncaught-exception"));
                if (err.stack) {
                    RED.log.error(err.stack);
                } else {
                    RED.log.error(err);
                }
            }
            process.exit(1);
        });
        server.listen(settings.uiPort,settings.uiHost,function() {
            if (settings.httpAdminRoot === false) {
                RED.log.info(RED.log._("server.admin-ui-disabled"));
            }
            process.title = 'node-red';
            RED.log.info(RED.log._("server.now-running", {listenpath:getListenPath()}));
        });
    } else {
        RED.log.info(RED.log._("server.headless-mode"));
    }

}).otherwise(function(err) {
    RED.log.error(RED.log._("server.failed-to-start"));
    if (err.stack) {
        RED.log.error(err.stack);
    } else {
        RED.log.error(err);
    }
});


process.on('uncaughtException',function(err) {
    util.log('[red] Uncaught Exception:');
    if (err.stack) {
        util.log(err.stack);
    } else {
        util.log(err);
    }
    process.exit(1);
});

process.on('SIGINT', function () {
    RED.stop();
    // TODO: need to allow nodes to close asynchronously before terminating the
    // process - ie, promises
    process.exit();
});
