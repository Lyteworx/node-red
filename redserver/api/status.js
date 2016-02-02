/**
 * Copyright 2014, 2015 IBM Corp.
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

var log;
var redNodes;
var settings;

module.exports = {
    init: function(runtime) {
        settings = runtime.settings;
        redNodes = runtime.nodes;
        log = runtime.log;
    },
    get: function(req,res) {
        var status = {
            ports:[]
        };
        if(1){
            var handles = process._getActiveHandles();
            
            handles.forEach(function(handle){
                if(handle.constructor.name === "Server"){
                    status.ports.push(handle.address().port);
                }
            });
            res.json(status);
        } else {
            log.audit({event: "flow.get",id:id,error:"not_found"},req);
            res.status(404).end();
        }
    },
    post: function(req,res) {
      

    },
    put: function(req,res) {
      
    },
    delete: function(req,res) {
     
    }
}
