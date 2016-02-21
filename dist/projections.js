"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var EARTH_RADIUS = exports.EARTH_RADIUS = 6371; // Earth radius in km

var degToRad = exports.degToRad = function degToRad(degrees) {
    return degrees * Math.PI / 180;
};

// equirectangular projection :
// x = r λ cos(φ0)
// y = r φ
// where λ = longitude, φ = latitude, φ0 = latitude close to the center, r = earth radius
var equirectangular = exports.equirectangular = {
    x: function x(λ, φ0) {
        return EARTH_RADIUS * degToRad(λ) * Math.cos(degToRad(φ0));
    },
    y: function y(φ) {
        return EARTH_RADIUS * degToRad(φ);
    }
};

exports.default = {
    equirectangular: equirectangular,
    degToRad: degToRad,
    EARTH_RADIUS: EARTH_RADIUS
};