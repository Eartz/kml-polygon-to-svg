"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (kml, options) {
    var view = {
        minX: false,
        maxX: false,
        minY: false,
        maxY: false
    };
    var settings = _lodash2.default.extend({}, defaultOptions, options);
    var proj = _projections2.default[settings.projection];
    var φ0 = settings.φ0;
    var dataPrefix = settings.dataPrefix;

    var kmlPlacemarks = [];
    var doc = _libxmljs2.default.parseXml(kml);

    // Find polygons anywhere
    var placemarks = doc.find('//kml:Placemark', { kml: "http://www.opengis.net/kml/2.2" });

    // parse the kml and store it's content in plain objects
    _lodash2.default.each(placemarks, function (placemark, indexPlacemark) {
        var kmlPlacemark = {
            polygons: [],
            extendedData: []
        };
        // store polygon data
        var polygons = placemark.find('.//kml:Polygon', { kml: "http://www.opengis.net/kml/2.2" });
        if (polygons.length > 0) {
            for (var i = 0, l = polygons.length; i < l; i++) {
                var tempKmlPolygon = {
                    points: []
                };

                // get coordinates
                var coords = polygons[i].find(".//kml:coordinates", { kml: "http://www.opengis.net/kml/2.2" }).reduce(function (val, node) {
                    return val + node.text().trim();
                }, "");
                var points = coords.replace(/\t+/gm, " ").replace(/\n+/gm, " ").split(' ');
                for (var j = 0, pl = points.length; j < pl; j++) {
                    var point = points[j].split(',');

                    // Apply the projection
                    point[0] = proj.x(Number(point[0]), φ0);
                    point[1] = proj.y(Number(point[1]));
                    // 0: x, 1: y, 2: z
                    // Store the smallest and biggest coords to find out what the viewport is
                    if (view.minX === false || point[0] < view.minX) {
                        if (!isNaN(point[0])) {
                            view.minX = point[0];
                        }
                    }
                    if (view.maxX === false || point[0] > view.maxX) {
                        if (!isNaN(point[0])) {
                            view.maxX = point[0];
                        }
                    }
                    if (view.minY === false || point[1] < view.minY) {
                        if (!isNaN(point[1])) {
                            view.minY = point[1];
                        }
                    }
                    if (view.maxY === false || point[1] > view.maxY) {
                        if (!isNaN(point[1])) {
                            view.maxY = point[1];
                        }
                    }
                    tempKmlPolygon.points.push({
                        x: point[0],
                        y: point[1],
                        z: Number(point[2])
                    });
                }

                kmlPlacemark.polygons.push(tempKmlPolygon);
            }
        }
        // store extended data
        var datas = placemark.find('.//kml:Data', { kml: "http://www.opengis.net/kml/2.2" });
        if (datas.length > 0) {
            kmlPlacemark.extendedData = _lodash2.default.map(datas, function (data) {
                return {
                    name: data.attr('name').value(),
                    content: _lodash2.default.trim(data.text(), " \r\n\t")
                };
            });
        }

        kmlPlacemarks.push(kmlPlacemark);
    });

    // Remove negative values, we want (0,0) to be the top left corner, not the center
    var multiplier = 100; // work with bigger values
    var Xdiff = 0;
    if (view.minX < 0) {
        Xdiff = 0 - view.minX;
    } else if (view.minX > 0) {
        Xdiff = 0 - view.minX;
    }
    var Ydiff = 0;
    if (view.minY < 0) {
        Ydiff = 0 - view.minY;
    } else if (view.minY > 0) {
        Ydiff = 0 - view.minY;
    }

    var newBoundaries = {
        minX: (view.minX + Xdiff) * multiplier,
        maxX: (view.maxX + Xdiff) * multiplier,
        minY: (view.minY + Ydiff) * multiplier,
        maxY: (view.maxY + Ydiff) * multiplier
    };

    _lodash2.default.each(kmlPlacemarks, function (kmlPlacemark) {
        kmlPlacemark.polygons = _lodash2.default.map(kmlPlacemark.polygons, function (v) {
            return {
                points: v.points.map(function (vv) {
                    return {
                        x: (vv.x + Xdiff) * multiplier,
                        y: (vv.y + Ydiff) * multiplier,
                        z: vv.z
                    };
                })
            };
        });
    });

    // output
    var svg = new _libxmljs2.default.Document();
    svg.setDtd('svg', "-//W3C//DTD SVG 1.0//EN", "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd");

    var longest = newBoundaries.maxX;
    if (newBoundaries.maxX < newBoundaries.maxY) {
        longest = newBoundaries.maxY;
    }
    var g = svg.node("svg").attr({
        version: "1.1",
        id: "Calque_1",
        xmlns: "http://www.w3.org/2000/svg",
        "xmlns:xlink": "http://www.w3.org/1999/xlink",
        overflow: "visible",
        "xml:space": "preserve",
        width: "" + longest,
        height: "" + longest,
        viewBox: "0 0 " + longest + " " + longest
    }).node("g");
    // write placemarks as <path> elements
    _lodash2.default.each(kmlPlacemarks, function (placemark, k) {
        var attrs = {};
        _lodash2.default.each(placemark.extendedData, function (data) {
            attrs[dataPrefix + data.name] = data.content;
        });
        // each polygon has all the placemark data... maybe group them in <g> ?
        _lodash2.default.each(placemark.polygons, function (polygon, kk) {
            var pathData = _lodash2.default.reduce(polygon.points, function (path, point, index) {
                var command = "M";
                if (index > 0) {
                    command = "L";
                }
                return path + " " + command + " " + point.x + "," + point.y;
            }, "") + " z";
            g.addChild(new _libxmljs2.default.Element(svg, "path").attr(_lodash2.default.extend({}, attrs, {
                id: "poly_" + k + "_" + kk,
                d: pathData
            })));
        });
    });

    return svg.toString();
};

var _libxmljs = require("libxmljs");

var _libxmljs2 = _interopRequireDefault(_libxmljs);

var _projections = require("./projections.js");

var _projections2 = _interopRequireDefault(_projections);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultOptions = {
    φ0: 42, // used in equirectangular projection
    projection: "mercator",
    dataPrefix: "data-"
};
;