// main.js
import { wireAuthControls, wireAppControls, wireAuthState } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  wireAuthControls();
  wireAppControls();
  wireAuthState();
});
