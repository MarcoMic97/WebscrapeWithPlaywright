import haversine from './airportDistance';

const distance = haversine.haversine(55.617900848389, 12.656000137329, 43.6772003174, -79.63059997559999);

console.log('INPUT DEPARTURE IATA CODE: CPH');
const departure = 'CPH';
console.log('INPUT ARRIVAL IATA CODE: YYZ');
const arrival = 'YYZ';

console.log(`The distance between ${departure} and ${arrival} is ${distance} km`);