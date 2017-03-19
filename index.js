//const cflights = require('./index')
//const flight = new cflights
const moment = require('moment')

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

//build the sliding window of weekend dates based off a date, how many weeks wanted, and which search engine to format for.
function buildWindow(date, weeks, engine) {
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

  function buildSlices(window) {
    let slice = []
    for (weeks in window) {
      let test = window[weeks]
      for (prop in test) {
        if (prop === 'ThuDepartureDate' || 'FriDepartureDate') {
          let template = {
            "kind": "qpxexpress#sliceInput",
            "origin": "",
            "destination": "",
            "date": "",
            "permittedDepartureTime": {
              "kind": "qpxexpress#timeOfDayRange",
              "earliestTime": "",
              "latestTime": ""
            },
          }
          template.origin = 'SHA'
          template.destination = 'XNN'
          template.date = test[prop]
          slice.push(template)
        }
      }
      return slice
    }
  }

  //using ctrip
  //flight.oneWay({DCity:'SHA',ACity:'PEK',DDate:'2017-03-17'}).then(results => console.log(results))


  // using QPX
  
/* function buildSlices(window, options) {
    let slice = []
    for (weeks in window) {
      let test = {
        "kind": "qpxexpress#sliceInput",
        "origin": "",
        "destination": "",
        "date": "",
        "permittedDepartureTime": {
          "kind": "qpxexpress#timeOfDayRange",
          "earliestTime": "",
          "latestTime": ""
        },
      }
      let testing = window[weeks]
      return testing
    }
  }*/

 function buildSlices(window, options) {
    let slice = []
    for (weeks in window) {
      let test = {
        "kind": "qpxexpress#sliceInput",
        "origin": "",
        "destination": "",
        "date": "",
        "permittedDepartureTime": {
          "kind": "qpxexpress#timeOfDayRange",
          "earliestTime": "",
          "latestTime": ""
        },
      }
      let testing = window[weeks]
      if (window[weeks].departureDate) {
        test.origin = 'SHA'
        test.destination = 'XNN'
        test.date = weeks.departureDate
      }
      slice.push(test)
      return slice
    }
  }

