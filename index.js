const axios = require("axios");
const admin = require("firebase-admin");

// Initialize Firebase admin SDK
var dataArray = [
  {
    attributes: {
      OBJECTID: 2,
      OCCURRENCE_TIME: 1691579403000,
      DIVISION: "D14",
      LATITUDE: 43.6528131642344,
      LONGITUDE: -79.4005051468804,
      CALL_TYPE_CODE: "DISPU",
      CALL_TYPE: "DISPUTE",
      CROSS_STREETS: "KENSINGTON AVE - AUGUSTA AVE",
      OCCURRENCE_TIME_AGOL: 1691579403000,
    },
    geometry: {
      x: -79.40050514688038,
      y: 43.6528131642344,
    },
  },
];
const serviceAccount = require("./wipg5-d88b1-firebase-adminsdk-2m8g6-876f8c77b8.json"); // Update with your service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Add other Firebase configuration options if needed
});
const firestore = admin.firestore();

const firstApiUrl =
  "https://services.arcgis.com/S9th0jAJ7bqgIRjw/ArcGIS/rest/services/C4S_Public_NoGO/FeatureServer/0/query?where=OBJECTID+%3E+0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=OCCURRENCE_TIME+DESC&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token="; // Replace with your first API URL
const secondApiUrl = "https://crimeappserver.onrender.com/send"; // Replace with your second API URL

async function fetchDataFromFirstApi() {
  try {
    const response = await axios.get(firstApiUrl);

    return response.data.features; // Modify this to extract the relevant data from the response
  } catch (error) {
    console.error("Error fetching data from first API:", error);
    throw error;
  }
}

async function fetchDataFromFirestore() {
  try {
    documentsArray = [];
    const snapshot = await firestore.collection("UserInfo").get();
    snapshot.forEach((doc) => {
      // Push document data into the array
      documentsArray.push(doc.data());
    });
    return documentsArray;
  } catch (error) {
    console.error("Error fetching data from Firestore:", error);
    throw error;
  }
}

async function fetchDataFromSecondApi(token, callMessage) {
  try {
    const postData = {
      fcmToken: token,
      message: callMessage,
    };
    const headers = {
      "Content-Type": "application/json", // Set the appropriate content type
      // Add any other headers you need
    };
    const x = await axios
      .post(secondApiUrl, postData, { headers })
      .then((response) => {
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } catch (error) {
    console.error("Error fetching data from second API:", error);
    throw error;
  }
}

async function main() {
  try {
    let liveCallsArr = await fetchDataFromFirstApi();
    let z = liveCallsArr;
    let y = z.reduce((max, item) => {
      return item.attributes.OCCURRENCE_TIME > max
        ? item.attributes.OCCURRENCE_TIME
        : max;
    }, z[0].attributes.OCCURRENCE_TIME);

    let x = dataArray.reduce(
      (max, item) => {
        return item.attributes.OCCURRENCE_TIME > max
          ? item.attributes.OCCURRENCE_TIME
          : max;
      },
      typeof dataArray[0]?.attributes?.OCCURRENCE_TIME !== "undefined"
        ? dataArray[0].attributes.OCCURRENCE_TIME
        : y
    );

    // dataArray = [
    //     {
    //       attributes: {
    //         OBJECTID: 2,
    //         OCCURRENCE_TIME: 1691579403000,
    //         DIVISION: "D14",
    //         LATITUDE: 43.6528131642344,
    //         LONGITUDE: -79.4005051468804,
    //         CALL_TYPE_CODE: "DISPU",
    //         CALL_TYPE: "DISPUTE",
    //         CROSS_STREETS: "KENSINGTON AVE - AUGUSTA AVE",
    //         OCCURRENCE_TIME_AGOL: 1691579403000,
    //       },
    //       geometry: {
    //         x: -79.40050514688038,
    //         y: 43.6528131642344,
    //       },
    //     },
    //   ];

    dataArray = [];
    liveCallsArr.forEach((item) => {
      if (item.attributes.OCCURRENCE_TIME > x) {
        dataArray.push(item);
      }
    });

    let firestoreData = await fetchDataFromFirestore();
    firestoreData.forEach((user, index) => {
      if (!(typeof user?.location?.enabled === "undefined") && !(typeof user?.fcmToken === "undefined")) {
        dataArray.forEach((item) => {
          if (
            coordsCompare(
              user.location.coords.latitude,
              user.location.coords.longitude,
              item.geometry.y,
              item.geometry.x
            )
          ) {
            fetchDataFromSecondApi({token : user.fcmToken, message: item.attributes.CALL_TYPE});
          }
        });
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

function coordsCompare(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180); // Difference in latitude in radians
  const dLon = (lon2 - lon1) * (Math.PI / 180); // Difference in longitude in radians

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in kilometers

  if (distance < 3) {
    return true;
  } else {
    return false;
  }
}

// Call the main function initially
main();

// Call the main function every 3 minutes
setInterval(main, 5000); // 3 minutes in milliseconds
