/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useCallback, useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Platform,
  PermissionsAndroid,
  Dimensions,
  Alert,
  Button,
  TouchableOpacity,
} from 'react-native';
import Geolocation, {
  GeolocationResponse,
} from '@react-native-community/geolocation';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import MapView, {
  MapPressEvent,
  PROVIDER_GOOGLE,
  Region,
  enableLatestRenderer,
  Marker,
  MapMarkerProps,
} from 'react-native-maps';
import {Socket, io} from 'socket.io-client';
import {DefaultEventsMap} from '@socket.io/component-emitter';
import {CalcRegion} from './src/util/CalcRegion';

const {width, height} = Dimensions.get('screen');

interface propsApi {
  onlineUsers?: number;
  online: boolean;
}

const url = 'http://192.168.1.139:3333';

function App(): React.JSX.Element {
  const [name, setName] = useState(() => {
    const caracters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let genName = '';
    for (let i = 0; i < 5; i += 1) {
      genName += caracters[Math.floor(Math.random() * caracters.length)];
    }

    return genName;
  });
  const [socket, setSocket] =
    useState<Socket<DefaultEventsMap, DefaultEventsMap>>();
  const [permitionLocation, setPermitionLocation] = useState(false);
  const [region, setRegion] = useState<Region | undefined>({
    latitude: 37.786385,
    longitude: -122.40574666666667,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [watchId, setWatchId] = useState<number | null>(null);
  const [markers, setMarkers] = useState<MapMarkerProps[]>([
    // {id: '1', coordinate: {latitude: 37.34281, longitude: -121.982655}},
    // {id: '2', coordinate: {latitude: 37.34315, longitude: -121.97613166666666}},
    // {
    //   id: '3',
    //   coordinate: {latitude: 37.33946666666667, longitude: -121.97990833333333},
    // },
  ]);
  const [position, setPosition] = useState<MapMarkerProps | undefined>();
  const [propsApi, setPropsApi] = useState<propsApi>();

  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const handleSendLocation = useCallback(
    (location: MapMarkerProps) => {
      if (!socket) {
        return;
      }
      socket.emit('location', location);
    },
    [socket],
  );

  const updatePins = useCallback(
    (event: MapMarkerProps) => {
      let pin: MapMarkerProps = {
        id: event.id,
        coordinate: {
          latitude: event.coordinate.latitude,
          longitude: event.coordinate.longitude,
        },
        pinColor: '#FF0000',
      };

      if (
        !propsApi?.online ||
        !(propsApi?.onlineUsers && propsApi.onlineUsers > 0)
      ) {
        setRegion(CalcRegion([pin]));
      }

      setRegion(CalcRegion(markers));

      setMarkers(prevData => {
        const index = prevData.findIndex(item => item.id === pin.id);
        if (index !== -1) {
          return [
            ...prevData.slice(0, index),
            {...prevData[index], coordinate: pin.coordinate},
            ...prevData.slice(index + 1),
          ];
        } else {
          return [...prevData, pin];
        }
      });
    },
    [markers, propsApi?.online, propsApi?.onlineUsers],
  );

  const watchPosition = useCallback(() => {
    if (!socket) {
      return;
    }

    if (
      watchId === null
      // && socket
    ) {
      const newWatchId = Geolocation.watchPosition(
        success => {
          setPosition({
            coordinate: {
              latitude: success.coords.latitude,
              longitude: success.coords.longitude,
            },
            id: name,
          });

          handleSendLocation({
            coordinate: {
              latitude: success.coords.latitude,
              longitude: success.coords.longitude,
            },
            id: name,
            pinColor: '#ff0000',
          });
        },
        error => {
          console.error(error);
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          distanceFilter: 10,
        },
      );
      setWatchId(newWatchId);
    }
  }, [handleSendLocation, name, socket, watchId]);

  const getLocationPermition = useCallback(async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setPermitionLocation(true);
      }
    } else {
      Geolocation.requestAuthorization(
        () => {
          setPermitionLocation(true);
        },
        error => {
          console.log(error);
        },
      );
    }
  }, []);

  const connectSocket = useCallback(() => {
    const newSocket = io(url, {
      query: {
        // room: 'sala',
        name,
      },
      forceNew: true,
      autoConnect: true,
    });
    return newSocket;
  }, [name]);

  const seeAllMarkers = useCallback(() => {
    setRegion(undefined);
    setRegion(CalcRegion(markers));
  }, [markers]);

  useEffect(() => {
    if (position) {
      setRegion(CalcRegion([position]));
    }
  }, [position]);

  useEffect(() => {
    if (permitionLocation && socket) {
      watchPosition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permitionLocation, socket]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    if (socket) {
      getLocationPermition();

      socket.emit('teste', 'request');

      socket.on('teste', param => {
        console.log(param);
        setPropsApi(props => ({
          onlineUsers: props?.onlineUsers,
          online: props?.online || false,
        }));
      });

      socket.on('location', (res: MapMarkerProps) => {
        if (res.id !== name) {
          updatePins(res);
        }
      });

      return;
    } else {
      const connection = connectSocket();
      setSocket(connection);
      return () => {
        connection.close();
      };
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    if (!socket) {
      const connection = connectSocket();
      setSocket(connection);
      return () => {
        connection.close();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('region:', region);
  }, [region]);

  if (!permitionLocation) {
    return (
      <View>
        <Text
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}>
          Você precisa autorizar o uso do GPS
        </Text>
        <Text
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            textAlign: 'center',
          }}>
          {name}
        </Text>
        <Text
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            textAlign: 'center',
          }}>
          {socket?.connected ? 'ON' : 'OFF'}
        </Text>
        {socket && !socket.connected && (
          <Button
            title="conectar"
            onPress={() => setSocket(socket.connect())}
          />
        )}
        {socket?.connected && (
          <Button title="autorizar" onPress={() => getLocationPermition()} />
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={[backgroundStyle, {flex: 1}]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      <View
        style={{
          flex: 1,
        }}>
        <View
          style={{
            position: 'absolute',
            bottom: 30,
            right: 30,
            zIndex: 1,
          }}>
          <TouchableOpacity
            style={{
              width: 50,
              height: 50,
              backgroundColor: 'blue',
              borderRadius: 999,
            }}
            onPress={seeAllMarkers}
          />
        </View>
        <MapView
          provider={PROVIDER_GOOGLE} // remove if not using Google Maps
          style={styles.map}
          region={region}
          zoomEnabled={true}
          showsUserLocation={true}
          loadingEnabled={true}>
          {markers.map(marker => {
            return (
              <Marker
                key={marker.id}
                coordinate={marker.coordinate}
                pinColor={marker.pinColor}
              />
            );
          })}
        </MapView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: {
    // width: width,
    // height: height,
    height: '100%',
  },
  propsApi: {
    flexDirection: 'row',
    marginLeft: 10,
  },
});

export default App;
