import { sin, cos } from 'mathjs';

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; 

    const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

    
    [lat1, lon1, lat2, lon2] = [lat1, lon1, lat2, lon2].map(toRadians);

    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;

    const a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance 
}


export default {
    haversine
}