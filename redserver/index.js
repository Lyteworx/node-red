/**
 * Copyright 2013, 2015 IBM Corp.
 * Copyright 2016 Lyteworx
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
var path = require('path');
var express = require("express");
var app = express();
var settings = require(path.join(process.env.PWD, 'lib', 'settings'));
var basicAuthMiddleware = require('./middleware/basic_auth');
var api = require('./api');
var checkBuild = require('./lib/check_build');
var RED = require(path.join(process.env.PWD,"red","red.js"));

var http = require('http');
var settings = process.env.settings = require(path.join(process.env.PWD,"lib","settings.js"));

if (settings.https) {
    server = https.createServer(settings.https,app);
} else {
    server = http.createServer(app);
}
server.setMaxListeners(0);

api.init(server, settings);

//Check for built client .js file
if (!settings.SKIP_BUILD_CHECK) {
    checkBuild();
}

if (settings.httpAdminRoot !== false && settings.httpAdminAuth) {
RED.log.warn(RED.log._("server.httpadminauth-deprecated"));
app.use(settings.httpAdminRoot, basicAuthMiddleware(settings.httpAdminAuth.user,settings.httpAdminAuth.pass));
}

if (settings.httpAdminRoot !== false) {
    
    app.use(settings.httpAdminRoot,api.adminApp);
}
if (settings.httpNodeRoot !== false && settings.httpNodeAuth) {
    app.use(settings.httpNodeRoot,basicAuthMiddleware(settings.httpNodeAuth.user,settings.httpNodeAuth.pass));
}

if (settings.httpStatic) {
    settings.httpStaticAuth = settings.httpStaticAuth || settings.httpAuth;
    if (settings.httpStaticAuth) {
        app.use("/",basicAuthMiddleware(settings.httpStaticAuth.user,settings.httpStaticAuth.pass));
    }
    app.use("/",express.static(settings.httpStatic));
}

if (settings.httpAdminRoot !== false || settings.httpNodeRoot !== false || settings.httpStatic) {
    server.on('error', function(err) {
        if (err.errno === "EADDRINUSE") {
            RED.log.error(RED.log._("server.unable-to-listen", {listenpath:settings.getListenPath()}));
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
        RED.log.info(RED.log._("server.now-running", {listenpath:settings.getListenPath()}));
    });
} else {
    RED.log.info(RED.log._("server.headless-mode"));
}
module.exports = server;
