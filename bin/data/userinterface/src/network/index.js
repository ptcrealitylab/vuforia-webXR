/**
 * @preserve
 *
 *                                      .,,,;;,'''..
 *                                  .'','...     ..',,,.
 *                                .,,,,,,',,',;;:;,.  .,l,
 *                               .,',.     ...     ,;,   :l.
 *                              ':;.    .'.:do;;.    .c   ol;'.
 *       ';;'                   ;.;    ', .dkl';,    .c   :; .'.',::,,'''.
 *      ',,;;;,.                ; .,'     .'''.    .'.   .d;''.''''.
 *     .oxddl;::,,.             ',  .'''.   .... .'.   ,:;..
 *      .'cOX0OOkdoc.            .,'.   .. .....     'lc.
 *     .:;,,::co0XOko'              ....''..'.'''''''.
 *     .dxk0KKdc:cdOXKl............. .. ..,c....
 *      .',lxOOxl:'':xkl,',......'....    ,'.
 *           .';:oo:...                        .
 *                .cd,      ╔═╗┌┬┐┬┌┬┐┌─┐┬─┐    .
 *                  .l;     ║╣  │││ │ │ │├┬┘    '
 *                    'l.   ╚═╝─┴┘┴ ┴ └─┘┴└─   '.
 *                     .o.                   ...
 *                      .''''','.;:''.........
 *                           .'  .l
 *                          .:.   l'
 *                         .:.    .l.
 *                        .x:      :k;,.
 *                        cxlc;    cdc,,;;.
 *                       'l :..   .c  ,
 *                       o.
 *                      .,
 *
 *      ╦═╗┌─┐┌─┐┬  ┬┌┬┐┬ ┬  ╔═╗┌┬┐┬┌┬┐┌─┐┬─┐  ╔═╗┬─┐┌─┐ ┬┌─┐┌─┐┌┬┐
 *      ╠╦╝├┤ ├─┤│  │ │ └┬┘  ║╣  │││ │ │ │├┬┘  ╠═╝├┬┘│ │ │├┤ │   │
 *      ╩╚═└─┘┴ ┴┴─┘┴ ┴  ┴   ╚═╝─┴┘┴ ┴ └─┘┴└─  ╩  ┴└─└─┘└┘└─┘└─┘ ┴
 *
 *
 * Created by Valentin on 10/22/14.
 *
 * Copyright (c) 2015 Valentin Heun
 * Modified by Valentin Heun 2014, 2015, 2016, 2017
 * Modified by Benjamin Reynholds 2016, 2017
 * Modified by James Hobin 2016, 2017
 *
 * All ascii characters above must be included in any redistribution.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

createNameSpace("toolbox.network");

/**
 * @type {Array.<{messageName: string, callback: function}>}
 */
toolbox.network.postMessageHandlers = [];

/**
 * Creates an extendable method for other modules to register callbacks that will be triggered
 * from onInternalPostMessage events, without creating circular dependencies
 * @param {string} messageName
 * @param {function} callback
 */
toolbox.network.addPostMessageHandler = function(messageName, callback) {
    this.postMessageHandlers.push({
        messageName: messageName,
        callback: callback
    });
};

toolbox.network.getPort = function(object) {
    let serverPort = defaultHttpPort;
    if (object.hasOwnProperty("port")) {
        serverPort = object.port;
    }
    return serverPort;
};

toolbox.network.getPortByIp = function(ip) {
    let serverPort = defaultHttpPort;

    let thisObject = null;
    for(let key in objects){
        if(ip === objects[key].ip) {
            thisObject = objects[key];
            break;
        }
    }
    if(thisObject !== null) {
        if (thisObject.hasOwnProperty("port")) {
            serverPort = thisObject.port;
        }
    }
    return serverPort;
};

/**
 * Properly initialize all the temporary, editor-only state for an object when it first gets added
 * @param {string} objectKey
 */
