const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: "https://thel-ed136-default-rtdb.firebaseio.com"
});

const db = firebaseAdmin.firestore();
module.exports = db;
