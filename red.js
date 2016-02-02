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

var util = require("util");
var crypto = require("crypto");
try { bcrypt = require('bcrypt'); }
catch(e) { bcrypt = require('bcryptjs'); }
var path = require("path");
var fs = require("fs-extra");
var RED = require("./red/red.js");

process.env.RED_VERSION = RED.version();

var settings = require('./lib/settings');
var server = require('./redserver');


try {

    RED.init(settings);
    
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

RED.start().then(function() {
  

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
