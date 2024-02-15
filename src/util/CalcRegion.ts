import {MapMarkerProps, Region} from 'react-native-maps';

const CalcRegion = (pins: MapMarkerProps[]): Region | undefined => {
  if (pins.length === 0) {
    return undefined;
  }
  if (pins.length === 1) {
    return {
      latitude: pins[0].coordinate.latitude,
      longitude: pins[0].coordinate.longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    };
  }

  let somaLatitude = 0;
  let somaLongitude = 0;

  let menorLatitude = Infinity;
  let maiorLatitude = -Infinity;
  let menorLongitude = Infinity;
  let maiorLongitude = -Infinity;

  for (const coordenada of pins) {
    somaLatitude += coordenada.coordinate.latitude;
    somaLongitude += coordenada.coordinate.longitude;

    menorLatitude = Math.min(menorLatitude, coordenada.coordinate.latitude);
    maiorLatitude = Math.max(maiorLatitude, coordenada.coordinate.latitude);
    menorLongitude = Math.min(menorLongitude, coordenada.coordinate.longitude);
    maiorLongitude = Math.max(maiorLongitude, coordenada.coordinate.longitude);
  }

  // Calcula a média das latitudes e longitudes
  const latitudeMedia = somaLatitude / pins.length;
  const longitudeMedia = somaLongitude / pins.length;

  const latitudeDelta = (maiorLatitude - menorLatitude) * 1.2;
  const longitudeDelta = (maiorLongitude - menorLongitude) * 1.2;

  return {
    latitude: latitudeMedia,
    longitude: longitudeMedia,
    latitudeDelta,
    longitudeDelta,
  };
};

export {CalcRegion};
