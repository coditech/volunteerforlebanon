import firebase from 'firebase/app';
import 'firebase/firestore'
import 'firebase/storage'

const config = {
  apiKey: "AIzaSyD8njaO-RRPTxG1peS4L5hQ8u5bwTnkN5I",
  authDomain: "volunteer-387bc.firebaseapp.com",
  databaseURL: "https://volunteer-387bc.firebaseio.com",
  projectId: "volunteer-387bc",
  storageBucket: "volunteer-387bc.appspot.com",
  messagingSenderId: "771743899415"
};


firebase.initializeApp(config);
export const db = firebase.firestore();

db.settings({timestampsInSnapshots: true})
export const storage = firebase.storage().ref();