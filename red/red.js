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

var path = require('path');
var runtime = require("./runtime");

process.env.NODE_RED_HOME = process.env.NODE_RED_HOME || path.resolve(__dirname+"/..");

var nodeApp = null;
var apiEnabled = false;

module.exports = {
    init: function(userSettings) {
        
        //Check for Settings
        if (!userSettings) {
          var e = new Error("SETTINGS NOT DEFINED");
          e.code = "no_settings";
          e.stack = e.stack.split("at")[0];
          throw e;
        }

        //Check for core nodes directory
        if (!userSettings.coreNodesDir) {
            userSettings.coreNodesDir = path.resolve(path.join(__dirname,"..","nodes"));
        }

        runtime.init(userSettings);

        return;
    },
    start: function() {
        return runtime.start();
    },
    stop: function() {
        return runtime.stop();
    },
    nodes: runtime.nodes,
    log: runtime.log,
    settings:runtime.settings,
    util: runtime.util,
    version: runtime.version,
    events: runtime.events,

    get app() { console.log("Deprecated use of RED.app - use RED.httpAdmin instead"); return runtime.app },
    get httpNode() { return runtime.adminApi.nodeApp },

};
