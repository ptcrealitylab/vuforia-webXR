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

createNameSpace("toolbox.gui.ar.utilities");

/**
 * @fileOverview toolbox.gui.ar.utilities.js
 * Various utility functions, mostly mathematical, for calculating AR geometry.
 * Includes simply utilities like multiplying and inverting a matrix,
 * as well as sophisticated algorithms for marker-plane intersections and raycasting points onto a plane.
 */

/**
 * @desc This function multiplies one m16 matrix with a second m16 matrix
 * @param {Array.<number>} m2 - origin matrix to be multiplied with
 * @param {Array.<number>} m1 - second matrix that multiplies.
 * @return {Array.<number>} m16 matrix result of the multiplication
 */
toolbox.gui.ar.utilities.multiplyMatrix = function(m2, m1, r) {
	// var r = [];
	// Cm1che only the current line of the second mm1trix
	r[0] = m2[0] * m1[0] + m2[1] * m1[4] + m2[2] * m1[8] + m2[3] * m1[12];
	r[1] = m2[0] * m1[1] + m2[1] * m1[5] + m2[2] * m1[9] + m2[3] * m1[13];
	r[2] = m2[0] * m1[2] + m2[1] * m1[6] + m2[2] * m1[10] + m2[3] * m1[14];
	r[3] = m2[0] * m1[3] + m2[1] * m1[7] + m2[2] * m1[11] + m2[3] * m1[15];

	r[4] = m2[4] * m1[0] + m2[5] * m1[4] + m2[6] * m1[8] + m2[7] * m1[12];
	r[5] = m2[4] * m1[1] + m2[5] * m1[5] + m2[6] * m1[9] + m2[7] * m1[13];
	r[6] = m2[4] * m1[2] + m2[5] * m1[6] + m2[6] * m1[10] + m2[7] * m1[14];
	r[7] = m2[4] * m1[3] + m2[5] * m1[7] + m2[6] * m1[11] + m2[7] * m1[15];

	r[8] = m2[8] * m1[0] + m2[9] * m1[4] + m2[10] * m1[8] + m2[11] * m1[12];
	r[9] = m2[8] * m1[1] + m2[9] * m1[5] + m2[10] * m1[9] + m2[11] * m1[13];
	r[10] = m2[8] * m1[2] + m2[9] * m1[6] + m2[10] * m1[10] + m2[11] * m1[14];
	r[11] = m2[8] * m1[3] + m2[9] * m1[7] + m2[10] * m1[11] + m2[11] * m1[15];

	r[12] = m2[12] * m1[0] + m2[13] * m1[4] + m2[14] * m1[8] + m2[15] * m1[12];
	r[13] = m2[12] * m1[1] + m2[13] * m1[5] + m2[14] * m1[9] + m2[15] * m1[13];
	r[14] = m2[12] * m1[2] + m2[13] * m1[6] + m2[14] * m1[10] + m2[15] * m1[14];
	r[15] = m2[12] * m1[3] + m2[13] * m1[7] + m2[14] * m1[11] + m2[15] * m1[15];
	// return r;
};

/**
 * @desc multiply m4 matrix with m16 matrix
 * @param {Array.<number>} m1 - origin m4 matrix
 * @param {Array.<number>} m2 - m16 matrix to multiply with
 * @return {Array.<number>} is m16 matrix
 */
toolbox.gui.ar.utilities.multiplyMatrix4 = function(m1, m2) {
	var r = [];
	var x = m1[0], y = m1[1], z = m1[2], w = m1[3];
	r[0] = m2[0] * x + m2[4] * y + m2[8] * z + m2[12] * w;
	r[1] = m2[1] * x + m2[5] * y + m2[9] * z + m2[13] * w;
	r[2] = m2[2] * x + m2[6] * y + m2[10] * z + m2[14] * w;
	r[3] = m2[3] * x + m2[7] * y + m2[11] * z + m2[15] * w;
	return r;
};

/**
 * @desc copies one m16 matrix in to another m16 matrix
 * @param {Array.<number>}matrix - source matrix
 * @return {Array.<number>} resulting copy of the matrix
 */
toolbox.gui.ar.utilities.copyMatrix = function(matrix) {
    if (matrix.length === 0) return [];

    var r = []; //new Array(16);
    r[0] = matrix[0];
    r[1] = matrix[1];
    r[2] = matrix[2];
    r[3] = matrix[3];
    r[4] = matrix[4];
    r[5] = matrix[5];
    r[6] = matrix[6];
    r[7] = matrix[7];
    r[8] = matrix[8];
    r[9] = matrix[9];
    r[10] = matrix[10];
    r[11] = matrix[11];
    r[12] = matrix[12];
    r[13] = matrix[13];
    r[14] = matrix[14];
    r[15] = matrix[15];
    return r;
};

