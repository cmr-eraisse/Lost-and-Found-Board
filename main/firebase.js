const firebaseConfig = {
	apiKey: "AIzaSyCWGNs6gkETXPFq7-PApK4eOBkZ65LdMtg",
	authDomain: "lost-and-found-board-6bc9b.firebaseapp.com",
	databaseURL: "https://lost-and-found-board-6bc9b-default-rtdb.firebaseio.com",
	projectId: "lost-and-found-board-6bc9b",
	storageBucket: "lost-and-found-board-6bc9b.firebasestorage.app",
	messagingSenderId: "530356685179",
	appId: "1:530356685179:web:7ddbf80cf3e3b48943d5de",
	measurementId: "G-5WMS6RH4T9",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
	getDatabase,
	ref,
	push,
	set,
	onValue,
	update,
	remove,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export { ref, push, set, onValue, update, remove };
