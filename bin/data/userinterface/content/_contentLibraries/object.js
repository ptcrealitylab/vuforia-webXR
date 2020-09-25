(function(exports) {

    /* eslint no-inner-declarations: "off" */
    // makes sure this only gets loaded once per iframe
    if (typeof exports.spatialObject !== 'undefined') {
        return;
    }

    // Keeps track of all state related to this frame and its API interactions
    var spatialObject = {
        alreadyLoaded: false,
        node: '',
        frame: '',
        object: '',
        publicData: {},
        modelViewMatrix: [],
        serverIp: '127.0.0,1',
        matrices: {
            modelView: [],
            projection: [],
            groundPlane: [],
            devicePose: [],
            allObjects: {}
        },
        projectionMatrix: [],
        visibility: 'visible',
        sendMatrix: false,
        sendMatrices: {
            modelView: false,
            devicePose: false,
            groundPlane: false,
            allObjects: false
        },
        sendScreenPosition: false,
        sendFullScreen: false,
        sendScreenObject: false,
        fullscreenZPosition: 0,
        sendSticky: false,
        isFullScreenExclusive: false,
        height: '100%',
        width: '100%',
        style: document.createElement('style'),
        messageCallBacks: {},
        interface: 'gui',
        version: 170,
        visibilityDistance: 2.0,
        customInteractionMode: false, // this is how frames used to respond to touches. change to true and add class realityInteraction to certain divs to make only some divs interactable
        invertedInteractionMode: false, // if true, inverts the behavior of customInteractionMode. divs with realityInteraction are the only ones that can move the frame, all others are interactable
        eventObject: {
            version: null,
            object: null,
            frame: null,
            node: null,
            x: 0,
            y: 0,
            type: null},
        touchDecider: null,
        touchDeciderRegistered: false,
        ignoreAllTouches: false,
        // onFullScreenEjected: null,
        onload: null
    };
    
    // adding css styles nessasary for acurate 3D transformations.
    spatialObject.style.type = 'text/css';
    spatialObject.style.innerHTML = '* {-webkit-user-select: none; -webkit-touch-callout: none;} body, html{ height: 100%; margin:0; padding:0; overflow: hidden;}';
    document.getElementsByTagName('head')[0].appendChild(spatialObject.style);

    // this will be initialized once the frame creates a new SpatialInterface()
    var realityInterface = null;

    /**
     * Triggers all messageCallbacks functions.
     * spatialObject.messageCallBacks.mainCall is the primary function always triggered by this, but additional
     * messageCallbacks are added by calling the methods in realityInterface.injectMessageListenerAPI
     */
    window.addEventListener('message', function (MSG) {
        if (!MSG.data) { return; }
        if (typeof MSG.data !== 'string') { return; }
        var msgContent = JSON.parse(MSG.data);
        for (var key in spatialObject.messageCallBacks) {
            spatialObject.messageCallBacks[key](msgContent);
        }
    }, false);

    /**
     * Helper function that posts entire basic state of spatialObject to parent
     */
    function postAllDataToParent() {
        console.log('check: ' + spatialObject.frame + ' fullscreen = ' + spatialObject.sendFullScreen);

        if (typeof spatialObject.node !== 'undefined' || typeof spatialObject.frame !== 'undefined') {
            parent.postMessage(JSON.stringify(
                {
                    version: spatialObject.version,
                    node: spatialObject.node,
                    frame: spatialObject.frame,
                    object: spatialObject.object,
                    height: spatialObject.height,
                    width: spatialObject.width,
                    sendMatrix: spatialObject.sendMatrix,
                    sendMatrices: spatialObject.sendMatrices,
                    sendScreenPosition: spatialObject.sendScreenPosition,
                    fullScreen: spatialObject.sendFullScreen,
                    fullscreenZPosition: spatialObject.fullscreenZPosition,
                    stickiness: spatialObject.sendSticky,
                    sendScreenObject: spatialObject.sendScreenObject
                }), '*');  // this needs to contain the final interface source
        }
    }

    /**
     * Helper function that posts object/frame/node/version to parent along with whatever custom properties you want to send
     * @param {object} additionalProperties - JSON object containing any additional key/value pairs to send
     */
    function postDataToParent(additionalProperties) {
        if (typeof spatialObject.node !== 'undefined' || typeof spatialObject.frame !== 'undefined') {
            var dataToSend = {
                version: spatialObject.version,
                node: spatialObject.node,
                frame: spatialObject.frame,
                object: spatialObject.object
            };
            if (additionalProperties) {
                for (var key in additionalProperties) {
                    dataToSend[key] = additionalProperties[key];
                }
            }
            parent.postMessage(JSON.stringify(dataToSend), '*');
        }
    }

    /**
     * receives POST messages from parent to change spatialObject state
     * @param {object} msgContent - JSON contents received by the iframe's contentWindow.postMessage listener
     */
    spatialObject.messageCallBacks.mainCall = function (msgContent) {

        if (typeof msgContent.sendMessageToFrame !== 'undefined') {
            return; // TODO: fix this bug in a cleaner way (github issue #17)
        }
        
        // initialize spatialObject for frames and add additional API methods
        if (typeof msgContent.node !== 'undefined') {

            if (!spatialObject.alreadyLoaded) {

                if (spatialObject.sendFullScreen === false) {
                    spatialObject.height = document.body.scrollHeight;
                    spatialObject.width = document.body.scrollWidth;
                }

                spatialObject.node = msgContent.node;
                spatialObject.frame = msgContent.frame;
                spatialObject.object = msgContent.object;

                // Post the default state of this frame to the parent application
                postAllDataToParent();

                if (realityInterface) {
                    // adds the API methods not reliant on the socket.io connection
                    realityInterface.injectAllNonSocketAPIs();
                }

                // triggers the onRealityInterfaceLoaded function
                if (spatialObject.onload) {
                    spatialObject.onload();
                    spatialObject.onload = null;
                }
            }

            if (spatialObject.sendScreenObject) {
                if (realityInterface) {
                    realityInterface.activateScreenObject(); // make sure it gets sent with updated object,frame,node
                }
            }

            spatialObject.alreadyLoaded = true;

            // initialize spatialObject for logic block settings menus, which declare a new RealityLogic()
        } else if (typeof msgContent.logic !== 'undefined') {

            parent.postMessage(JSON.stringify(
                {
                    version: spatialObject.version,
                    block: msgContent.block,
                    logic: msgContent.logic,
                    frame: msgContent.frame,
                    object: msgContent.object,
                    publicData: msgContent.publicData
                }
            )
            // this needs to contain the final interface source
            , '*');

            spatialObject.block = msgContent.block;
            spatialObject.logic = msgContent.logic;
            spatialObject.frame = msgContent.frame;
            spatialObject.object = msgContent.object;
            spatialObject.publicData = msgContent.publicData;

            if (spatialObject.sendScreenObject) {
                if (realityInterface) {
                    realityInterface.activateScreenObject(); // make sure it gets sent with updated object,frame,node
                }
            }
        }

        // Add some additional message listeners which keep the spatialObject updated with application state
        // TODO: should these only be added when specific message listeners have been registered via the API?

        if (typeof msgContent.modelViewMatrix !== 'undefined') {
            spatialObject.modelViewMatrix = msgContent.modelViewMatrix;
            spatialObject.matrices.modelView = msgContent.modelViewMatrix;
        }

        if (typeof msgContent.projectionMatrix !== 'undefined') {
            spatialObject.projectionMatrix = msgContent.projectionMatrix;
            spatialObject.matrices.projection = msgContent.projectionMatrix;
        }

        if (typeof msgContent.allObjects !== 'undefined') {
            spatialObject.matrices.allObjects = msgContent.allObjects;
        }

        if (typeof msgContent.devicePose !== 'undefined') {
            spatialObject.matrices.devicePose = msgContent.devicePose;
        }

        if (typeof msgContent.groundPlaneMatrix !== 'undefined') {
            spatialObject.matrices.groundPlane = msgContent.groundPlaneMatrix;
        }

        // receives visibility state (changes when guiState changes or frame gets unloaded due to outside of view)
        if (typeof msgContent.visibility !== 'undefined') {
            spatialObject.visibility = msgContent.visibility;

            // reload public data when it becomes visible
            if (realityInterface && spatialObject.ioObject) {
                realityInterface.reloadPublicData();
            }

            // ensure sticky fullscreen state gets sent to parent when it becomes visible
            if (spatialObject.visibility === 'visible') {
                if (typeof spatialObject.node !== 'undefined') {
                    if (spatialObject.sendSticky) {
                        // postAllDataToParent();
                        postDataToParent({
                            fullScreen: spatialObject.sendFullScreen,
                            fullscreenZPosition: spatialObject.fullscreenZPosition,
                            stickiness: spatialObject.sendSticky
                        });
                    }
                }
            }
        }

        // receives the guiState / "mode" that the app is in, e.g. ui, node, logic, etc...
        if (typeof msgContent.interface !== 'undefined') {
            spatialObject.interface = msgContent.interface;
        }

        // can be triggered by real-time system to refresh public data when editor received a message from another client
        if (typeof msgContent.reloadPublicData !== 'undefined') {
            realityInterface.reloadPublicData();
        }

        // handle synthetic touch events and pass them into the page contents
        if (typeof msgContent.event !== 'undefined' && typeof msgContent.event.pointerId !== 'undefined') {

            // eventData looks like {type: "pointerdown", pointerId: 29887780, pointerType: "touch", x: 334, y: 213}
            var eventData = msgContent.event;

            var event = new PointerEvent(eventData.type, {
                view: window,
                bubbles: true,
                cancelable: true,
                pointerId: eventData.pointerId,
                pointerType: eventData.pointerType,
                x: eventData.x,
                y: eventData.y,
                clientX: eventData.x,
                clientY: eventData.y,
                pageX: eventData.x,
                pageY: eventData.y,
                screenX: eventData.x,
                screenY: eventData.y
            });

            // send unacceptedTouch message if this interface wants touches to pass through it
            if (spatialObject.touchDeciderRegistered && eventData.type === 'pointerdown') {
                var touchAccepted = spatialObject.touchDecider(eventData);
                if (!touchAccepted) {
                    // console.log('didn\'t touch anything acceptable... propagate to next frame (if any)');
                    postDataToParent({
                        unacceptedTouch: eventData
                    });
                    return;
                }
            }

            // if it wasn't unaccepted, dispatch a touch event into the page contents
            var elt = document.elementFromPoint(eventData.x, eventData.y) || document.body;

            function forElementAndParentsRecursively(elt, callback) {
                callback(elt);
                if (elt.parentNode && elt.parentNode.tagName !== 'HTML' && elt.parentNode !== document) {
                    forElementAndParentsRecursively(elt.parentNode, callback);
                }
            }

            function elementOrRecursiveParentIsOfClass(element, className) {
                var foundClassOnAnyElement = false;
                forElementAndParentsRecursively(element, function(thatElement) {
                    if (thatElement.classList.contains(className)) {
                        foundClassOnAnyElement = true;
                    }
                });
                return foundClassOnAnyElement;
            }

            // see if it is a realityInteraction div
            if (eventData.type === 'pointerdown') {
                if (spatialObject.customInteractionMode) {

                    if (!spatialObject.invertedInteractionMode) {

                        if (elementOrRecursiveParentIsOfClass(elt, 'realityInteraction')) {
                            // if (elt.classList.contains('realityInteraction')) {
                            elt.dispatchEvent(event);

                            postDataToParent({
                                pointerDownResult: 'interaction'
                            });
                        } else {
                            postDataToParent({
                                pointerDownResult: 'nonInteraction'
                            });
                        }

                    } else {

                        // do the opposite for each condition
                        if (elementOrRecursiveParentIsOfClass(elt, 'realityInteraction')) {
                            postDataToParent({
                                pointerDownResult: 'nonInteraction'
                            });
                        } else {
                            elt.dispatchEvent(event);

                            postDataToParent({
                                pointerDownResult: 'interaction'
                            });
                        }

                    }



                } else {
                    elt.dispatchEvent(event);
                }

            } else {
                elt.dispatchEvent(event);
            }


            // send acceptedTouch message to stop the touch propagation
            if (eventData.type === 'pointerdown') {
                postDataToParent({
                    acceptedTouch: eventData
                });
            }
        }

    };

    /**
     * Defines the SpatialInterface object
     * A reality interface provides a Post Message API, and several other APIs
     * All supported methods are listed in this constructor, but the implementation of most methods are separated
     * into each category (socket, post message, listener, etc) in subsequent SpatialInterface "inject__API" functions
     * @constructor
     */
    function SpatialInterface() {
        this.publicData = spatialObject.publicData;
        this.pendingSends = [];

        var self = this;

        /**
         * Adds an onload callback that will wait until this SpatialInterfaces receives its object/frame data
         * @param {function} callback
         */
        this.onRealityInterfaceLoaded = function(callback) {
            if (spatialObject.object && spatialObject.frame) {
                callback();
            } else {
                spatialObject.onload = callback;
            }
        };

        this.onSpatialInterfaceLoaded = this.onRealityInterfaceLoaded;

        if (spatialObject.object) {
            // Adds the additional API functions that aren't dependent on the socket
            this.injectAllNonSocketAPIs();
        } else {
            /**
             * If you call a Post Message API function before that API has been initialized, it will get queued up as a stub
             * and executed as soon as that API is fully loaded
             * @param {string} name - the name of the function that should be called
             * @return {Function}
             */
            function makeSendStub(name) {
                return function() {
                    self.pendingSends.push({name: name, args: arguments});
                };
            }

            /**
             * Post Message APIs
             */
            this.sendGlobalMessage = makeSendStub('sendGlobalMessage');
            this.sendMessageToFrame = makeSendStub('sendMessageToFrame');
            this.sendMessageToTool = makeSendStub('sendMessageToTool');
            this.subscribeToMatrix = makeSendStub('subscribeToMatrix');
            this.subscribeToScreenPosition = makeSendStub('subscribeToScreenPosition');
            this.subscribeToDevicePoseMatrix = makeSendStub('subscribeToDevicePoseMatrix');
            this.subscribeToAllMatrices = makeSendStub('subscribeToAllMatrices');
            this.subscribeToGroundPlaneMatrix = makeSendStub('subscribeToGroundPlaneMatrix');
            this.setFullScreenOn = makeSendStub('setFullScreenOn');
            this.setFullScreenOff = makeSendStub('setFullScreenOff');
            this.setStickyFullScreenOn = makeSendStub('setStickyFullScreenOn');
            this.setStickinessOff = makeSendStub('setStickinessOff');
            this.ignoreAllTouches = makeSendStub('ignoreAllTouches');
            this.changeFrameSize = makeSendStub('changeFrameSize');
            this.changeToolSize = makeSendStub('changeToolSize');

            /**
             * Message Listener APIs
             */
            this.addGlobalMessageListener = makeSendStub('addGlobalMessageListener');
            this.addFrameMessageListener = makeSendStub('addFrameMessageListener');
            this.addToolMessageListener = makeSendStub('addToolMessageListener');
            this.addMatrixListener = makeSendStub('addMatrixListener');
            this.addAllObjectMatricesListener = makeSendStub('addAllObjectMatricesListener');
            this.addDevicePoseMatrixListener = makeSendStub('addGroundPlaneMatrixListener');
            this.addScreenPositionListener = makeSendStub('addScreenPositionListener');
            this.cancelScreenPositionListener = makeSendStub('cancelScreenPositionListener');

            /**
             * Setter/Getter APIs
             */
            this.registerTouchDecider = makeSendStub('registerTouchDecider');
            this.unregisterTouchDecider = makeSendStub('unregisterTouchDecider');
        }

        realityInterface = this;
    }

    SpatialInterface.prototype.injectAllNonSocketAPIs = function() {
        // Adds the API functions that allow a frame to post messages to its parent (e.g. setFullScreenOn and subscribeToMatrix)
        this.injectPostMessageAPI();

        // Adds the API functions that allow a frame to add message listeners (e.g. addGlobalMessageListener and addMatrixListener)
        this.injectMessageListenerAPI();

        // Adds the API functions that only change or retrieve values from spatialObject (e.g. getVisibility and registerTouchDecider)
        this.injectSetterGetterAPI();

        for (var i = 0; i < this.pendingSends.length; i++) {
            var pendingSend = this.pendingSends[i];
            this[pendingSend.name].apply(this, pendingSend.args);
        }
        this.pendingSends = [];

        // console.log('All non-socket APIs are loaded and injected into the object.js API');
    };

    SpatialInterface.prototype.injectPostMessageAPI = function() {
        this.sendGlobalMessage = function (ohMSG) {
            postDataToParent({
                globalMessage: ohMSG
            });
        };

        this.sendMessageToFrame = function (frameUuid, msgContent) {
            // console.log(spatialObject.frame + ' is sending a message to ' + frameId);

            postDataToParent({
                sendMessageToFrame: {
                    sourceFrame: spatialObject.frame,
                    destinationFrame: frameUuid,
                    msgContent: msgContent
                }
            });
        };

        this.sendMessageToTool = this.sendMessageToFrame;

        // subscriptions
        this.subscribeToMatrix = function() {
            spatialObject.sendMatrix = true;
            spatialObject.sendMatrices.modelView = true;
            // if (spatialObject.sendFullScreen === false) {
            //     spatialObject.height = document.body.scrollHeight;
            //     spatialObject.width = document.body.scrollWidth;
            // }
            // postAllDataToParent();
            postDataToParent({
                sendMatrix: spatialObject.sendMatrix,
                sendMatrices: spatialObject.sendMatrices
            });
        };

        this.subscribeToScreenPosition = function() {
            spatialObject.sendScreenPosition = true;
            // postAllDataToParent();
            postDataToParent({
                sendScreenPosition: spatialObject.sendScreenPosition
            });
        };

        this.subscribeToDevicePoseMatrix = function () {
            spatialObject.sendMatrices.devicePose = true;
            // postAllDataToParent();
            postDataToParent({
                sendMatrices: spatialObject.sendMatrices
            });
        };

        this.subscribeToAllMatrices = function () {
            spatialObject.sendMatrices.allObjects = true;
            // postAllDataToParent();
            postDataToParent({
                sendMatrices: spatialObject.sendMatrices
            });
        };

        this.subscribeToGroundPlaneMatrix = function () {
            spatialObject.sendMatrices.groundPlane = true;
            // postAllDataToParent();
            postDataToParent({
                sendMatrices: spatialObject.sendMatrices
            });
        };

        this.setFullScreenOn = function(zPosition) {
            spatialObject.sendFullScreen = true;
            // console.log(spatialObject.frame + ' fullscreen = ' + spatialObject.sendFullScreen);
            // spatialObject.height = '100%';
            // spatialObject.width = '100%';
            if (zPosition !== undefined) {
                spatialObject.fullscreenZPosition = zPosition;
            }
            // postAllDataToParent();
            postDataToParent({
                fullScreen: spatialObject.sendFullScreen,
                fullscreenZPosition: spatialObject.fullscreenZPosition,
                stickiness: spatialObject.sendSticky
            });
        };

        this.setFullScreenOff = function (params) {
            spatialObject.sendFullScreen = false;
            // console.log(spatialObject.frame + ' fullscreen = ' + spatialObject.sendFullScreen);
            // spatialObject.height = document.body.scrollHeight;
            // spatialObject.width = document.body.scrollWidth;
            // postAllDataToParent();

            var dataToPost = {
                fullScreen: spatialObject.sendFullScreen,
                fullscreenZPosition: spatialObject.fullscreenZPosition,
                stickiness: spatialObject.sendSticky
            };

            if (params && typeof params.animated !== 'undefined') {
                dataToPost.fullScreenAnimated = params.animated;
            }

            postDataToParent(dataToPost);
        };

        this.setStickyFullScreenOn = function (params) {
            spatialObject.sendFullScreen = 'sticky';
            // console.log(spatialObject.frame + ' fullscreen = ' + spatialObject.sendFullScreen);
            spatialObject.sendSticky = true;
            // spatialObject.height = "100%";
            // spatialObject.width = "100%";
            // postAllDataToParent();

            var dataToPost = {
                fullScreen: spatialObject.sendFullScreen,
                fullscreenZPosition: spatialObject.fullscreenZPosition,
                stickiness: spatialObject.sendSticky
            };

            if (params && typeof params.animated !== 'undefined') {
                dataToPost.fullScreenAnimated = params.animated;
            }

            postDataToParent(dataToPost);
        };

        this.setStickinessOff = function () {
            spatialObject.sendSticky = false;
            // postAllDataToParent();
            postDataToParent({
                fullScreen: spatialObject.sendFullScreen,
                fullscreenZPosition: spatialObject.fullscreenZPosition,
                stickiness: spatialObject.sendSticky
            });
        };

        /**
         * Pass in true (or omit the argument) to make the frame set pointer-events none so all touches pass through un-altered
         * Pass in false to reset this functionality so it accepts touches again
         * @param {boolean} newValue
         */
        this.ignoreAllTouches = function(newValue) {
            if (newValue !== spatialObject.ignoreAllTouches) {
                spatialObject.ignoreAllTouches = newValue;
                postDataToParent({
                    ignoreAllTouches: newValue
                });
            }
        };

        /**
         * Adjust the size of the frame's touch overlay element to match the current size of this frame.
         * @param {number} newWidth
         * @param {number} newHeight
         */
        this.changeFrameSize = function(newWidth, newHeight) {
            if (spatialObject.width === newWidth && spatialObject.height === newHeight) {
                return;
            }
            spatialObject.width = newWidth;
            spatialObject.height = newHeight;
            postDataToParent({
                changeFrameSize: {
                    width: newWidth,
                    height: newHeight
                }
            });
        };

        this.changeToolSize = this.changeFrameSize;

        /**
         * Asynchronously query the screen width and height from the parent application, as the iframe itself can't access that
         * @param {function} callback
         */
        this.getScreenDimensions = function(callback) {

            spatialObject.messageCallBacks.screenDimensionsCall = function (msgContent) {
                if (spatialObject.visibility !== 'visible') return;
                if (typeof msgContent.screenDimensions !== 'undefined') {
                    callback(msgContent.screenDimensions.width, msgContent.screenDimensions.height);
                    delete spatialObject.messageCallBacks['screenDimensionsCall']; // only trigger it once
                }
            };

            postDataToParent({
                getScreenDimensions: true
            });
        };
        
    };

    SpatialInterface.prototype.injectMessageListenerAPI = function() {
        // ensures each callback has a unique name
        var callBackCounter = {
            numMatrixCallbacks: 0,
            numAllMatricesCallbacks: 0,
            numWorldMatrixCallbacks: 0,
            numGroundPlaneMatrixCallbacks: 0
        };

        this.addGlobalMessageListener = function(callback) {
            spatialObject.messageCallBacks.globalMessageCall = function (msgContent) {
                if (typeof msgContent.globalMessage !== 'undefined') {
                    callback(msgContent.globalMessage);
                }
            };
        };

        this.addFrameMessageListener = function(callback) {
            spatialObject.messageCallBacks.frameMessageCall = function (msgContent) {
                if (typeof msgContent.sendMessageToFrame !== 'undefined') {
                    callback(msgContent.sendMessageToFrame);
                }
            };
        };

        this.addToolMessageListener = this.addFrameMessageListener;

        this.addMatrixListener = function (callback) {
            if (!spatialObject.sendMatrices.modelView) {
                this.subscribeToMatrix();
            }
            callBackCounter.numMatrixCallbacks++;
            spatialObject.messageCallBacks['matrixCall' + callBackCounter.numMatrixCallbacks] = function (msgContent) {
                if (typeof msgContent.modelViewMatrix !== 'undefined') {
                    callback(msgContent.modelViewMatrix, spatialObject.matrices.projection);
                }
            }.bind(this);
        };

        this.addAllObjectMatricesListener = function (callback) {
            if (!spatialObject.sendMatrices.allObjects) {
                this.subscribeToAllMatrices();
            }
            callBackCounter.numAllMatricesCallbacks++;
            spatialObject.messageCallBacks['allMatricesCall' + callBackCounter.numAllMatricesCallbacks] = function (msgContent) {
                if (typeof msgContent.allObjects !== 'undefined') {
                    callback(msgContent.allObjects, spatialObject.matrices.projection);
                }
            };
        };

        this.addDevicePoseMatrixListener = function (callback) {
            if (!spatialObject.sendMatrices.devicePose) {
                this.subscribeToDevicePoseMatrix();
            }
            callBackCounter.numWorldMatrixCallbacks++;
            spatialObject.messageCallBacks['worldMatrixCall' + callBackCounter.numWorldMatrixCallbacks] = function (msgContent) {
                if (typeof msgContent.devicePose !== 'undefined') {
                    callback(msgContent.devicePose, spatialObject.matrices.projection);
                }
            };
        };

        this.addGroundPlaneMatrixListener = function (callback) {
            if (!spatialObject.sendMatrices.groundPlane) {
                this.subscribeToGroundPlaneMatrix();
            }
            callBackCounter.numGroundPlaneMatrixCallbacks++;
            spatialObject.messageCallBacks['groundPlaneMatrixCall' + callBackCounter.numGroundPlaneMatrixCallbacks] = function (msgContent) {
                if (typeof msgContent.groundPlaneMatrix !== 'undefined') {
                    callback(msgContent.groundPlaneMatrix, spatialObject.matrices.projection);
                }
            };
        };

        var numScreenPositionCallbacks = 0;
        this.addScreenPositionListener = function(callback) {
            if (!spatialObject.sendScreenPosition) {
                this.subscribeToScreenPosition();
            }
            numScreenPositionCallbacks++;
            spatialObject.messageCallBacks['screenPositionCall' + numScreenPositionCallbacks] = function (msgContent) {
                if (typeof msgContent.frameScreenPosition !== 'undefined') {
                    callback(msgContent.frameScreenPosition);
                }
            };
            return 'screenPositionCall' + numScreenPositionCallbacks; // returns a handle that can be used to cancel the listener
        };

        this.cancelScreenPositionListener = function(handle) {
            if (handle.indexOf('screenPositionCall') === -1) {
                console.warn('improperly formatted handle for a screenPositionListener. refusing to cancel.');
                return;
            }
            if (spatialObject.messageCallBacks[handle]) {
                delete spatialObject.messageCallBacks['screenPositionCall' + numScreenPositionCallbacks];
                numScreenPositionCallbacks--;
            }
        };
    };

    SpatialInterface.prototype.injectSetterGetterAPI = function() {
        this.getVisibility = function () {
            return spatialObject.visibility;
        };

        this.getInterface = function () {
            return spatialObject.interface;
        };

        this.getPositionX = function () {
            if (typeof spatialObject.matrices.modelView[12] !== 'undefined') {
                return spatialObject.matrices.modelView[12];
            } else return undefined;
        };

        this.getPositionY = function () {
            if (typeof spatialObject.matrices.modelView[13] !== 'undefined') {
                return spatialObject.matrices.modelView[13];
            } else return undefined;
        };

        this.getPositionZ = function () {
            if (typeof spatialObject.matrices.modelView[14] !== 'undefined') {
                return spatialObject.matrices.modelView[14];
            } else return undefined;
        };

        this.getProjectionMatrix = function () {
            if (typeof spatialObject.matrices.projection !== 'undefined') {
                return spatialObject.matrices.projection;
            } else return undefined;
        };

        this.getModelViewMatrix = function () {
            if (typeof spatialObject.matrices.modelView !== 'undefined') {
                return spatialObject.matrices.modelView;
            } else return undefined;
        };

        this.getGroundPlaneMatrix = function () {
            if (typeof spatialObject.matrices.groundPlane !== 'undefined') {
                return spatialObject.matrices.groundPlane;
            } else return undefined;
        };

        this.getDevicePoseMatrix = function () {
            if (typeof spatialObject.matrices.devicePose !== 'undefined') {
                return spatialObject.matrices.devicePose;
            } else return undefined;
        };

        this.getAllObjectMatrices = function () {
            if (typeof spatialObject.matrices.allObjects !== 'undefined') {
                return spatialObject.matrices.allObjects;
            } else return undefined;
        };

        this.registerTouchDecider = function(callback) {
            spatialObject.touchDecider = callback;
            spatialObject.touchDeciderRegistered = true;
        };

        // by default, register a touch decider that ignores touches if they hit a transparent body background
        this.registerTouchDecider(function(eventData) {
            var elt = document.elementFromPoint(eventData.x, eventData.y);
            return elt !== document.body;
        });

        this.unregisterTouchDecider = function() {
            // touchDecider is passed by reference, so setting touchDecider to null would alter the function definition
            spatialObject.touchDeciderRegistered = false; // instead just set a flag to not use the callback anymore
        };
    };

    function isDesktop() {
        return window.navigator.userAgent.indexOf('Mobile') === -1 || window.navigator.userAgent.indexOf('Macintosh') > -1;
    }

    exports.spatialObject = spatialObject;
    exports.realityObject = spatialObject;
    exports.RealityInterface = SpatialInterface;
    exports.HybridObject = SpatialInterface;
    exports.SpatialInterface = SpatialInterface;

    exports.isDesktop = isDesktop;

})(window);