/**
 * @desc copies one m16 matrix in to another m16 matrix
 * Use instead of copyMatrix function when speed is very important - this is faster
 * @param {Array.<number>} m1 - source matrix
 * @param {Array.<number>} m2 - resulting copy of the matrix
 */
toolbox.gui.ar.utilities.copyMatrixInPlace = function(m1, m2) {
    m2[0] = m1[0];
    m2[1] = m1[1];
    m2[2] = m1[2];
    m2[3] = m1[3];
    m2[4] = m1[4];
    m2[5] = m1[5];
    m2[6] = m1[6];
    m2[7] = m1[7];
    m2[8] = m1[8];
    m2[9] = m1[9];
    m2[10] = m1[10];
    m2[11] = m1[11];
    m2[12] = m1[12];
    m2[13] = m1[13];
    m2[14] = m1[14];
    m2[15] = m1[15];
};

/**
 * @desc inverting a matrix
 * @param {Array.<number>} a origin matrix
 * @return {Array.<number>} a inverted copy of the origin matrix
 */
toolbox.gui.ar.utilities.invertMatrix = function (a) {
	var b = [];
	var c = a[0], d = a[1], e = a[2], g = a[3], f = a[4], h = a[5], i = a[6], j = a[7], k = a[8], l = a[9], o = a[10], m = a[11], n = a[12], p = a[13], r = a[14], s = a[15], A = c * h - d * f, B = c * i - e * f, t = c * j - g * f, u = d * i - e * h, v = d * j - g * h, w = e * j - g * i, x = k * p - l * n, y = k * r - o * n, z = k * s - m * n, C = l * r - o * p, D = l * s - m * p, E = o * s - m * r, q = 1 / (A * E - B * D + t * C + u * z - v * y + w * x);
	b[0] = (h * E - i * D + j * C) * q;
	b[1] = ( -d * E + e * D - g * C) * q;
	b[2] = (p * w - r * v + s * u) * q;
	b[3] = ( -l * w + o * v - m * u) * q;
	b[4] = ( -f * E + i * z - j * y) * q;
	b[5] = (c * E - e * z + g * y) * q;
	b[6] = ( -n * w + r * t - s * B) * q;
	b[7] = (k * w - o * t + m * B) * q;
	b[8] = (f * D - h * z + j * x) * q;
	b[9] = ( -c * D + d * z - g * x) * q;
	b[10] = (n * v - p * t + s * A) * q;
	b[11] = ( -k * v + l * t - m * A) * q;
	b[12] = ( -f * C + h * y - i * x) * q;
	b[13] = (c * C - d * y + e * x) * q;
	b[14] = ( -n * u + p * B - r * A) * q;
	b[15] = (k * u - l * B + o * A) * q;
	return b;
};

/**
 * Returns the transpose of a 4x4 matrix
 * @param {Array.<number>} matrix
 * @return {Array.<number>}
 */
toolbox.gui.ar.utilities.transposeMatrix = function(matrix) {
    var r = [];
    r[0] = matrix[0];
    r[1] = matrix[4];
    r[2] = matrix[8];
    r[3] = matrix[12];
    r[4] = matrix[1];
    r[5] = matrix[5];
    r[6] = matrix[9];
    r[7] = matrix[13];
    r[8] = matrix[2];
    r[9] = matrix[6];
    r[10] = matrix[10];
    r[11] = matrix[14];
    r[12] = matrix[3];
    r[13] = matrix[7];
    r[14] = matrix[11];
    r[15] = matrix[15];
    return r;
};

/**
 * Efficient method for multiplying each element in a length 16 array by the same number
 * @param {Array.<number>} matrix
 * @param {number} scalar
 * @return {Array.<number>}
 */
toolbox.gui.ar.utilities.scalarMultiplyMatrix = function(matrix, scalar) {
    var r = [];
    r[0] = matrix[0] * scalar;
    r[1] = matrix[1] * scalar;
    r[2] = matrix[2] * scalar;
    r[3] = matrix[3] * scalar;
    r[4] = matrix[4] * scalar;
    r[5] = matrix[5] * scalar;
    r[6] = matrix[6] * scalar;
    r[7] = matrix[7] * scalar;
    r[8] = matrix[8] * scalar;
    r[9] = matrix[9] * scalar;
    r[10] = matrix[10] * scalar;
    r[11] = matrix[11] * scalar;
    r[12] = matrix[12] * scalar;
    r[13] = matrix[13] * scalar;
    r[14] = matrix[14] * scalar;
    r[15] = matrix[15] * scalar;
    return r;
};

/**
 * Divides every element in a vector or matrix by its last element so that the last element becomes 1.
 * (see explanation of homogeneous coordinates http://robotics.stanford.edu/~birch/projective/node4.html)
 * @param {Array.<number>} matrix - can have any length (so it works for vectors and matrices)
 * @return {Array.<number>}
 */
