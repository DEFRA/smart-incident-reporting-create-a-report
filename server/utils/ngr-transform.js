import proj4 from 'proj4'
import { readFileSync } from 'fs'

const oSTN15 = readFileSync('node_modules/@defra/smart-incident-reporting/server/utils/OSTN15_NTv2_OSGBtoETRS.gsb').buffer
proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +units=m +no_defs +nadgrids=OSTN15_NTv2_OSGBtoETRS')
proj4.nadgrid('OSTN15_NTv2_OSGBtoETRS', oSTN15)

// Taken from https://github.com/OrdnanceSurvey/os-transform/blob/main/os-transform.js

// Return easting + northing from an input grid reference
const five = 5
const ngrToEaNo = (gridref) => {
  gridref = String(gridref).trim()
  const gridLetters = 'VWXYZQRSTULMNOPFGHJKABCDE'

  const ref = gridref.toUpperCase().replaceAll(' ', '')

  const majorEasting = gridLetters.indexOf(ref[0]) % five * 500000 - 1000000
  const majorNorthing = Math.floor(gridLetters.indexOf(ref[0]) / five) * 500000 - 500000

  const minorEasting = gridLetters.indexOf(ref[1]) % five * 100000
  const minorNorthing = Math.floor(gridLetters.indexOf(ref[1]) / five) * 100000

  const i = (ref.length - 2) / 2
  const m = Math.pow(10, five - i)

  const e = majorEasting + minorEasting + (ref.substr(2, i) * m)
  const n = majorNorthing + minorNorthing + (ref.substr(i + 2, i) * m)

  return { ea: e, no: n }
}

// Return latlng from an input easting + northing.
const six = 6
const eaNoToLatLng = (coordinates, decimals = six) => {
  const point = proj4('EPSG:27700', 'EPSG:4326', [coordinates.ea, coordinates.no])

  const lng = Number(point[0].toFixed(decimals))
  const lat = Number(point[1].toFixed(decimals))

  return { lat, lng }
}

export {
  ngrToEaNo,
  eaNoToLatLng
}
