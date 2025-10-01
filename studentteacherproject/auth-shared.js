// auth-shared.js
import { auth } from './init-firebase.js';

// helper
export { auth };
export const onAuthStateChanged = auth.onAuthStateChanged.bind(auth);
