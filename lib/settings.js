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

var fs = require("fs-extra");
var nopt = require("nopt");
var path = require("path");
var defaults = require('./admin_defaults');

var settingsFile;
var flowFile;

var knownOpts = {
    "settings":[path],
    "userDir":[path],
    "verbose": Boolean,
    "help": Boolean
};
var shortHands = {
    "v":["--verbose"],
    "s":["--settings"],
    "u":["--userDir"],
    "?":["--help"]
};

var desc = {
    "settings":" FILE  use specified settings file",
    "userDir" :" DIR   use specified user directory",
    "verbose" :"       enable verbose output",
    "help"    :"       show usage"
};
nopt.invalidHandler = function(k,v,t) {
    // TODO: console.log(k,v,t);
}

var parsedArgs = nopt(knownOpts,shortHands,process.argv,2)

if (parsedArgs.help) {
    console.log("Node-RED v"+(process.env.RED_VERSION||" UNKNOWN"));
    console.log("Usage: node-red [-v] [-?] [--settings settings.js] [--userDir DIR] [flows.json]");
    console.log("");
    console.log("Options:");
    
    for(var opt in knownOpts){
        var _ostring = {
            sh:"",
            lh:opt,
            pad:"\t",
            desc:(desc[opt]||"No Description")
        };
        for(var sh in shortHands){
            for(var oo=0;oo<shortHands[sh].length;oo++){
                if(shortHands[sh][oo].split("--")[1] === opt){
                    _ostring.sh = sh;
                }  
            }
        };
        
        console.log("-%s, --%s%s%s", _ostring.sh, _ostring.lh,_ostring.pad, _ostring.desc);
    }

    console.log("");
    console.log("Documentation can be found at http://nodered.org");
    process.exit();
}
if (parsedArgs.argv.remain.length > 0) {
    flowFile = parsedArgs.argv.remain[0];
}

if (parsedArgs.settings) {
    // User-specified settings file
    settingsFile = parsedArgs.settings;
} else if (parsedArgs.userDir && fs.existsSync(path.join(parsedArgs.userDir,"settings.js"))) {
    // User-specified userDir that contains a settings.js
    settingsFile = path.join(parsedArgs.userDir,"settings.js");
} else {
    if (fs.existsSync(path.join(process.env.NODE_RED_HOME,".config.json"))) {
        // NODE_RED_HOME contains user data - use its settings.js
        settingsFile = path.join(process.env.NODE_RED_HOME,"settings.js");
    } else {
        var userDir = path.join(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,".node-red");
        var userSettingsFile = path.join(userDir,"settings.js");
        if (fs.existsSync(userSettingsFile)) {
            // $HOME/.node-red/settings.js exists
            settingsFile = userSettingsFile;
        } else {
            var defaultSettings = path.join(process.env.PWD,"settings.js");
            var settingsStat = fs.statSync(defaultSettings);
            if (settingsStat.mtime.getTime() < settingsStat.ctime.getTime()) {
                // Default settings file has not been modified - safe to copy
                fs.copySync(defaultSettings,userSettingsFile);
                settingsFile = userSettingsFile;
            } else {
                // Use default settings.js as it has been modified
                settingsFile = defaultSettings;
            }
        }
    }
}

try {
    var settings = require(settingsFile);
    settings.settingsFile = settingsFile;
} catch(err) {
    console.log("Error loading settings file: "+settingsFile)
    if (err.code == 'MODULE_NOT_FOUND') {
        if (err.toString().indexOf(settingsFile) === -1) {
            console.log(err.toString());
        }
    } else {
        console.log(err);
    }
    process.exit();
}

if (parsedArgs.v) {
    settings.verbose = true;
}

function formatRoot(root) {
    if (root[0] != "/") {
        root = "/" + root;
    }
    if (root.slice(-1) != "/") {
        root = root + "/";
    }
    return root;
}

if (settings.httpRoot === false) {
    settings.httpAdminRoot = false;
    settings.httpNodeRoot = false;
} else {
    settings.httpRoot = settings.httpRoot||"/";
    settings.disableEditor = settings.disableEditor||false;
}

if (settings.httpAdminRoot !== false) {
    settings.httpAdminRoot = formatRoot(settings.httpAdminRoot || settings.httpRoot || "/");
    settings.httpAdminAuth = settings.httpAdminAuth || settings.httpAuth;
} else {
    settings.disableEditor = true;
}

if (settings.httpNodeRoot !== false) {
    settings.httpNodeRoot = formatRoot(settings.httpNodeRoot || settings.httpRoot || "/");
    settings.httpNodeAuth = settings.httpNodeAuth || settings.httpAuth;
}

settings.uiPort = settings.uiPort||defaults.uiPort;
settings.uiHost = settings.uiHost||defaults.uiHost;

if (flowFile) {
    settings.flowFile = flowFile;
}
if (parsedArgs.userDir) {
    settings.userDir = parsedArgs.userDir;
}

module.exports =  settings;