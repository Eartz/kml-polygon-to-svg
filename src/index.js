import libxmljs from "libxmljs";
import projections from "./projections.js";
import dglspckr from "./douglas-peucker.js";
import _ from "lodash";

const defaultOptions = {
    φ0: 42, // used in equirectangular projection
    projection: "mercator",
    dataPrefix: "data-",
    filterAttributes: (data) => { // callback to filter which attributes are kept in the output
        return true;
    },
    round: false, // Decimal precision of coordinates. use to reduce filesize if you don't need the precision.
    withId: true, // disable if you don't want an automatic `id` attribute on each path in the output
    precision: 0, // drops a few points in exchange for filesize. See the precisionFilter() internal function for details
    simplification: false,
    simplificationTolerance: 3,
    dataTransform: false,
    coordsTransform: (points, view) => point // use this to change coords on output, e.g. axial symmetry
};
export default function (kml, options) {
    const view = {
        minX: false,
        maxX: false,
        minY: false,
        maxY: false
    };
    const updateView = (point) => {
        // Store the smallest and biggest coords to find out what the viewport is
        if ((view.minX === false) || (point[0] < view.minX)) {
            if (!isNaN(point[0])) {
                view.minX = point[0];
            }
        }
        if ((view.maxX === false) || (point[0] > view.maxX)) {
            if (!isNaN(point[0])) {
                view.maxX = point[0];
            }
        }
        if ((view.minY === false) || (point[1] < view.minY)) {
            if (!isNaN(point[1])) {
                view.minY = point[1];
            }
        }
        if ((view.maxY === false) || (point[1] > view.maxY)) {
            if (!isNaN(point[1])) {
                view.maxY = point[1];
            }
        }
    };

    const settings = _.extend({}, defaultOptions, options);
    settings.precision = Number(settings.precision);
    settings.simplificationTolerance = Number(settings.simplificationTolerance);
    if (settings.precision < 0) {
        settings.precision = 0; // avoid nasty bugs
    }
    let coordsTransform = (points) => point;
    if (typeof settings.coordsTransform === "function") {
        coordsTransform = settings.coordsTransform;
    }
    // create a rounding function
    const formatCoords = ((roundParam) => {
        if (settings.round === false) {
            return (coord) => coord; // don't change anything
        }
        const precision = Number(roundParam);
        return (coord) => _.round(coord, precision);
    })(settings.round);

    // create a precision filter for a polygon
    const createPrecisionFilter = (points) => {
        if (settings.precision === 0) {
            return () => true;
        }
        let meanX = _.mean(_.map(points, (point) => point.x));
        let meanY = _.mean(_.map(points, (point) => point.y));
        let acceptableDifferenceX = meanX * (settings.precision / 100);
        let acceptableDifferenceY = meanY * (settings.precision / 100);
        let prev = false;
        return (point) => {
            // if this is the first point, always return true
            if (prev === false) {
                prev = _.extend({}, point);
                return true;
            }
            // if this is a moveTo point, always return true
            if (point.type === "M") {
                prev = _.extend({}, point);
                return true;
            }
            // else if the difference in both X and Y is < acceptableDifference, don't use this point
            if (Math.abs(prev.x - point.x) <= acceptableDifferenceX &&
                Math.abs(prev.y - point.y) <= acceptableDifferenceY) {
                return false;
            }
            // else, use the point
            prev = _.extend({}, point);
            return true;
        };
    };
    const simplificater = (points) => {
        if (!settings.simplification) {
            return (points) => points;
        }
        return (points) => {
            return dglspckr(points, settings.simplificationTolerance);
        };
    };
    const proj = projections[settings.projection];
    const φ0 = settings.φ0;
    const dataPrefix = settings.dataPrefix;

    let dataTransform = (name, value) => {
        return { name: dataPrefix + name, value: value };
    };
    if (typeof settings.dataTransform === "function") {
        dataTransform = settings.dataTransform;
    }


    let kmlPlacemarks = [];
    const doc = libxmljs.parseXml(kml);

    // Find polygons anywhere
    const placemarks = doc.find('//kml:Placemark', {kml: "http://www.opengis.net/kml/2.2"});

    // parse the kml and store it's content in plain objects
    _.each(placemarks, (placemark, indexPlacemark) => {
        let kmlPlacemark = {
            polygons: [],
            extendedData: []
        };
        // store polygon data
        let polygons = placemark.find('.//kml:Polygon', {kml: "http://www.opengis.net/kml/2.2"});
        if (polygons.length > 0) {
            for (var i = 0, l = polygons.length; i < l; i++) {
                let tempKmlPolygon = {
                    points: []
                };

                // get coordinates
                let coordsGroups = polygons[i].find(".//kml:coordinates", {kml: "http://www.opengis.net/kml/2.2"})
                            .map((node) => {
                                return node.text().trim();
                            });
                _.each(coordsGroups, (coords, groupIndex) => {
                    let points = coords.replace(/\t+/gm, " ").replace(/\n+/gm, " ").split(' ');
                    for (var j = 0, pl = points.length; j < pl; j++) {
                        var point = points[j].split(',');

                        // Apply the projection
                        point[0] = proj.x(Number(point[0]), φ0);
                        point[1] = proj.y(Number(point[1]));
                        // 0: x, 1: y, 2: z

                        updateView(point); // update min/max X and Y

                        // LineTo ou MoveTo
                        let pointType = "L";
                        if (j <= 0) { // if 1st point, moveTo
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
            }
        }
        // store extended data
        let datas = placemark.find('.//kml:Data | .//kml:SimpleData', {kml: "http://www.opengis.net/kml/2.2"});
        if (datas.length > 0) {
            kmlPlacemark.extendedData = _.map(datas, (data) => {
                return {
                    name: data.attr('name').value(),
                    content: _.trim(data.text(), " \r\n\t")
                };
            });
        }

        kmlPlacemarks.push(kmlPlacemark);
    });

    // Remove negative values, we want (0,0) to be the top left corner, not the center
    const multiplier = 100; // work with bigger values
    let Xdiff = 0;
    if (view.minX < 0) {
        Xdiff = 0 - view.minX;
    } else if (view.minX > 0) {
        Xdiff = 0 - view.minX;
    }
    let Ydiff = 0;
    if (view.minY < 0) {
        Ydiff = 0 - view.minY;
    } else if (view.minY > 0) {
        Ydiff = 0 - view.minY;
    }

    const newBoundaries = {
        minX: (view.minX + Xdiff) * multiplier,
        maxX: (view.maxX + Xdiff) * multiplier,
        minY: (view.minY + Ydiff) * multiplier,
        maxY: (view.maxY + Ydiff) * multiplier
    };

    _.each(kmlPlacemarks, (kmlPlacemark) => {
        kmlPlacemark.polygons = _.map(kmlPlacemark.polygons, (v) => {
            return {
                points: v.points.map((vv) => {
                    return {
                        x: formatCoords((vv.x + Xdiff) * multiplier),
                        y: formatCoords((vv.y + Ydiff) * multiplier),
                        z: (vv.z),
                        type: vv.type,
                        groupId: vv.groupId
                    };
                })
            };
        });
    });


    // output
    const svg = new libxmljs.Document();
    svg.setDtd('svg', "-//W3C//DTD SVG 1.0//EN", "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd");

    let longest = newBoundaries.maxX;
    if (newBoundaries.maxX < newBoundaries.maxY) {
        longest = newBoundaries.maxY;
    }
    const g = svg.node("svg").attr({
        version: "1.1",
        id: "Calque_1",
        xmlns: "http://www.w3.org/2000/svg",
        "xmlns:xlink": "http://www.w3.org/1999/xlink",
        overflow: "visible",
        "xml:space": "preserve",
        width: "" + longest,
        height: "" + longest,
        viewBox: "0 0 " + longest + " " + longest
    })
        .node("g");
    // write placemarks as <path> elements
    _.each(kmlPlacemarks, (placemark, k) => {
        let attrs = {};
        _.each(_.filter(placemark.extendedData, settings.filterAttributes), (data) => {
            let transformedData = dataTransform(data.name, data.content);
            if (!!transformedData) {
                attrs[ transformedData.name ] = transformedData.value;
            }
        });
        // each polygon has all the placemark data... maybe group them in <g> ?
        _.each(placemark.polygons, (polygon, kk) => {
            let approximate = simplificater(polygon.points);
            polygon.points = approximate(polygon.points); // use approximation algorithm
            let precisionFilter = createPrecisionFilter(polygon.points); // create precision filter : skip a few points
            let prevGroupId = false;
            let pathData = _.reduce(_.filter(polygon.points, precisionFilter), (path, point, index) => {
                let command = point.type;
                if (prevGroupId !== point.groupId && command !== "M") {
                    // force moveTo
                    command = "M";
                }
                prevGroupId = point.groupId;
                point = coordsTransform(point, newBoundaries, formatCoords);
                return path + " " + command + " " + point.x + "," + point.y;
            }, "") + " z";
            let oAttributes = {};
            if (!!settings.withId) {
                _.extend(oAttributes, { id: "poly_" + k + "_" + kk });
            }
            _.extend(oAttributes, { d: pathData });
            g.addChild(new libxmljs.Element(svg, "path")
                .attr(_.extend({}, attrs, oAttributes)));
        });
    });

    return svg.toString();
};
