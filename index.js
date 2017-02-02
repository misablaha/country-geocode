const fs = require('fs')
const path = require('path')
const { pointInPolygon } = require('./lib/geojson')

const DATA_DIR = path.join(__dirname, 'data')
const countries = []

fs.readdirSync(DATA_DIR).forEach(file => {
  let name = path.join(DATA_DIR, file)
  let data = require(name)
  countries.push(data.features[ 0 ])
})

module.exports = function countryGeocode (pt) {
  let country = countries.find(pointInPolygon.bind(null, pt))
  return country && country.properties
}
