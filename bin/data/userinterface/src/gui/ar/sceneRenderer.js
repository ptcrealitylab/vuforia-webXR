/*
* Created by Ben Reynolds on 09/22/20.
*
* Copyright (c) 2020 PTC Inc
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/**
 * This is the new rendering API for objects, tools, and nodes
 */
createNameSpace("toolbox.gui.ar.sceneRenderer");

(function(exports) {
    let previousVisibleObjects = [];
    const elementCache = {};
    
    function draw(visibleObjects) {
        
        // add or remove DOM elements if visibleObjects changed since last time
        let diff = toolbox.device.utilities.diffArrays(previousVisibleObjects, Object.keys(visibleObjects));
        if (!diff.isEqual) {
            diff.additions.forEach(function(objectKey) {
                let object = toolbox.getObject(objectKey);
                if (object) {
                    Object.keys(object.frames).forEach(function(frameKey) {
                        addElement(objectKey, frameKey);
                    });
                }
            });
            diff.subtractions.forEach(function(objectKey) {
                let object = toolbox.getObject(objectKey);
                if (object) {
                    Object.keys(object.frames).forEach(function(frameKey) {
                        removeElement(objectKey, frameKey);
                    });
                }
            });
        }
        
        previousVisibleObjects = Object.keys(visibleObjects);
        
        // calculate final positions
        toolbox.gui.ar.sceneGraph.calculateFinalMatrices(Object.keys(visibleObjects));
        
        // render each element at its calculated CSS matrix
        
        Object.keys(visibleObjects).forEach(function(objectKey) {
            let object = toolbox.getObject(objectKey);
            if (object) {
                Object.keys(object.frames).forEach(function(frameKey) {
                    let frame = toolbox.getFrame(objectKey, frameKey);
                    
                    // fullscreen frames have identity matrix
                    if (!frame.fullScreen) {
                        let matrix = toolbox.gui.ar.sceneGraph.getCSSMatrix(frameKey);
                        elementCache[frameKey].style.transform = 'matrix3d(' + matrix.toString() + ')';
                    }

                    if (frame.sendMatrix) {
                        // console.log('send matrix');
                        let modelViewMatrix = toolbox.gui.ar.sceneGraph.getRelativeToCamera(frameKey);
                        // let modelViewMatrix = toolbox.gui.ar.sceneGraph.getCSSMatrix(frameKey);
                        globalDOMCache['iframe' + frameKey].contentWindow.postMessage(JSON.stringify({
                            modelViewMatrix: modelViewMatrix
                        }), '*');
                    }
                    
                });
            }
        });
    }
    
    function addElement(objectKey, frameKey) {
        // create the DOM element, size it correctly, give it some default contents, cache it by objectKey
        // Create DOM elements for everything associated with this frame/node
        let thisFrame = toolbox.getFrame(objectKey, frameKey);
        let iframeSrc = thisFrame.src || 'content/' + objectKey + '/index.html';
        var domElements = createSubElements(iframeSrc, objectKey, frameKey, null, thisFrame.width || 300, thisFrame.height || 300);
        var addContainer = domElements.addContainer;
        var addIframe = domElements.addIframe;
        
        // append all the created elements to the DOM in the correct order...
        document.getElementById("GUI").appendChild(addContainer);
        addContainer.appendChild(addIframe);

        // cache references to these elements to more efficiently retrieve them in the future
        elementCache[frameKey] = addContainer;
        globalDOMCache[addContainer.id] = addContainer;
        globalDOMCache[addIframe.id] = addIframe;

        console.log('added element for ' + frameKey);
    }
    
    function removeElement(objectKey, frameKey) {
        // get the right DOM element by object key and remove it
        let element = elementCache[frameKey];
        if (element) {
            element.parentElement.removeChild(element);
            console.log('removed element for ' + frameKey);
        }
    }

    /**
     * Instantiates the many different DOM elements that make up a frame or node.
     *      addContainer - holds all the different pieces of this element
     *      addIframe - loads in the content for this frame, e.g. a graph or three.js scene, or a node graphic
     *      addOverlay - an invisible overlay that catches touch events and passes into the iframe if needed
     *      addSVG - a visual feedback image that displays when you are dragging the element around
     * @param {string} iframeSrc
     * @param {string} objectKey
     * @param {string} frameKey
     * @param {string} nodeKey
     * @param {number} width
     * @param {number} height
     * @return {{addContainer: HTMLDivElement, addIframe: HTMLIFrameElement}}
     */
    function createSubElements(iframeSrc, objectKey, frameKey, nodeKey, width, height) {

        var activeKey = nodeKey ? nodeKey : frameKey;

        var addContainer = document.createElement('div');
        addContainer.id = "object" + activeKey;
        addContainer.className = "main";
        addContainer.style.width = globalStates.height + "px";
        addContainer.style.height = globalStates.width + "px";
        addContainer.style.border = 0;
        addContainer.classList.add('ignorePointerEvents'); // don't let invisible background from container intercept touches

        var addIframe = document.createElement('iframe');
        addIframe.id = "iframe" + activeKey;
        addIframe.className = "main";
        addIframe.frameBorder = 0;
        addIframe.style.width = width + "px";
        addIframe.style.height = height + "px";
        addIframe.style.left = ((globalStates.height - width) / 2) + "px";
        addIframe.style.top = ((globalStates.width - height) / 2) + "px";
        addIframe.classList.add('visibleFrame');
        addIframe.src = iframeSrc;
        addIframe.setAttribute("data-frame-key", frameKey);
        addIframe.setAttribute("data-object-key", objectKey);
        addIframe.setAttribute("data-node-key", nodeKey);
        addIframe.setAttribute("onload", 'toolbox.network.onElementLoad("' + objectKey + '","' + frameKey + '","' + nodeKey + '")');
        addIframe.setAttribute("sandbox", "allow-forms allow-pointer-lock allow-same-origin allow-scripts");
        addIframe.classList.add('usePointerEvents'); // override parent (addContainer) pointerEvents value
        
        return {
            addContainer: addContainer,
            addIframe: addIframe
        }
    }

    exports.draw = draw;
})(toolbox.gui.ar.sceneRenderer);