toolbox.network.onNewObjectAdded = function(objectKey) {

    var thisObject = toolbox.getObject(objectKey);
    // this is a work around to set the state of an objects to not being visible.
    thisObject.screenZ = 1000;
    thisObject.fullScreen = false;
    thisObject.sendMatrix = false;
    thisObject.sendMatrices = {
        modelView : false,
        devicePose : false,
        groundPlane : false,
        allObjects : false
    };
    thisObject.sendScreenPosition = false;
    thisObject.integerVersion = parseInt(objects[objectKey].version.replace(/\./g, ""));

    if (typeof thisObject.matrix === 'undefined') {
        thisObject.matrix = [];
    }
    
    toolbox.gui.ar.sceneGraph.addObject(objectKey, thisObject.matrix, true);

    for (let frameKey in objects[objectKey].frames) {
        var thisFrame = toolbox.getFrame(objectKey, frameKey);

        thisFrame.screenZ = 1000;
        thisFrame.fullScreen = false;
        thisFrame.sendMatrix = false;
        thisFrame.sendMatrices = {
            modelView : false,
            devicePose : false,
            groundPlane : false,
            allObjects : false
        };
        thisFrame.sendScreenPosition = false;
        thisFrame.integerVersion = parseInt(objects[objectKey].version.replace(/\./g, ""));
        thisFrame.visible = false;
        thisFrame.objectId = objectKey;

        if (typeof thisFrame.developer === 'undefined') {
            thisFrame.developer = true;
        }

        var positionData = thisFrame.ar;

        if (positionData.matrix === null || typeof positionData.matrix !== "object") {
            positionData.matrix = [];
        }

        toolbox.gui.ar.sceneGraph.addFrame(objectKey, frameKey, positionData.matrix);
    }

    if (!thisObject.protocol) {
        thisObject.protocol = "R0";
    }

    objects[objectKey].uuid = objectKey;

    for (let frameKey in objects[objectKey].frames) {
        objects[objectKey].frames[frameKey].uuid = frameKey;
        for (let nodeKey in objects[objectKey].frames[frameKey].nodes) {
            objects[objectKey].frames[frameKey].nodes[nodeKey].uuid = nodeKey;
        }

        for (let linkKey in objects[objectKey].frames[frameKey].links) {
            objects[objectKey].frames[frameKey].links[linkKey].uuid = linkKey;
        }
    }
};

/**
 * Gets triggered when an iframe makes a POST request to communicate with the Reality Editor via the object.js API
 * Also gets triggered when the settings.html (or other menus) makes a POST request
 * Modules can subscribe to these events by using toolbox.network.addPostMessageHandler, in addition to the many
 * events already hard-coded into this method (todo: better organize these and move/distribute to the related modules)
 * @param {object|string} e - stringified or parsed event (works for either format)
 */