toolbox.gui.ar.utilities.perspectiveDivide = function(matrix) {
    var lastElement = matrix[matrix.length-1];
    var r = [];
    for (var i = 0; i < matrix.length; i++) {
        r[i] = matrix[i] / lastElement;
    }
    return r;
};

/**
 * Helper function for printing a matrix in human-readable format
 * Note that this assumes, row-major order, while CSS 3D matrices actually use column-major
 * Interpret column-major matrices as the transpose of what is printed
 * @param {Array.<number>} matrix
 * @param {number} precision - the number of decimal points to include
 * @param {boolean} htmlLineBreaks - use html line breaks instead of newline characters
 * @return {string}
 */
toolbox.gui.ar.utilities.prettyPrintMatrix = function(matrix, precision, htmlLineBreaks) {
    if (typeof precision === 'undefined') precision = 3;
    
    var lineBreakSymbol = htmlLineBreaks ? '<br>' : '\n';
    
    return "[ " + matrix[0].toFixed(precision) + ", " + matrix[1].toFixed(precision) + ", " + matrix[2].toFixed(precision) + ", " + matrix[3].toFixed(precision) + ", " + lineBreakSymbol +
                "  " + matrix[4].toFixed(precision) + ", " + matrix[5].toFixed(precision) + ", " + matrix[6].toFixed(precision) + ", " + matrix[7].toFixed(precision) + ", " + lineBreakSymbol +
                "  " + matrix[8].toFixed(precision) + ", " + matrix[9].toFixed(precision) + ", " + matrix[10].toFixed(precision) + ", " + matrix[11].toFixed(precision) + ", " + lineBreakSymbol +
                "  " + matrix[12].toFixed(precision) + ", " + matrix[13].toFixed(precision) + ", " + matrix[14].toFixed(precision) + ", " + matrix[15].toFixed(precision) + " ]";
};

/**
 * Returns the dot product of the two vectors
 */
toolbox.gui.ar.utilities.dotProduct = function(v1, v2) {
    if (v1.length !== v2.length) {
        console.warn('trying to dot two vectors of different lengths');
        return 0;
    }
    var sum = 0;
    for (var i = 0; i < v1.length; i++) {
        sum += v1[i] * v2[i];
    }
    return sum;
};

/**
 * Helper method for creating a new 4x4 identity matrix
 * @return {Array.<number>}
 */
toolbox.gui.ar.utilities.newIdentityMatrix = function() {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
};

/**
 * @desc Uses Pythagorean theorem to return the 3D distance to the origin of the transformation matrix.
 * @param {Array} matrix of the point - should be provided in the format taken from gui.ar.draw.modelViewMatrices
 * @return {number} distance
 */
toolbox.gui.ar.utilities.distance = function (matrix) {
    var distance = 1000; // for now give a valid value as a fallback
    try {
        if (toolbox.device.environment.distanceRequiresCameraTransform()) {
            // calculate distance to camera
            var matrixToCamera = [];
            toolbox.gui.ar.utilities.multiplyMatrix(matrix, toolbox.gui.ar.draw.correctedCameraMatrix, matrixToCamera);
            matrix = matrixToCamera;
        }
        distance = Math.sqrt(Math.pow(matrix[12], 2) + Math.pow(matrix[13], 2) + Math.pow(matrix[14], 2));
    } catch (e) {
        console.warn('trying to calculate distance of ', matrix);
    }
    return distance;
};

/**
 * Normalizes a 4x4 transformation matrix by dividing by the last element
 * @param m
 * @return {Array<number>}
 */
toolbox.gui.ar.utilities.normalizeMatrix = function(m) {
    var divisor = m[15];
    return this.scalarMultiplyMatrix(m, (1.0/divisor));
};

toolbox.gui.ar.utilities.mToggle_YZ = [
    1, 0, 0, 0,
    0, 0, 1, 0,
    0, 1, 0, 0,
    0, 0, 0, 1
];

/**
 * @param matrix
 * @return {*}
 */
toolbox.gui.ar.utilities.convertMatrixHandedness = function(matrix) {
    var m2 = [];
    this.multiplyMatrix(this.mToggle_YZ, matrix, m2);
    return m2;
};

/**
 * Called from the native iOS Vuforia engine with the projection matrix for rendering to the screen correctly.
 * Makes some adjustments based on the viewport of the device and notifies the native iOS app when it is done.
 * @param {Array.<number>} matrix - a 4x4 projection matrix
 */
toolbox.gui.ar.utilities.setProjectionMatrix = function(matrix) {

    //  generate all transformations for the object that needs to be done ASAP
    var scaleZ = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 2, 0,
        0, 0, 0, 1
    ];

    var viewportScaling = [
        globalStates.height, 0, 0, 0,
        0, -globalStates.width, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];

    globalStates.realProjectionMatrix = this.copyMatrix(matrix);

    var r = [];
    this.multiplyMatrix(scaleZ, matrix, r);
    this.multiplyMatrix(r, viewportScaling, globalStates.projectionMatrix);
};
