//const cflights = require('./index')
//const flight = new cflights
const moment = require('moment')

 let searchDate = new Date()

  const startDate = (date) => {
      let startDate = date || moment()
      if (moment(startDate).day() > 4) {
          startDate = moment(startDate).add(1, 'w')
          return startDate = moment(startDate).day(4).format()
      } else {
          return startDate = moment(startDate).day(4).format()
      }
  }
function buildWindow(date, weeks) {
    let comingWeekends = {}
    let numWeeks = weeks
    let currentDate = date
    while (weeks > 0) {
        let name = `week${weeks}`
        let datePairs = dates(currentDate, 'google') 
        comingWeekends[name] = datePairs
        currentDate = moment(currentDate).add(1, 'w').format()
        weeks--
    }

    return comingWeekends
}
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
              { to:   7 },
              { to:   8 },
        ]
        
      const FORMAT = 'YYYY-MM-DD ddd'

            function gDates(date) {
            console.log('using google dates')
      return SLICES.map((s) => {
            if (s.from) {return { departureDate: moment(searchDate).day(s.from).format(FORMAT) }}
            else {return { returnDate: moment(searchDate).day(s.to).formate(FORMAT) }}
      })
}
      
      function ctripDates(date) {
            console.log('using ctrip dates');
            return PAIRS.map((p) => {
                  return {
                        departureDate: moment(searchDate).day(p.from).format(FORMAT),
                        returnDate: moment(searchDate).day(p.to).format(FORMAT),
                  }
            })
      }
  if (engine = 'ctrip') {return ctripDates(searchDate)} 
  else {return gDates(searchDate) }
}

function buildSlices() {

}

//using ctrip
//flight.oneWay({DCity:'SHA',ACity:'PEK',DDate:'2017-03-17'}).then(results => console.log(results))


// using QPX