toolbox.network.onInternalPostMessage = function (e) {
    var msgContent = {};

    // catch error when safari sends a misc event
    if (typeof e === 'object' && typeof e.data === 'object') {
        msgContent = e.data;

    } else if (e.data && typeof e.data !== 'object') {
        msgContent = JSON.parse(e.data);
    } else {
        msgContent = JSON.parse(e);
    }

    // iterates over all registered postMessageHandlers to trigger events in various modules
    this.postMessageHandlers.forEach(function(messageHandler) {
        if (typeof msgContent[messageHandler.messageName] !== 'undefined') {
            messageHandler.callback(msgContent[messageHandler.messageName], msgContent);
        }
    });

    var tempThisObject = {};
    var thisVersionNumber = msgContent.version || 0; // defaults to 0 if no version included

    if (thisVersionNumber >= 170) {
        if ((!msgContent.object) || (!msgContent.object)) return; // TODO: is this a typo? checks identical condition twice
    } else {
        if ((!msgContent.obj) || (!msgContent.pos)) return;
        msgContent.object = msgContent.obj;
        msgContent.frame = msgContent.obj;
        msgContent.node = msgContent.pos;
    }
    
    if (msgContent.node) {
        tempThisObject = toolbox.getNode(msgContent.object, msgContent.frame, msgContent.node);
    } else if (msgContent.frame) {
        tempThisObject = toolbox.getFrame(msgContent.object, msgContent.frame);
    } else if (msgContent.object) {
        tempThisObject = toolbox.getObject(msgContent.object);
    }

    tempThisObject = tempThisObject || {};

    if (msgContent.width && msgContent.height) {
        let activeKey = msgContent.node ? msgContent.node : msgContent.frame;

        var iFrame = document.getElementById('iframe' + activeKey);

        var top = ((globalStates.width - msgContent.height) / 2);
        var left = ((globalStates.height - msgContent.width) / 2);

        iFrame.style.width = msgContent.width;
        iFrame.style.height = msgContent.height;
        iFrame.style.top = top;
        iFrame.style.left = left;
    }

    if (msgContent.sendMatrix === true) {
        if (tempThisObject.integerVersion >= 32) {
            tempThisObject.sendMatrix = true;
            let activeKey = msgContent.node ? msgContent.node : msgContent.frame;
            if (activeKey === msgContent.frame) { // only send these into frames, not nodes
                // send the projection matrix into the iframe (e.g. for three.js to use)
                globalDOMCache["iframe" + activeKey].contentWindow.postMessage(
                    '{"projectionMatrix":' + JSON.stringify(globalStates.realProjectionMatrix) + "}", '*');
            }
        }
    }

    if (typeof msgContent.sendMatrices !== "undefined") {
        if (msgContent.sendMatrices.groundPlane === true) {
            if (tempThisObject.integerVersion >= 32) {
                if(!tempThisObject.sendMatrices) tempThisObject.sendMatrices = {};
                tempThisObject.sendMatrices.groundPlane = true;
                let activeKey = msgContent.node ? msgContent.node : msgContent.frame;
                if (activeKey === msgContent.frame) {
                    globalDOMCache["iframe" + activeKey].contentWindow.postMessage(
                        '{"projectionMatrix":' + JSON.stringify(globalStates.realProjectionMatrix) + "}", '*');
                }
            }
        }
        if (msgContent.sendMatrices.devicePose === true) {
            if (tempThisObject.integerVersion >= 32) {
                if(!tempThisObject.sendMatrices) tempThisObject.sendMatrices = {};
                tempThisObject.sendMatrices.devicePose = true;
                let activeKey = msgContent.node ? msgContent.node : msgContent.frame;
                if (activeKey === msgContent.frame) {
                    // send the projection matrix into the iframe (e.g. for three.js to use)
                    globalDOMCache["iframe" + activeKey].contentWindow.postMessage(
                        '{"projectionMatrix":' + JSON.stringify(globalStates.realProjectionMatrix) + "}", '*');
                }
            }
        }
        if (msgContent.sendMatrices.allObjects === true) {
            if (tempThisObject.integerVersion >= 32) {
                if(!tempThisObject.sendMatrices) tempThisObject.sendMatrices = {};
                tempThisObject.sendMatrices.allObjects = true;
                let activeKey = msgContent.node ? msgContent.node : msgContent.frame;
                if (activeKey === msgContent.frame) {
                    // send the projection matrix into the iframe (e.g. for three.js to use)
                    globalDOMCache["iframe" + activeKey].contentWindow.postMessage(
                        '{"projectionMatrix":' + JSON.stringify(globalStates.realProjectionMatrix) + "}", '*');
                }
            }
        }
    }

    if (msgContent.sendScreenPosition === true) {
        if (tempThisObject.integerVersion >= 32) {
            tempThisObject.sendScreenPosition = true;
        }
    }

    if (msgContent.globalMessage) {
        var iframes = document.getElementsByTagName('iframe');
        for (let i = 0; i < iframes.length; i++) {

            if (iframes[i].id !== "iframe" + msgContent.node && iframes[i].style.visibility !== "hidden") {
                var objectKey = iframes[i].getAttribute("data-object-key");
                if (objectKey) {
                    var receivingObject = objects[objectKey];
                    if (receivingObject.integerVersion >= 32) {
                        var msg = {};
                        if (receivingObject.integerVersion >= 170) {
                            msg = {globalMessage: msgContent.globalMessage};
                        } else {
                            msg = {ohGlobalMessage: msgContent.ohGlobalMessage};
                        }
                        iframes[i].contentWindow.postMessage(JSON.stringify(msg), "*");
                    }
                }
            }
        }
    }

    if (msgContent.sendMessageToFrame) {
        var iframe = globalDOMCache['iframe' + msgContent.sendMessageToFrame.destinationFrame];
        if (iframe) {
            iframe.contentWindow.postMessage(JSON.stringify(msgContent), '*');
        }
    }

    if (typeof msgContent.fullScreen === "boolean") {
        if (msgContent.fullScreen === true) {

            tempThisObject.fullScreen = true;
            console.log("fullscreen: " + tempThisObject.fullScreen);

            let zIndex = tempThisObject.fullscreenZPosition || -5000; // defaults to background

            document.getElementById("object" + msgContent.frame).style.transform =
                'matrix3d(1, 0, 0, 0,' +
                '0, 1, 0, 0,' +
                '0, 0, 1, 0,' +
                '0, 0, ' + zIndex + ', 1)';

            globalDOMCache['iframe' + tempThisObject.uuid].dataset.leftBeforeFullscreen = globalDOMCache['iframe' + tempThisObject.uuid].style.left;
            globalDOMCache['iframe' + tempThisObject.uuid].dataset.topBeforeFullscreen = globalDOMCache['iframe' + tempThisObject.uuid].style.top;

            globalDOMCache['iframe' + tempThisObject.uuid].style.left = '0';
            globalDOMCache['iframe' + tempThisObject.uuid].style.top = '0';
            globalDOMCache['iframe' + tempThisObject.uuid].style.margin = '-2px';

            globalDOMCache['iframe' + tempThisObject.uuid].classList.add('webGlFrame');

        }
        if (msgContent.fullScreen === false) {
            if (!msgContent.node) { // ignore messages from nodes of this frame

                tempThisObject.fullScreen = false;
                console.log("remove fullscreen: " + tempThisObject.fullScreen);

                // reset left/top offset when returns to non-fullscreen
                if (globalDOMCache['iframe' + tempThisObject.uuid].dataset.leftBeforeFullscreen) {
                    globalDOMCache['iframe' + tempThisObject.uuid].style.left = globalDOMCache['iframe' + tempThisObject.uuid].dataset.leftBeforeFullscreen;
                }
                if (globalDOMCache['iframe' + tempThisObject.uuid].dataset.topBeforeFullscreen) {
                    globalDOMCache['iframe' + tempThisObject.uuid].style.top = globalDOMCache['iframe' + tempThisObject.uuid].dataset.topBeforeFullscreen;
                }

                globalDOMCache['iframe' + tempThisObject.uuid].classList.remove('webGlFrame');
            }
        }

    } else if(typeof msgContent.fullScreen === "string") {
        if (msgContent.fullScreen === "sticky") {

            tempThisObject.fullScreen = "sticky";
            console.log("sticky fullscreen: " + tempThisObject.fullScreen);

            let zIndex = tempThisObject.fullscreenZPosition || -5000; // defaults to background

            if (typeof msgContent.fullScreenAnimated !== 'undefined') {

                // create a duplicate, temporary DOM element in the same place as the frame
                var envelopeAnimationDiv = document.createElement('div');
                envelopeAnimationDiv.classList.add('main');
                envelopeAnimationDiv.classList.add('envelopeAnimationDiv');
                envelopeAnimationDiv.classList.add('ignorePointerEvents');
                envelopeAnimationDiv.style.width = globalDOMCache['object' + msgContent.frame].style.width;
                envelopeAnimationDiv.style.height = globalDOMCache['object' + msgContent.frame].style.height;
                envelopeAnimationDiv.style.transform = globalDOMCache['object' + msgContent.frame].style.transform; // start with same transform as the iframe
                document.getElementById('GUI').appendChild(envelopeAnimationDiv);

                // wait a small delay so the transition CSS property applies
                envelopeAnimationDiv.classList.add('animateAllProperties250ms');
                setTimeout(function() {
                    // give it a hard-coded MVP matrix that makes it fill the screen
                    envelopeAnimationDiv.style.transform = "matrix3d(284.7391935492032, 3.070340532377773, 0.0038200291675306924, 0.003834921258919453, -3.141247565648438, 284.35804025980104, 0.011905637861498192, 0.011900616291666024, 20.568534190244556, 9.715687705148639, -0.6879540871592961, -0.6869158438452686, -1268.420885449479, 86.38923398120664, 100200, 260.67004803237324)";
                    envelopeAnimationDiv.style.opacity = 0;
                    setTimeout(function() {
                        envelopeAnimationDiv.parentElement.removeChild(envelopeAnimationDiv);
                    }, 250);
                }, 10);
            }

            // make the div invisible while it switches to fullscreen mode, so we don't see a jump in content vs mode
            document.getElementById("object" + msgContent.frame).classList.add('transitioningToFullscreen');
            setTimeout(function() {
                document.getElementById("object" + msgContent.frame).classList.remove('transitioningToFullscreen');
            }, 200);

            document.getElementById("object" + msgContent.frame).style.transform =
                'matrix3d(1, 0, 0, 0,' +
                '0, 1, 0, 0,' +
                '0, 0, 1, 0,' +
                '0, 0, ' + zIndex + ', 1)';

            
            globalDOMCache['iframe' + tempThisObject.uuid].dataset.leftBeforeFullscreen = globalDOMCache['iframe' + tempThisObject.uuid].style.left;
            globalDOMCache['iframe' + tempThisObject.uuid].dataset.topBeforeFullscreen = globalDOMCache['iframe' + tempThisObject.uuid].style.top;

            globalDOMCache['iframe' + tempThisObject.uuid].style.left = '0';
            globalDOMCache['iframe' + tempThisObject.uuid].style.top = '0';
            globalDOMCache['iframe' + tempThisObject.uuid].style.margin = '-2px';

            globalDOMCache['iframe' + tempThisObject.uuid].classList.add('webGlFrame');

            // update containsStickyFrame property on object whenever this changes, so that we dont have to recompute every frame
            let object = toolbox.getObject(msgContent.object);
            if (object) {
                object.containsStickyFrame = true;
            }
        }
    }

    if(typeof msgContent.stickiness === "boolean") {
        tempThisObject.stickiness = msgContent.stickiness;
    }

    if (typeof msgContent.ignoreAllTouches !== "undefined") {
        let frame = toolbox.getFrame(msgContent.object, msgContent.frame);
        frame.ignoreAllTouches = msgContent.ignoreAllTouches;
    }

    if (typeof msgContent.getScreenDimensions !== "undefined") {
        globalDOMCache["iframe" + msgContent.frame].contentWindow.postMessage(JSON.stringify({
            screenDimensions: {
                width: globalStates.height,
                height: globalStates.width
            }
        }), '*');
    }

    // adjusts the iframe and touch overlay size based on a message from the iframe about the size of its contents changing
    if (typeof msgContent.changeFrameSize !== 'undefined') {
        let width = msgContent.changeFrameSize.width;
        let height = msgContent.changeFrameSize.height;

        let iFrame = document.getElementById('iframe' + msgContent.frame);

        iFrame.style.width = width + 'px';
        iFrame.style.height = height + 'px';
    }
};


