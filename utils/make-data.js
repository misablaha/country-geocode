const Promise = require('bluebird')
const path = require('path')
const fs = require('fs')
const request = require('request-promise')
const randomUseragent = require('random-useragent')
const _ = require('lodash')
const { bbox } = require('./../lib/geojson')

const dataDir = path.join(__dirname, '..', 'data')

let options = {
  url: 'https://restcountries.eu/rest/v1/all',
  json: true
}

Promise.resolve(request(options))
  .filter(countryInfo => !fs.existsSync(path.join(dataDir, `${countryInfo.alpha2Code}.json`)))
  .then(print(`\nFinding ...`))
  .mapSeries(fillOsmId)
  .filter(countryInfo => countryInfo.osmId !== null)
  .then(print(`\nSaving ...`))
  .mapSeries(countryInfo => {
    return fillNominatimData(countryInfo)
      .then(saveSpecification)
  })

// find osm_id and put it to 'osmId'
function fillOsmId (countryInfo) {
  let { name, alpha2Code, alpha3Code } = countryInfo

  process.stdout.write(`${alpha2Code} `)

  let baseQuery = {
    'addressdetails': 1,
    'format': 'json',
    'accept-language': 'en'
  }

  let getOsmId = (osmId, query) => {
    if (osmId) { return osmId }

    let options = {
      url: 'https://nominatim.openstreetmap.org/search',
      qs: _.merge(query, baseQuery),
      headers: {
        'User-Agent': randomUseragent.getRandom()
      },
      json: true
    }
    return request(options)
      .then(data => _.filter(data, {
        'osm_type': 'relation',
        'class': 'boundary',
        'type': 'administrative'
      })
      )
      .then(data => data.find(({ address }) => address.country_code === alpha2Code.toLowerCase()))
      .then(detail => detail ? detail.osm_id : null)
  }

  let queries = [
    { 'country': alpha2Code },
    { 'country': alpha3Code },
    { 'country': name },
    { 'q': name }
  ]

  return Promise.reduce(queries, getOsmId, null)
    .then(osmId => _.merge({ osmId }, countryInfo))
}

// download geo json data and put it to 'countryInfo'
function fillNominatimData (countryInfo) {
  process.stdout.write(`${countryInfo.alpha2Code} `)

  let options = {
    url: 'https://nominatim.openstreetmap.org/reverse',
    qs: {
      'osm_type': 'R',
      'osm_id': countryInfo.osmId,
      'polygon_geojson': 1,
      'namedetails': 1,
      'format': 'json',
      'accept-language': 'en'
    },
    headers: {
      'User-Agent': randomUseragent.getRandom()
    },
    json: true
  }

  return request(options)
    .then(nominatim => _.merge(countryInfo, { nominatim }))
}

function saveSpecification (countryInfo) {
  let { alpha2Code, nominatim } = countryInfo
  delete countryInfo.nominatim

  countryInfo.translations = _(nominatim.namedetails)
    .map((val, lng) => [ lng, val ])
    .filter(([ lng ]) => /^name:[a-z]{2}$/.test(lng))
    .map(([ lng, val ]) => [ lng.substr(-2), val ])
    .fromPairs()
    .value()

  let result = {
    'type': 'FeatureCollection',
    'features': [
      {
        'type': 'Feature',
        'properties': countryInfo,
        'bbox': bbox(nominatim[ 'geojson' ]),
        'geometry': nominatim[ 'geojson' ]
      }
    ]
  }
  return fs.writeFileSync(path.join(dataDir, `${alpha2Code}.json`), JSON.stringify(result))
}

function print (text) {
  return function (data) {
    console.log(text)
    return data
  }
}
