const Polygon = require('./polygon')

const GeoJSON = {}
module.exports = GeoJSON

/**
 *
 * @param pt
 * @param gj
 * @returns {boolean}
 */
GeoJSON.pointInPolygon = function pointInPolygon (pt, gj) {
  let coordinates

  if (gj.bbox && !Polygon.pointInBoundingBox(pt, gj.bbox)) {
    return false
  }

  if (gj.type === 'Polygon') {
    coordinates = [ gj.coordinates ]
  } else if (gj.type === 'MultiPolygon') {
    coordinates = gj.coordinates
  } else if (gj.type === 'Feature') {
    return GeoJSON.pointInPolygon(pt, gj.geometry)
  } else {
    return false
  }

  return !!coordinates.find(polygon => {
    return polygon.reduce((result, shape) => {
      if (Polygon.pointInPolygon(pt, shape) !== 0) {
        return !result
      } else {
        return result
      }
    }, false)
  })
}

GeoJSON.bbox = function bbox (gj) {
  let coordinates, bbox
  if (!gj.hasOwnProperty('type')) return
  coordinates = getCoordinatesDump(gj)
  bbox = [ Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY ]
  return coordinates.reduce(function (prev, coord) {
    return [
      Math.min(coord[ 0 ], prev[ 0 ]),
      Math.min(coord[ 1 ], prev[ 1 ]),
      Math.max(coord[ 0 ], prev[ 2 ]),
      Math.max(coord[ 1 ], prev[ 3 ])
    ]
  }, bbox)
}

function getCoordinatesDump (gj) {
  let coordinates
  if (gj.type === 'pt') {
    coordinates = [ gj.coordinates ]
  } else if (gj.type === 'LineString' || gj.type === 'MultiPoint') {
    coordinates = gj.coordinates
  } else if (gj.type === 'Polygon' || gj.type === 'MultiLineString') {
    coordinates = gj.coordinates.reduce(function (dump, part) {
      return dump.concat(part)
    }, [])
  } else if (gj.type === 'MultiPolygon') {
    coordinates = gj.coordinates.reduce(function (dump, poly) {
      return dump.concat(poly.reduce(function (points, part) {
        return points.concat(part)
      }, []))
    }, [])
  } else if (gj.type === 'Feature') {
    coordinates = getCoordinatesDump(gj.geometry)
  } else if (gj.type === 'GeometryCollection') {
    coordinates = gj.geometries.reduce(function (dump, g) {
      return dump.concat(getCoordinatesDump(g))
    }, [])
  } else if (gj.type === 'FeatureCollection') {
    coordinates = gj.features.reduce(function (dump, f) {
      return dump.concat(getCoordinatesDump(f))
    }, [])
  }
  return coordinates
}
