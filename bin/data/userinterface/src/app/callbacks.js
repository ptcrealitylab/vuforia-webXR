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
 * Created by Ben Reynolds on 7/17/18.
 */

createNameSpace('toolbox.app.callbacks');

/**
 * @fileOverview toolbox.app.callbacks.js
 * The central location where all functions triggered from within the native iOS code should reside.
 * Includes processing detected matrices from the Vuforia Engine, and processing UDP messages.
 * These can just be simple routing functions that trigger the appropriate function in other files,
 * but this acts to organize all API calls in a single place.
 * Note: callbacks related to target downloading are located in the targetDownloader module.
 */

(function(exports) {
    
    /**
     * Callback for toolbox.app.getVuforiaReady
     * Triggered when Vuforia Engine finishes initializing.
     * Retrieves the projection matrix and starts streaming the model matrices, camera matrix, and groundplane matrix.
     * Also starts the object discovery and download process.
     */
    function vuforiaIsReady() {
        // projection matrix only needs to be retrieved once
        toolbox.app.getProjectionMatrix('toolbox.app.callbacks.receivedProjectionMatrix');

        // subscribe to the model matrices from each recognized image or object target
        toolbox.app.getMatrixStream('toolbox.app.callbacks.receiveMatricesFromAR');

        // subscribe to the camera matrix from the positional device tracker
        toolbox.app.getCameraMatrixStream('toolbox.app.callbacks.receiveCameraMatricesFromAR');
    }

    /**
     * Callback for toolbox.app.getProjectionMatrix
     * Sets the projection matrix once using the value from the AR engine
     * @param {Array.<number>} matrix
     */
    function receivedProjectionMatrix(matrix) {
        console.log('got projection matrix!', matrix);
        toolbox.gui.ar.utilities.setProjectionMatrix(matrix);
    }

    /**
     * Callback for toolbox.app.getMatrixStream
     * Gets triggered ~60FPS when the AR SDK sends us a new set of modelView matrices for currently visible objects
     * Stores those matrices in the draw module to be rendered in the next draw frame
     * @param {Object.<string, Array.<number>>} visibleObjects
     */
    function receiveMatricesFromAR(visibleObjects) {
        
        // visibleObjects contains the raw modelMatrices -> send them to the scene graph
        for (let objectKey in visibleObjects) {
            let sceneNode = toolbox.gui.ar.sceneGraph.getSceneNodeById(objectKey);
            if (sceneNode) {
                sceneNode.setLocalMatrix(visibleObjects[objectKey]);
            }
        }

        if (!globalStates.freezeButtonState) {
            // re-render the scene anytime we receive a new update tick from vuforia and the camera isn't frozen
            toolbox.gui.ar.sceneRenderer.draw(visibleObjects);
        }
    }

    /**
     * Callback for toolbox.app.getCameraMatrixStream
     * Gets triggered ~60FPS when the AR SDK sends us a new cameraMatrix based on the device's world coordinates
     * @param {Array.<number>} cameraMatrix
     */
    function receiveCameraMatricesFromAR(cameraMatrix) {
        // easiest way to implement freeze button is just to not update the new matrices
        if (!globalStates.freezeButtonState) {
            toolbox.gui.ar.sceneGraph.setCameraPosition(cameraMatrix);
        }
    }

    // public methods (anything triggered by a native app callback needs to be public)
    exports.vuforiaIsReady = vuforiaIsReady;
    exports.receivedProjectionMatrix = receivedProjectionMatrix;
    exports.receiveMatricesFromAR = receiveMatricesFromAR;
    exports.receiveCameraMatricesFromAR = receiveCameraMatricesFromAR;

})(toolbox.app.callbacks);
