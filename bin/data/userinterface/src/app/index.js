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
 * Created by Valentin on 10/25/17.
 */

createNameSpace("toolbox.app");

/**
 * @fileOverview toolbox.app.index.js
 * Defines the API to communicate with the native iOS application.
 * Calling toolbox.app.{functionName} will trigger {functionName} in toolbox.mm in the native iOS app.
 * Note that as of 6/8/18, many of these are placeholders that lead to function stubs
 */

/**
 * @typedef {string|function} FunctionName
 * @desc The name of a function, in string form, with a path that can be reached from this file,
 * e.g. "toolbox.app.callbacks.vuforiaIsReady"
 * Optional: if the function signature doesn't have any parameters, the entire function can be used instead of a string,
 * e.g. function(){console.log("pong")})
 */

/**
 **************Vuforia****************
 **/

/**
 * Starts the AR engine. Fires a callback once it is ready.
 * @param {FunctionName} callBack
 */
toolbox.app.getVuforiaReady = function(callBack){
    this.appFunctionCall('getVuforiaReady', null, 'toolbox.app.callBack('+callBack+')');
};

/**
 * Gets the projection matrix.
 * Callback will have the matrix as a length-16 array as a parameter.
 * @param {FunctionName} callBack
 */
toolbox.app.getProjectionMatrix = function(callBack) {
    this.appFunctionCall('getProjectionMatrix', null, 'toolbox.app.callBack('+callBack+', [__ARG1__])');
};

/**
 * Sets up a callback for the model matrices of all markers that are found, that will get called every frame.
 * Callback will have a set of objectId mapped to matrix for each visibleObjects.
 * @param {FunctionName} callBack
 */
toolbox.app.getMatrixStream = function(callBack) {
    this.appFunctionCall('getMatrixStream', null, 'toolbox.app.callBack('+callBack+', [__ARG1__])');
};

/**
 * Sets up a callback for the positional device tracker, reporting the pose of the camera at every frame.
 * Callback will have the cameraMatrix (which is the inverse of the view matrix) as a parameter.
 * @param {FunctionName} callBack
 */
toolbox.app.getCameraMatrixStream = function(callBack) {
    this.appFunctionCall('getCameraMatrixStream', null, 'toolbox.app.callBack('+callBack+', [__ARG1__])');
};

/**
 * Pauses the tracker (freezes the background)
 */
toolbox.app.setPause = function() {
    this.appFunctionCall('setPause', null, null);
};

/**
 * Resumes the tracker (unfreezes the background)
 */
toolbox.app.setResume = function() {
    this.appFunctionCall('setResume', null, null);
};

/**
 **************UTILITIES****************
 **/

/**
 * Encodes a javascript function call to be sent to the native app via the webkit message interface.
 * @param {string} functionName - the function to trigger in toolbox.mm
 * @param {Object|null} functionArguments - object with a key matching the name of each target function parameter,
 *                                          and the value of each key is the value to pass into that parameter
 * @param {FunctionName} callbackString - 'toolbox.app.callBack('+callBack+')'
 */
toolbox.app.appFunctionCall = function(functionName, functionArguments, callbackString) {
    var messageBody = {
        functionName: functionName
    };
    
    if (functionArguments) {
        messageBody.arguments = functionArguments;
    }
    
    if (callbackString) {
        messageBody.callback = callbackString;
    }
    
    window.webkit.messageHandlers.vuforiaWebXR.postMessage(messageBody);
};

/**
 * Wrapper function for callbacks called by the native iOS application, applying any arguments as needed.
 * @param {FunctionName} callBack
 * @param {Array.<*>} callbackArguments
 */
toolbox.app.callBack = function(callBack, callbackArguments){
    
    if (callbackArguments) {
        callBack.apply(null, callbackArguments);
    } else {
        callBack();
    }
};
