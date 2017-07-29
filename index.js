const getRoute = require('./getRoute.js');

const routes = [
  {"sha":[
    "xnn"
    ]},
  {"kmg":[
    "ljg"
  ]}
]

function getRoutes(weeks, routes) {
  routes.forEach(route => {
    for (destination in route) {
      try {
        const flights = getRoute(weeks, 'ctrip', Object.getOwnPropertyNames(route)[0], destination)
        console.log(flights)
        return flights
      } catch (error) {
        console.error(error);
      }
    }
  });
}
//let flights = getRoute(1,'ctrip','sha','xnn').then(results => flights = results)