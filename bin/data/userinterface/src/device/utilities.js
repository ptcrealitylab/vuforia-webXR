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


/**
 * Created by heun on 12/27/16.
 */

createNameSpace("toolbox.device.utilities");

/**
 * @fileOverview toolbox.device.utilities.js
 * Provides device-level utility functions such as generating UUIDs and logging debug messages.
 */

toolbox.device.utilities.setupHardcodedObject = function(objectName, frameName, frameSrc, presetWidth, presetHeight) {
    // hard-code some objects into the model
    let objectId = objectName; // in this case, id is name, but usually has random chars added
    let thisObject = new Objects();
    thisObject.objectId = objectId;
    thisObject.name = objectName;
    objects[objectId] = thisObject;
    toolbox.gui.ar.sceneGraph.addObject(objectId, undefined, true);

    let frameId = objectName + frameName;
    let thisFrame = new Frame();
    thisFrame.objectId = objectName;
    thisFrame.uuid = frameId;
    thisFrame.name = frameName;
    thisFrame.src = frameSrc;
    if (typeof presetWidth !== 'undefined') {
        thisFrame.width = presetWidth;
    }
    if (typeof presetHeight !== 'undefined') {
        thisFrame.height = presetHeight;
    }
    thisObject.frames[frameId] = thisFrame;
    toolbox.gui.ar.sceneGraph.addFrame(objectId, frameId, undefined);

    toolbox.network.onNewObjectAdded(objectId); // finish setting up the object with temporary state
};

/**
 * Generates a random 12 character unique identifier using uppercase, lowercase, and numbers (e.g. "OXezc4urfwja")
 * @return {string}
 */
toolbox.device.utilities.uuidTime = function () {
	var dateUuidTime = new Date();
	var abcUuidTime = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var stampUuidTime = parseInt(Math.floor((Math.random() * 199) + 1) + "" + dateUuidTime.getTime()).toString(36);
	while (stampUuidTime.length < 12) stampUuidTime = abcUuidTime.charAt(Math.floor(Math.random() * abcUuidTime.length)) + stampUuidTime;
	return stampUuidTime;
};

/**
 * Generates a random 8 character unique identifier using uppercase, lowercase, and numbers (e.g. "jzY3y338")
 * @return {string}
 */
toolbox.device.utilities.uuidTimeShort = function () {
	var dateUuidTime = new Date();
	var abcUuidTime = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var stampUuidTime = parseInt("" + dateUuidTime.getMilliseconds() + dateUuidTime.getMinutes() + dateUuidTime.getHours() + dateUuidTime.getDay()).toString(36);
	while (stampUuidTime.length < 8) stampUuidTime = abcUuidTime.charAt(Math.floor(Math.random() * abcUuidTime.length)) + stampUuidTime;
	return stampUuidTime;
};

/**
 * Computes the difference between two arrays of primitive values (string or number - not objects)
 * and presents the results in terms of what was added or subtracted from the first to the second
 * @param {Array} oldArray
 * @param {Array} newArray
 * @return {{additions: Array, subtractions: Array, isEqual: boolean}}
 */
toolbox.device.utilities.diffArrays = function(oldArray, newArray) {
    var additions = [];
    var subtractions = [];
    var isEqual = true;

    if (oldArray && newArray) {
        oldArray.forEach(function(elt) {
            if (newArray.indexOf(elt) === -1) {
                subtractions.push(elt);
                isEqual = false;
            }
        });

        newArray.forEach(function(elt) {
            if (oldArray.indexOf(elt) === -1) {
                additions.push(elt);
                isEqual = false;
            }
        });
    } else {
        if (!oldArray && newArray) {
            additions = newArray;
            isEqual = false;
        }

        if (oldArray && !newArray) {
            subtractions = oldArray;
            isEqual = false;
        }
    }
    
    return {
        additions: additions,
        subtractions: subtractions,
        isEqual: isEqual
    }
};

/**
 * Helper function tells if tapped the background (and excludes edge-case: multi-touch gesture while selecting a vehicle)
 * @param {PointerEvent} event
 * @return {boolean}
 */
toolbox.device.utilities.isEventHittingBackground = function(event) {
    return (event.target.tagName === 'BODY' || event.target.id === 'canvas');
};
