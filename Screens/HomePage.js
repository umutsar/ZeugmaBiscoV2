
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Button, Text, PermissionsAndroid, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { UsbSerialManager } from 'react-native-usb-serialport-for-android';
import Toast from 'react-native-toast-message';
import MapView, {
    Marker,
    AnimatedRegion,
    Polyline,
    PROVIDER_GOOGLE
} from "react-native-maps";
import GetLocation from 'react-native-get-location'
import MapViewDirections from 'react-native-maps-directions';

import { useNavigation } from '@react-navigation/native';

const GOOGLE_MAPS_APIKEY = "AIzaSyBZaS1UzM75Cn8sthSg4mMyffKGKFW3jqg"

const getLiveLocation = async () => {
    try {
        const location = await GetLocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 60000,
        });
        console.log(location);
        return location;
    } catch (error) {
        const { code, message } = error;
        console.warn(code, message);
    }
};


const HomePage = () => {
    const navigation = useNavigation();
    const [receivedData, setReceivedData] = useState();
    const [usbSerialPort, setUsbSerialPort] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [temp, setTemp] = useState(0);
    const [sumVoltage, setSumVoltage] = useState(0);
    const [soc, setSoc] = useState(0);
    const [distanceCovered, setDistanceCovered] = useState(0);
    const [maxVoltage, setMaxVoltage] = useState(0);
    const [powerWatt, setPowerWatt] = useState(0);
    const [distanceCoveredPrevious, setDistanceCoveredPrevious] = useState(0);
    const [range, setRange] = useState(0);
    const [faults, setFaults] = useState([]);
    const [chargeStatus, setChargeStatus] = useState(0);
    const [dataLength, setDataLength] = useState(0);
    const [firstByte, setFirstByte] = useState(0);
    const [type, setType] = useState('');
    const [devicesState, setDevicesState] = useState([]); // Burda kaldım
    const [deviceFlag, setDeviceFlag] = useState(0);
    const [previousTime, setPreviousTime] = useState(0);
    const [setIntervalFlag, setSetIntervalFlag] = useState(1);
    const [socErrorMessageFlag, setSocErrorMessageFlag] = useState(1);

    const [enlem, setEnlem] = useState(0);
    const [boylam, setBoylam] = useState(0);
    const [region, setRegion] = useState(
        {
            latitude: 37.038533,
            longitude: 37.317839,
            latitudeDelta: 0.001844,
            longitudeDelta: 0.00842,
        })
    const [isMapReady, setIsMapReady] = useState(false);



    useEffect(() => {
        const intervalId = setInterval(async () => {
            const location = await getLiveLocation();
            if (location) {
                setEnlem(location.latitude);
                setBoylam(location.longitude);
                console.log("Enlem", enlem);
                console.log("Boylam", boylam);

                setRegion({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01844, 
                    longitudeDelta: 0.0842,
                });
            }
        }, 1500);

        
        return () => {
            clearInterval(intervalId);
        };
    });



    const toastConfig = {
        success: ({ text1, text2 }) => (
            <View style={styles.toastContainer}>
                <View style={styles.toastContent}>
                    <Text style={styles.toastTitle}>{text1}</Text>
                    {text2 ? <Text style={styles.toastMessage}>{text2}</Text> : null}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => Toast.hide()}
                    >
                        <Text style={styles.closeButtonText}>X</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ),
        error: ({ text1, text2 }) => (
            <View style={[styles.toastContainer, { backgroundColor: '#f44336' }]}>
                <View style={styles.toastContent}>
                    <Text style={styles.toastTitle}>{text1}</Text>
                    {text2 ? <Text style={styles.toastMessage}>{text2}</Text> : null}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => Toast.hide()}
                    >
                        <Text style={styles.closeButtonText}>X</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ),
        info: ({ text1, text2 }) => (
            <View style={[styles.toastContainer, { backgroundColor: '#2196f3' }]}>
                <View style={styles.toastContent}>
                    <Text style={styles.toastTitle}>{text1}</Text>
                    {text2 ? <Text style={styles.toastMessage}>{text2}</Text> : null}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => Toast.hide()}
                    >
                        <Text style={styles.closeButtonText}>X</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ),
    };





    // function startUSBMonitoring() {
    //     const intervalId = setInterval(async () => {
    //         try {
    //             const devices = await UsbSerialManager.list();
    //             if (devices.length > 0) {
    //                 clearInterval(intervalId);
    //                 await requestUSBPermission(devices[0]);
    //             } else {
    //                 console.log('No USB devices found, retrying...');
    //             }
    //         } catch (err) {
    //             console.error('Error scanning for devices:', err);
    //         }
    //     }, 1000);
    // }

    async function requestUSBPermission() {
        try {
            setUsbSerialPort(null)
            const grantedStorage = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: "Bisco Telemetri İzni İstiyor :')",
                    message: "Bana izin ver",
                    buttonNeutral: "Şimdilik Kalsın",
                    buttonNegative: "İzin verme :(",
                    buttonPositive: "Gelsin Veriler!"
                }
            );

            if (grantedStorage !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Storage permission denied');
                return;
            }

            const devices = await UsbSerialManager.list();
            setDeviceFlag(devices[0]);

            if (devices.length > 0) {
                let grantedUSB = await UsbSerialManager.tryRequestPermission(devices[0].deviceId);
                await new Promise(resolve => setTimeout(resolve, 50));
                grantedUSB = await UsbSerialManager.tryRequestPermission(devices[0].deviceId);

                if (grantedUSB) {
                    setSetIntervalFlag(1);
                    // Alert.alert('USB permission granted');
                    const port = await UsbSerialManager.open(devices[0].deviceId, {
                        baudRate: 115200,
                        parity: 0,
                        dataBits: 8,
                        stopBits: 1,
                    });
                    setUsbSerialPort(port);
                } else {
                    Alert.alert('USB permission denied');
                }
            } else {
                Alert.alert('No USB devices found');
            }

        } catch (err) {
            console.error('Error requesting permission:', err);
            Alert.alert('Error', err.message);
        }

    }

    useEffect(() => {
        let subscription;
        let dataCheckInterval;
        if (usbSerialPort) {
            subscription = usbSerialPort.onReceived((event) => {
                setPreviousTime(new Date());
                const data = event.data;
                let modifiedSoc = 0;

                if (data[data.length - 1] + data[data.length - 2] != "FF") {
                    // Birinci Paket
                    const modifiedData = data.split("FF").filter(part => part.length > 0).map(part => parseInt(part, 16));
                    if (modifiedData[2] - 40 > 90) { return }
                    // let dataDecimalArray = [];

                    // setFirstByte(modifiedData[0]);
                    setDataLength(modifiedData.length);

                    setSpeed(parseFloat(((modifiedData[1] << 8) | modifiedData[0]) / 200).toFixed(2));
                    setTemp(modifiedData[2] - 40);
                    setSumVoltage(((modifiedData[3] << 8) | modifiedData[4]) / 10);
                    setDistanceCovered((modifiedData[5] << 8) | modifiedData[6]); // Cm cinsinden 
                    setRange(20000 - distanceCovered / 100);
                }
                else {
                    // İkinci Paket
                    const modifiedData = data.split("FF").filter(part => part.length > 0).map(part => parseInt(part, 16));
                    modifiedSoc = (modifiedData[4] << 8) | modifiedData[5]
                    if (modifiedSoc > 1000 || modifiedSoc < 0) { return }
                    // let dataDecimalArray = [];

                    // setFirstByte(modifiedData[0]);
                    setDataLength(modifiedData.length);
                    setPowerWatt((modifiedData[0] << 8) | modifiedData[1]);
                    setMaxVoltage((modifiedData[2] << 8) | modifiedData[3]);
                    setSoc(modifiedSoc / 10);
                    if (soc < 20) {
                        setSocErrorMessageFlag(socErrorMessageFlag + 1);
                    }
                    else {
                        setSocErrorMessageFlag(0);
                    }
                    if (socErrorMessageFlag == 3) {
                        Toast.show({
                            type: 'error',
                            position: 'bottom',
                            text1: "Şarj",
                            text2: "Bisco'nun şarja ihtiyacı var :(",
                            visibilityTime: 60000,
                            autoHide: true,
                            onShow: () => { },
                            onHide: () => { },
                        })
                    }

                }


            });

            return () => {
                if (subscription) {
                    subscription.remove();
                }
                if (usbSerialPort) {
                    usbSerialPort.close();
                    setUsbSerialPort(null);
                }

            };
        }

    }, [usbSerialPort]);

    const initialRegion = {
        latitude: 39.599998474121094,
        longitude: 37.0391365,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002
    };

    const handleMapPress = (e) => {
        console.log(e.nativeEvent.coordinate);
        setEnlem(e.nativeEvent.coordinate.latitude);
        setBoylam(e.nativeEvent.coordinate.longitude);
    };

    const handleMapLayout = () => {
        setIsMapReady(true);
    };

    const origin = { latitude: 37.038533, longitude: 37.317839 };
    const destination = { latitude: 37.042868, longitude: 37.312491 };
    // Örnek konumlar:
    // 37.038533, 37.317839 Zeugma
    // 37.042868, 37.312491 Yurt

    return (
        <View style={{ flex: 1 }}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#fff"
                translucent={false}
            />

            <ScrollView style={styles.container}>

                <View style={styles.header}>
                    <Button onPress={requestUSBPermission} title="Bağlan" color="#007BFF" />
                    <Button onPress={() => navigation.navigate('Yol Tarifi')} style={{}} title="Yol Tarifi" color="#fa0000" />
                </View>
                <TouchableOpacity onPress={() => {
                    Toast.show({
                        type: 'error',
                        position: 'bottom',
                        text1: "Şarj",
                        text2: "Bisco'nun şarja ihtiyacı var :(",
                        visibilityTime: 60000,
                        autoHide: true,
                        onShow: () => { },
                        onHide: () => { },
                    })
                }}>

                    <Text> Debug </Text>
                </TouchableOpacity>

                <MapView initialRegion={region} style={styles.mapStyle}>
                    <MapViewDirections
                        origin={origin}
                        destination={destination}
                        apikey={GOOGLE_MAPS_APIKEY}
                    />
                </MapView>



                <View style={styles.speedSection}>
                    <Text style={styles.sectionTitleSpeed}>Hız</Text>
                    <Text style={styles.speedData}>{speed}</Text>
                </View>



                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Şarj</Text>
                    <Text style={styles.data}>{soc} %</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Alınan Mesafe</Text>
                    <Text style={styles.data}>{distanceCovered / 100} m</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Voltaj</Text>
                    <Text style={styles.data}>{sumVoltage} V</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sıcaklık</Text>
                    <Text style={styles.data}>{temp} °C</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Max Pil Voltajı</Text>
                    <Text style={styles.data}>{maxVoltage / 1000} V</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Harcanan Güç</Text>
                    <Text style={styles.data}>{powerWatt} W</Text>
                </View>



                {/* <View style={styles.section}>
                <Text style={styles.sectionTitle}>En Son Alınan Mesafe</Text>
                <Text style={styles.data}>{distanceCoveredPrevious} km</Text>
            </View> */}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Menzil</Text>
                    <Text style={styles.data}>{range} m</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Şarj Durumu</Text>
                    <Text style={styles.data}>{chargeStatus ? "Şarj Oluyor" : "Şarj Olmuyor"}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Arıza</Text>
                    <Text style={styles.data}>
                        {/* {faults[0]}, {faults[1]}, {faults[2]}, {faults[3]}, {faults[4]} */}
                        Yakında...
                    </Text>
                </View>

                <View style={styles.altBosluk}>

                </View>

            </ScrollView >

            <Toast style={{ position: 'absolute' }} config={toastConfig} />
        </ View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        marginTop: 16
    },
    header: {
        marginBottom: 20,
    },
    dataContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },


    mapStyle: {
        width: '100%',
        height: 240,
    },


    data: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    dataInfo: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    section: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },

    altBosluk: {
        marginBottom: 24
    },

    speedSection: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        alignItems: 'center'
    },


    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007BFF',
        marginBottom: 8,
    },

    sectionTitleSpeed: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#007BFF',
    },

    speedData: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#333',

    },
    toastContainer: {
        padding: 15,
        marginHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#4caf50',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        width: '95%'
    },
    toastContent: {
        flexDirection: 'column',
    },
    toastTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    toastMessage: {
        color: '#fff',
        fontSize: 18,
        marginTop: 5,
    },
    closeButton: {
        marginTop: 0,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignSelf: 'flex-end',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 14,
    },
});


export default HomePage;
