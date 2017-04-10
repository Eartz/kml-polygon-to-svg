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
    var updateView = function updateView(point) {
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
    };

    var settings = _lodash2.default.extend({}, defaultOptions, options);
    settings.precision = Number(settings.precision);
    settings.simplificationTolerance = Number(settings.simplificationTolerance);
    if (settings.precision < 0) {
        settings.precision = 0; // avoid nasty bugs
    }
    var coordsTransform = function coordsTransform(points) {
        return point;
    };
    if (typeof settings.coordsTransform === "function") {
        coordsTransform = settings.coordsTransform;
    }
    // create a rounding function
    var formatCoords = function (roundParam) {
        if (settings.round === false) {
            return function (coord) {
                return coord;
            }; // don't change anything
        }
        var precision = Number(roundParam);
        return function (coord) {
            return _lodash2.default.round(coord, precision);
        };
    }(settings.round);

    // create a precision filter for a polygon
    var createPrecisionFilter = function createPrecisionFilter(points) {
        if (settings.precision === 0) {
            return function () {
                return true;
            };
        }
        var meanX = _lodash2.default.mean(_lodash2.default.map(points, function (point) {
            return point.x;
        }));
        var meanY = _lodash2.default.mean(_lodash2.default.map(points, function (point) {
            return point.y;
        }));
        var acceptableDifferenceX = meanX * (settings.precision / 100);
        var acceptableDifferenceY = meanY * (settings.precision / 100);
        var prev = false;
        return function (point) {
            // if this is the first point, always return true
            if (prev === false) {
                prev = _lodash2.default.extend({}, point);
                return true;
            }
            // if this is a moveTo point, always return true
            if (point.type === "M") {
                prev = _lodash2.default.extend({}, point);
                return true;
            }
            // else if the difference in both X and Y is < acceptableDifference, don't use this point
            if (Math.abs(prev.x - point.x) <= acceptableDifferenceX && Math.abs(prev.y - point.y) <= acceptableDifferenceY) {
                return false;
            }
            // else, use the point
            prev = _lodash2.default.extend({}, point);
            return true;
        };
    };
    var simplificater = function simplificater(points) {
        if (!settings.simplification) {
            return function (points) {
                return points;
            };
        }
        return function (points) {
            return (0, _douglasPeucker2.default)(points, settings.simplificationTolerance);
        };
    };
    var proj = _projections2.default[settings.projection];
    var φ0 = settings.φ0;
    var dataPrefix = settings.dataPrefix;

    var dataTransform = function dataTransform(name, value) {
        return { name: dataPrefix + name, value: value };
    };
    if (typeof settings.dataTransform === "function") {
        dataTransform = settings.dataTransform;
    }

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
            var _loop = function _loop() {
                var tempKmlPolygon = {
                    points: []
                };

                // get coordinates
                var coordsGroups = polygons[i].find(".//kml:coordinates", { kml: "http://www.opengis.net/kml/2.2" }).map(function (node) {
                    return node.text().trim();
                });
                _lodash2.default.each(coordsGroups, function (coords, groupIndex) {
                    var points = coords.replace(/\t+/gm, " ").replace(/\n+/gm, " ").split(' ');
                    for (var j = 0, pl = points.length; j < pl; j++) {
                        var point = points[j].split(',');

                        // Apply the projection
                        point[0] = proj.x(Number(point[0]), φ0);
                        point[1] = proj.y(Number(point[1]));
                        // 0: x, 1: y, 2: z

                        updateView(point); // update min/max X and Y

                        // LineTo ou MoveTo
                        var pointType = "L";
                        if (j <= 0) {
                            // if 1st point, moveTo
                            pointType = "M";
                        }
                        tempKmlPolygon.points.push({
                            x: point[0],
                            y: point[1],
                            z: Number(point[2]),
                            type: pointType,
                            groupId: "" + i + "_" + groupIndex // to fix missing MoveTos
                        });
                    }
                });

                kmlPlacemark.polygons.push(tempKmlPolygon);
            };

            for (var i = 0, l = polygons.length; i < l; i++) {
                _loop();
            }
        }
        // store extended data
        var datas = placemark.find('.//kml:Data | .//kml:SimpleData', { kml: "http://www.opengis.net/kml/2.2" });
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
                        x: formatCoords((vv.x + Xdiff) * multiplier),
                        y: formatCoords((vv.y + Ydiff) * multiplier),
                        z: vv.z,
                        type: vv.type,
                        groupId: vv.groupId
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
        _lodash2.default.each(_lodash2.default.filter(placemark.extendedData, settings.filterAttributes), function (data) {
            var transformedData = dataTransform(data.name, data.content);
            if (!!transformedData) {
                attrs[transformedData.name] = transformedData.value;
            }
        });
        // each polygon has all the placemark data... maybe group them in <g> ?
        _lodash2.default.each(placemark.polygons, function (polygon, kk) {
            var approximate = simplificater(polygon.points);
            polygon.points = approximate(polygon.points); // use approximation algorithm
            var precisionFilter = createPrecisionFilter(polygon.points); // create precision filter : skip a few points
            var prevGroupId = false;
            var pathData = _lodash2.default.reduce(_lodash2.default.filter(polygon.points, precisionFilter), function (path, point, index) {
                var command = point.type;
                if (prevGroupId !== point.groupId && command !== "M") {
                    // force moveTo
                    command = "M";
                }
                prevGroupId = point.groupId;
                point = coordsTransform(point, newBoundaries, formatCoords);
                return path + " " + command + " " + point.x + "," + point.y;
            }, "") + " z";
            var oAttributes = {};
            if (!!settings.withId) {
                _lodash2.default.extend(oAttributes, { id: "poly_" + k + "_" + kk });
            }
            _lodash2.default.extend(oAttributes, { d: pathData });
            g.addChild(new _libxmljs2.default.Element(svg, "path").attr(_lodash2.default.extend({}, attrs, oAttributes)));
        });
    });

    return svg.toString();
};

var _libxmljs = require("libxmljs");

var _libxmljs2 = _interopRequireDefault(_libxmljs);

var _projections = require("./projections.js");

var _projections2 = _interopRequireDefault(_projections);

var _douglasPeucker = require("./douglas-peucker.js");

var _douglasPeucker2 = _interopRequireDefault(_douglasPeucker);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultOptions = {
    φ0: 42, // used in equirectangular projection
    projection: "mercator",
    dataPrefix: "data-",
    filterAttributes: function filterAttributes(data) {
        // callback to filter which attributes are kept in the output
        return true;
    },
    round: false, // Decimal precision of coordinates. use to reduce filesize if you don't need the precision.
    withId: true, // disable if you don't want an automatic `id` attribute on each path in the output
    precision: 0, // drops a few points in exchange for filesize. See the precisionFilter() internal function for details
    simplification: false,
    simplificationTolerance: 3,
    dataTransform: false,
    coordsTransform: function coordsTransform(points, view) {
        return point;
    } // use this to change coords on output, e.g. axial symmetry
};
;