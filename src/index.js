import libxmljs from "libxmljs";
import projections from "./projections.js";
import _ from "lodash";


export default function (kml, φ0) {
    const view = {
        minX: false,
        maxX: false,
        minY: false,
        maxY: false
    };
    const proj = projections.equirectangular;
    const dataPrefix = "data-";
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
                let coords = polygons[i].find(".//kml:coordinates", {kml: "http://www.opengis.net/kml/2.2"})
                            .reduce(function(val, node) {
                                    return val + node.text().trim();
                            }, "");
                let points = coords.replace(/\t+/m, " ").split(' ');
                for (var j = 0, pl = points.length; j < pl; j++) {
                    var point = points[j].split(',');

                    // Apply the projection
                    point[0] = proj.x(Number(point[0]), φ0);
                    point[1] = proj.y(Number(point[1]));
                    // 0: x, 1: y, 2: z
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
        let datas = placemark.find('.//kml:Data', {kml: "http://www.opengis.net/kml/2.2"});
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
                        x: (vv.x + Xdiff) * multiplier,
                        y: (vv.y + Ydiff) * multiplier,
                        z: (vv.z)
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
        version: "1.0",
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
        _.each(placemark.extendedData, (data) => {
            attrs[ dataPrefix + data.name] = data.content;
        });
        // each polygon has all the placemark data... maybe group them in <g> ?
        _.each(placemark.polygons, (polygon, kk) => {
            let pathData = _.reduce(polygon.points, (path, point, index) => {
                let command = "M";
                if (index > 0) {
                    command = "L";
                }
                return path + " " + command + " " + point.x + "," + point.y;
            }, "") + " z";
            g.addChild(new libxmljs.Element(svg, "path")
                .attr(_.extend({}, attrs, {
                id: "poly_" + k + "_" + kk,
                d: pathData
            })));
        });
    });

    return svg.toString();
};
