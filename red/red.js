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


var cluster = require('cluster');
var path = require('path');
var runtime = require("./runtime");
var api = require("./api");
var checkBuild = require("./lib/check_build");

process.env.NODE_RED_HOME = process.env.NODE_RED_HOME || path.resolve(__dirname+"/..");

var nodeApp = null;
var adminApp = null;
var server = null;
var apiEnabled = false;

module.exports = {
    init: function(httpServer,userSettings) {
      
        
        //Check for Settings
        if (!userSettings) {
          var e = new Error("SETTINGS NOT DEFINED");
          e.code = "no_settings";
          e.stack = e.stack.split("at")[0];
          throw e;
        }

        //Check for built client .js file
        if (!userSettings.SKIP_BUILD_CHECK) {
            checkBuild();
        }

        //Check for core nodes directory
        if (!userSettings.coreNodesDir) {
            userSettings.coreNodesDir = path.resolve(path.join(__dirname,"..","nodes"));
        }

        //Check for admin interface root path, http in root path.  
        //Enable API if either is not false, not sure why httpNodeRoot, path issue?
        //TJ_TODO: take this out when removing default http in capability
         
        if (userSettings.httpAdminRoot !== false || userSettings.httpNodeRoot !== false) {
            runtime.init(userSettings,api);
            api.init(httpServer,runtime);
            apiEnabled = true;
        } else {
            runtime.init(userSettings);
            apiEnabled = false;
        }
        
        return;
    },
    start: function() {
        return runtime.start().then(function() {
            if (apiEnabled) {
                return api.start();
            }
        });
    },
    stop: function() {
        return runtime.stop().then(function() {
            if (apiEnabled) {
                return api.stop();
            }
        })
    },
    nodes: runtime.nodes,
    log: runtime.log,
    settings:runtime.settings,
    util: runtime.util,
    version: runtime.version,
    events: runtime.events,
    
    comms: api.comms,
    library: api.library,
    auth: api.auth,

    get app() { console.log("Deprecated use of RED.app - use RED.httpAdmin instead"); return runtime.app },
    get httpAdmin() { return runtime.adminApi.adminApp },
    get httpNode() { return runtime.adminApi.nodeApp },
    get server() { return runtime.adminApi.server }
};
