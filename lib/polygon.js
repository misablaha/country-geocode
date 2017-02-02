const Polygon = {}
module.exports = Polygon

/**
 *
 * @param pt
 * @param bbox
 * @returns {boolean}
 */
Polygon.pointInBoundingBox = function pointInBoundingBox (pt, bbox) {
  return !(pt[ 0 ] < bbox[ 0 ] || pt[ 0 ] > bbox[ 2 ] || pt[ 1 ] < bbox[ 1 ] || pt[ 1 ] > bbox[ 3 ])
}

/**
 * Copied from https://github.com/junmer/clipper-lib
 * See "The Point in Polygon Problem for Arbitrary Polygons" by Hormann & Agathos
 * http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.88.5498&rep=rep1&type=pdf
 *
 * @param pt
 * @param path
 * @returns {number} returns 0 if false, +1 if true, -1 if pt ON polygon boundary
 */
Polygon.pointInPolygon = function pointInPolygon (pt, path) {
  let result = 0
  let cnt = path.length
  if (cnt < 3) { return 0 }
  let ip = path[ 0 ]
  for (let i = 1; i <= cnt; ++i) {
    let ipNext = (i === cnt ? path[ 0 ] : path[ i ])
    if (ipNext[ 1 ] === pt[ 1 ]) {
      if ((ipNext[ 0 ] === pt[ 0 ]) || (ip[ 1 ] === pt[ 1 ] && ((ipNext[ 0 ] > pt[ 0 ]) === (ip[ 0 ] < pt[ 0 ])))) { return -1 }
    }
    if ((ip[ 1 ] < pt[ 1 ]) !== (ipNext[ 1 ] < pt[ 1 ])) {
      if (ip[ 0 ] >= pt[ 0 ]) {
        if (ipNext[ 0 ] > pt[ 0 ]) { result = 1 - result } else {
          let d = (ip[ 0 ] - pt[ 0 ]) * (ipNext[ 1 ] - pt[ 1 ]) - (ipNext[ 0 ] - pt[ 0 ]) * (ip[ 1 ] - pt[ 1 ])
          if (d === 0) { return -1 } else if ((d > 0) === (ipNext[ 1 ] > ip[ 1 ])) { result = 1 - result }
        }
      } else {
        if (ipNext[ 0 ] > pt[ 0 ]) {
          let d = (ip[ 0 ] - pt[ 0 ]) * (ipNext[ 1 ] - pt[ 1 ]) - (ipNext[ 0 ] - pt[ 0 ]) * (ip[ 1 ] - pt[ 1 ])
          if (d === 0) { return -1 } else if ((d > 0) === (ipNext[ 1 ] > ip[ 1 ])) { result = 1 - result }
        }
      }
    }
    ip = ipNext
  }
  return result
}