/**
 * Gets set as the "onload" function of each frame/node iframe element.
 * When the iframe contents finish loading, update some local state that depends on its size, and
 * post a message into the frame with data including its object/frame/node keys, the GUI state, etc
 * @param objectKey
 * @param frameKey
 * @param nodeKey
 */
toolbox.network.onElementLoad = function (objectKey, frameKey, nodeKey) {

    if (nodeKey === "null") nodeKey = null;

    var object = toolbox.getObject(objectKey);
    
    var newStyle = {
        object: objectKey,
        frame: frameKey,
        objectData: {},
        node: nodeKey,
        nodes: {},
        port: toolbox.network.getPort(object),
    };

    if (object && object.ip) {
        newStyle.objectData = {
            ip: object.ip,
            port: toolbox.network.getPort(object)
        };
    }
    let activeKey = nodeKey || frameKey;
    
    globalDOMCache["iframe" + activeKey].contentWindow.postMessage(JSON.stringify(newStyle), '*');

    console.log('onElementLoad happened');
};

/**
 * Helper function to locate the iframe element associated with a certain frame, and post a message into it
 * @param {string} frameKey
 * @param {object} message - JSON data to send into the frame
 */
toolbox.network.postMessageIntoFrame = function(frameKey, message) {
    var frame = document.getElementById('iframe' + frameKey);
    if (frame) {
        frame.contentWindow.postMessage(JSON.stringify(message), "*");
    }
};
