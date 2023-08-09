const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase admin SDK
const dataArray = []
const serviceAccount = require('path/to/your/serviceAccountKey.json'); // Update with your service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Add other Firebase configuration options if needed
});
const firestore = admin.firestore();

const firstApiUrl = 'https://services.arcgis.com/S9th0jAJ7bqgIRjw/ArcGIS/rest/services/C4S_Public_NoGO/FeatureServer/0/query?where=OBJECTID+%3E+0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=OCCURRENCE_TIME+DESC&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=';   // Replace with your first API URL
const secondApiUrl = 'https://crimeappserver.onrender.com/send'; // Replace with your second API URL

async function fetchDataFromFirstApi() {
  try {
    const response = await axios.get(firstApiUrl);
    
    return response.data.features; // Modify this to extract the relevant data from the response

  } catch (error) {
    console.error('Error fetching data from first API:', error);
    throw error;
  }
}

async function fetchDataFromFirestore() {
  try {
    const snapshot = await firestore.collection('UserInfo').get();
    querySnapshot.forEach((documentSnapshot) => {
        const data = documentSnapshot.data();
        console.log(data)
        return data
    })
  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
    throw error;
  }
}

async function fetchDataFromSecondApi() {
  try {
    const response = await axios.post(secondApiUrl);
    return response.data; // Modify this to extract the relevant data from the response
  } catch (error) {
    console.error('Error fetching data from second API:', error);
    throw error;
  }
}

async function main() {
  try {
    const liveCallsArr = await fetchDataFromFirstApi();

    let x = dataArray.reduce((max, item) => {
        return item.attributes.OCCURRENCE_TIME > max ? item.attributes.OCCURRENCE_TIME : max;
      }, dataArray[0].attributes.OCCURRENCE_TIME);

      dataArray = []

    liveCallsArr.forEach((item) => {
        if(item.attributes.OCCURRENCE_TIME > x){
            dataArray.push(item)
        }
      });
    const firestoreData = await fetchDataFromFirestore();
    firestoreData.forEach((user) => {
        if(user.location.enabled){
            dataArray.forEach((item) => {
                if(coordsCompare(user.coords.latitude,user.coords.longitude,item.geometry.x,item.geometry.y)){
                    fetchDataFromSecondApi()
                }
              });
        }
      });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Call the main function initially
main();

// Call the main function every 3 minutes
setInterval(main, 3 * 60 * 1000); // 3 minutes in milliseconds
