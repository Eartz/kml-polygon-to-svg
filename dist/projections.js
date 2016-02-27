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
// http://paulbourke.net/geometry/transformationprojection/
// mercator :
// x = longitude / pi
// y = ln((1 + sin(latitude))/(1 - sin(latitude))) / (4 pi)
var sphericalMercator = exports.sphericalMercator = {
    x: function x(λ) {
        return λ;
    },
    y: function y(φ) {
        return 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + φ * (Math.PI / 180) / 2));
    }
};

// http://wiki.openstreetmap.org/wiki/Mercator#JavaScript
// ellipticalMercator (true)
var r_major = 6378137.000;
var r_minor = 6356752.3142;
var ellipticalMercator = exports.ellipticalMercator = {
    x: function x(λ) {
        return r_major * degToRad(λ);
    },
    y: function y(φ) {
        if (φ > 89.5) {
            φ = 89.5;
        }
        if (φ < -89.5) {
            φ = -89.5;
        }
        var temp = r_minor / r_major;
        var es = 1.0 - temp * temp;
        var eccent = Math.sqrt(es);
        var phi = degToRad(φ);
        var sinphi = Math.sin(phi);
        var con = eccent * sinphi;
        var com = 0.5 * eccent;
        con = Math.pow((1.0 - con) / (1.0 + con), com);
        var ts = Math.tan(0.5 * (Math.PI * 0.5 - phi)) / con;
        var y = 0 - r_major * Math.log(ts);
        return y;
    }
};

exports.default = {
    equirectangular: equirectangular,
    mercator: sphericalMercator,
    sphericalMercator: sphericalMercator,
    ellipticalMercator: ellipticalMercator,
    degToRad: degToRad,
    EARTH_RADIUS: EARTH_RADIUS
};