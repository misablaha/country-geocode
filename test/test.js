const start = Date.now()
const countryGeocode = require('..')
console.log(Date.now() - start)

let pts = [
  [ 56.1937, 25.2888 ], // United Arab Emirates
  [ 56.3156, 25.2813 ], // Oman (inside United Arab Emirates)
  [ 56.2778, 25.2726 ], // United Arab Emirates
  [ 54.2175, 25.2360 ], // United Arab Emirates
  [ -66.4288, 18.2189 ], // Portorico (USA)
  [ 0, 0 ], // Middle of the ocean (no country)
]

pts.forEach(pt => {
  let country = countryGeocode(pt)
  console.log(country && country.name)
})
