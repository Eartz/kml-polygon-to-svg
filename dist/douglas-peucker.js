"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (points, tolerance) {
    // helper classes 
    var Vector = function Vector(x, y) {
        this.x = x;
        this.y = y;
    };
    var Line = function Line(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;

        this.distanceToPoint = function (point) {
            // slope
            var mX = this.p2.x - this.p1.x;
            var mY = this.p2.y - this.p1.y;
            var m;
            if (mX === 0 && mY === 0) {
                m = 1;
            } else if (mX === 0) {
                m = mY;
            } else {
                m = mY / mX;
            }
            // y offset
            var b = this.p1.y - m * this.p1.x,
                d = [];
            // distance to the linear equation
            // console.log(Math.abs( point.y - ( m * point.x ) - b ) / Math.sqrt( Math.pow( m, 2 ) + 1 ) );
            // console.log( this.p2, this.p1);
            // console.log(Math.abs( point.y - ( m * point.x ) - b ));
            d.push(Math.abs(point.y - m * point.x - b) / Math.sqrt(Math.pow(m, 2) + 1));
            // distance to p1
            d.push(Math.sqrt(Math.pow(point.x - this.p1.x, 2) + Math.pow(point.y - this.p1.y, 2)));
            // distance to p2
            d.push(Math.sqrt(Math.pow(point.x - this.p2.x, 2) + Math.pow(point.y - this.p2.y, 2)));
            // return the smallest distance
            return d.sort(function (a, b) {
                return a - b; //causes an array to be sorted numerically and ascending
            })[0];
        };
    };

    var douglasPeucker = function douglasPeucker(points, tolerance) {
        if (points.length <= 2) {
            return [points[0]];
        }
        var returnPoints = [],

        // make line from start to end 
        line = new Line(points[0], points[points.length - 1]),

        // find the largest distance from intermediate poitns to this line
        maxDistance = 0,
            maxDistanceIndex = 0,
            p;
        for (var i = 1; i <= points.length - 2; i++) {
            var distance = line.distanceToPoint(points[i]);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxDistanceIndex = i;
            }
        }

        // check if the max distance is greater than our tollerance allows 
        if (maxDistance >= tolerance) {
            p = points[maxDistanceIndex];
            line.distanceToPoint(p, true);
            // include this point in the output 
            returnPoints = returnPoints.concat(douglasPeucker(points.slice(0, maxDistanceIndex + 1), tolerance));
            // returnPoints.push( points[maxDistanceIndex] );
            returnPoints = returnPoints.concat(douglasPeucker(points.slice(maxDistanceIndex, points.length), tolerance));
        } else {
            // ditching this point
            p = points[maxDistanceIndex];
            line.distanceToPoint(p, true);
            returnPoints = [points[0]];
        }
        return returnPoints;
    };
    var arr = douglasPeucker(points, tolerance);
    // always have to push the very last point on so it doesn't get left off
    arr.push(points[points.length - 1]);
    return arr;
};

; // jscs:disable
// taken from https://gist.github.com/adammiller/826148
// http://www.wikiwand.com/en/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm