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

createNameSpace("toolbox.device");

/**
 * @fileOverview toolbox.device.onLoad.js
 * Sets the application's window.onload function to trigger this init method, which sets up the GUI and networking.
 */

/**
 * When the index.html first finishes loading, set up the:
 * Sidebar menu buttons,
 * Pocket and memory bars,
 * Background canvas,
 * Touch Event Listeners,
 * Network callback function,
 * ... and notify the native iOS code that the user interface finished loading
 */
toolbox.device.onload = function () {

    toolbox.gui.ar.sceneGraph.initService();

    // hard-code some objects into the model
    toolbox.device.utilities.setupHardcodedObject('stones', 'default', 'content/stones/index.html');
    toolbox.device.utilities.setupHardcodedObject('chips', 'default', 'content/chips/index.html');
    toolbox.device.utilities.setupHardcodedObject('tarmac', 'default', 'https://spatialtoolbox.vuforia.com', 800, 600);

    // assign global pointers to frequently used UI elements
    overlayDiv = document.getElementById('overlay');
    
    // add a callback for messages posted up to the application from children iframes
	window.addEventListener("message", toolbox.network.onInternalPostMessage.bind(toolbox.network), false);
	
    // prevent touch events on overlayDiv
    overlayDiv.addEventListener('touchstart', function (e) {
        e.preventDefault();
    });
    
    document.addEventListener('pointerdown', function(e) {
        overlayDiv.style.display = 'inline';
        overlayDiv.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px, 1200px)';
    });

    document.addEventListener('pointermove', function(e) {
        overlayDiv.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px, 1200px)';
    });
    
    document.addEventListener('pointerup', function(e) {
        overlayDiv.style.display = 'none';

        globalStates.freezeButtonState = !globalStates.freezeButtonState;
        
        if (toolbox.device.utilities.isEventHittingBackground(e)) {
            if (globalStates.freezeButtonState) {
                toolbox.app.setPause();
            } else {
                toolbox.app.setResume();
            }
        }
    });
    
    // start the AR framework in native iOS
    toolbox.app.getVuforiaReady('toolbox.app.callbacks.vuforiaIsReady');
};

window.onload = toolbox.device.onload;
