const cflights = require('../cflights/index.js')
const cfClient = new cflights
const moment = require('moment')
const _ = require('lodash')
const QPXApi = require('qpx-api')
const PQueue = require('p-queue')
const fs = require('fs')

const qpx = new QPXApi({
  api_key: '',
  timeout: 5000 // timeout in milleseconds
})
const q = new PQueue({concurrency: 3});

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
  const CDATES = [4,5,7,8]
  const SLICES = [
    { from: 4 },
    { from: 5 },
    {   to: 7 },
    {   to: 8 },
  ]
  const FORMAT = 'YYYY-MM-DD'
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
    return CDATES.map((p) => {
      return {
        [moment(searchDate).day(p).format('ddd')]: moment(searchDate).day(p).format(FORMAT),
      }
    })
  }
  if (engine === 'ctrip') return ctripDates(searchDate)
  else if (engine === 'qpx') return gDates(searchDate)
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
gtesting = buildSlices(buildRWindow(startDate(),1))
ctesting = buildRWindow(startDate(),1,'ctrip')

  //using ctrip
  function findcFlights(dayDates, homeCity, destCity){
    return new Promise((resolve, reject) => {
      let flightList = []
      let flightResults = {}
      //loop through dates provided and build cflights-style queries
      _.forOwn(dayDates, (weekObj, week) => {
        weekObj.map((dates) => {
          _.forOwn(dates, (date, day) => {
            let flight = {
              DCity:'',
              ACity:'',
              DDate:'',
            }
            if (day.match(/(Thu)|(Fri)/)){
              flight.DCity = homeCity
              flight.ACity = destCity
              flight.DDate = date
              flightList.push(flight)
            } else {
              flight.DCity = destCity
              flight.ACity = homeCity
              flight.DDate = date
              flightList.push(flight)
            }
          })
        })
      })
      //domestic destinations only need to be called once. refactor later. 
      for (flight of flightList) {
        for (let i = 1; i<=3; i++){
          let newFlight = Object.assign({},flight)
          newFlight.pToken = i

          q.add(() => cfClient.oneWay(newFlight).then( results => {
            flightResults[newFlight.DCity + newFlight.ACity + newFlight.DDate + 'p' + newFlight.pToken] = results
            if (Object.keys(flightResults).length === (flightList.length * 3)){
              console.log('done', newFlight)
              return resolve(q.onEmpty().then( () => flightResults))
            } else {
              return console.log(' hi done', newFlight)
            }
          })
          )
        }
      }
    })
  }

//add promise to findcFlights, return the flightResults instead of writing to file,  and then use the code to prep the data to be written. 

//flatten groups into 
//currently all part2 groups have 0 flights. Unclear why. May be a bug in cflights.
const sortCFlightsFromGroups = (groups) => {
  return new Promise((resolve, reject) => {
    let mergedDays = {}
    for (let group in groups) {
      // we are only interested in the Flights Array 
      let rawFlights = groups[group].FlightIntlAjaxResults
      let dayName = group.substr(0, 16)
      if (!mergedDays[dayName]) {
        mergedDays[dayName] = []
      }
      //loop through each flight and extract relevant info. 
      for (let flight in rawFlights) {
        //drop the uneeded nested objects and some properties
        let flightPresent
        let rawFlight = _.omitBy(rawFlights[flight], _.isObject)
        rawFlight = _.omit(rawFlight, ['guid', 'isCheap', 'hasBOGO', 'isShortest', 'isShowPic', 'transitVisa'])
        //their api seems to sort the prices $ - $$$, so we take the first one. 
        rawFlight.lowestPrice = rawFlights[flight].flightIntlPolicys[0].ViewTotalPrice
        //check if the flight has already been processed from a previous group

        for (let dayFlight in mergedDays[dayName]) {
          try {
            assert.deepEqual(mergedDays[dayName][dayFlight], rawFlight)
            flightPresent = true
            break
          } catch (error) {}
        }

        if (flightPresent) {
          console.log("flight already exisits . . . skipping")
        } else {
          mergedDays[dayName].push(rawFlight)
        }
      }
    }
    //sort each day's flights by $ - $$$
    for (day in mergedDays) {
      mergedDays[day].sort((flight1, flight2) => {
        return flight1.lowestPrice - flight2.lowestPrice
      })
    }
    resolve(mergedDays)
  })
}

//sortCFlightsFromGroups(testJson)

const findCheapestFlight = (origin, flights) => {
  return new Promise((resolve, reject) => {
    let sortedFlights = []
    for (let flight of flights) {
      if (flight.departureCity === origin) {
        sortedFlights.push(flight)
      }
    }
    sortedFlights.sort((flight1, flight2) => {
      return flight1.lowestPrice - flight2.lowestPrice
    })

    resolve(sortedFlights)
  });
}

//let cheapDeparture = findCheapestFlight('SHA', parsedFlights)

const gtesting = buildSlices(buildRWindow(startDate(),1))
const ctesting = buildRWindow(startDate(),1,'ctrip')

let test;

findcFlights(ctesting,'kmg','dig').then( results => sortCFlightsFromGroups(results)).then( results => test = results)
/* DB Structure:
use route as "primary key" for an index with essential info. 
ROUTE (based on city code):
SHA - HKG: {
  week1: {
    departures: {
      flight1: {
        priceRMB: 123,
        number: MU245,
        minLength: 124
        detailedID: h3hk5bzkl35
      },
      flight2: {},
      flight3: {},
    }
    returns: {
      flight1: {},
      flight2: {},
      flight3: {},
    }
  }
}

*/

  // using QPX, which doesnt actually do what I want. Not sure I can, given the restraints of their API.
  function findgFlights(slices) {
    let data = {
      passengers: { adultCount: 1 },
      slice: [],
      solutions: 10
    }
    _.forOwn(slices, (weekObj, week) => {
      _.forOwn(weekObj, (slice, day) => {
        data.slice.push(slice)
      })
    })
    return new Promise((resolve, reject) => {
      resolve(data)
    });  
  //return qpx.search(data).then(results => console.log(results))
}
