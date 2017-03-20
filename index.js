//const cflights = require('./index')
//const flight = new cflights
const moment = require('moment')
const _ = require('lodash')
const QPXApi = require('qpx-api')

const qpx = new QPXApi({
  api_key: '',
  timeout: 5000 // timeout in milleseconds
})

//date used for the head of the window. It finds the next Thursday
const startDate = (date) => {
  let startDate = date || moment()
  if (moment(startDate).day() > 4) {
    startDate = moment(startDate).add(1, 'w')
    return startDate = moment(startDate).day(4).format()
  } else {
    return startDate = moment(startDate).day(4).format()
  }
}

//build the sliding Range of weekend dates based off a date, how many weeks wanted, and which search engine to format for.
function buildRWindow(date, weeks, engine) {
  let comingWeekends = {}
  let currentEngine = engine || 'qpx'
  for (let i = 1; i <= weeks; i++) {
    let name = `week${i}`
    let datePairs = dates(date,currentEngine)
    comingWeekends[name] = datePairs
    date = moment(date).add(1, 'w').format()
  }
  return comingWeekends
}

//build an array of dates, depending on the search engine
function dates(searchDate, engine) {
  const PAIRS = [
    { from: 4, to: 8 }, //thursday to monday
    { from: 4, to: 7 }, //thursday to sunday
    { from: 5, to: 8 }, //friday to monday
    { from: 5, to: 7 }, //friday to sunday
  ]
  const SLICES = [
    { from: 4 },
    { from: 5 },
    {   to: 7 },
    {   to: 8 },
  ]
  const FORMAT = 'YYYY-MM-DD ddd'
//get dates for qpx
  function gDates(date) {
    let datesObj = {}
    let dates = SLICES.map((s) => {
      if (s.from) return {
        [moment(searchDate).day(s.from).format('ddd') + 'DepartureDate']: moment(searchDate).day(s.from).format(FORMAT)
      }
      return {
        [moment(searchDate).day(s.to).format('ddd') + 'ReturnDate']: moment(searchDate).day(s.to).format(FORMAT)
      }
    })
    dates.reduce((acc, val) => {
      for (prop in val) {
        datesObj[prop] = val[prop]
      }
    },0)
    return datesObj
  }
//get dates for ctrip
  function ctripDates(date) {
    return PAIRS.map((p) => {
      return {
        departureDate: moment(searchDate).day(p.from).format(FORMAT),
        returnDate: moment(searchDate).day(p.to).format(FORMAT),
      }
    })
  }
  if (engine === 'ctrip') return ctripDates(searchDate)
  else if (engine === 'qpx')return gDates(searchDate)
  else {
    console.log('unknown engine, using qpx')
    return gDates(searchDate)
  }
}

  function buildSlices(rWindow) {
    _.forOwn(rWindow, (weekObj, week) => {
      _.forOwn(weekObj, (date, day) => {
        rWindow[week][day] = new template
        rWindow[week][day].date = date
        if (day.match(/(...)(Departure)\w+/)) {
          rWindow[week][day].origin = 'SHA'
          rWindow[week][day].destination = 'XNN'
        } else {
          rWindow[week][day].origin = 'XNN'
          rWindow[week][day].destination = 'SHA'
        }
      })
    })
    return rWindow
  }

  function template() {
    this.kind = "qpxexpress#sliceInput"
    this.origin = ""
    this.destination = ""
    this.date = ""
    this.permittedDepartureTime = {
      "kind": "qpxexpress#timeOfDayRange",
      "earliestTime": "",
      "latestTime": ""
    }
  }
testing = buildSlices(buildRWindow(startDate(),1))

  //using ctrip
  //flight.oneWay({DCity:'SHA',ACity:'PEK',DDate:'2017-03-17'}).then(results => console.log(results))


  // using QPX
