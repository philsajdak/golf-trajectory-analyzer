export const COURSES = {
    'Toad Highlands': 0,
    'Koopa Park': 1,
    'Shy Guy Desert': 2,
    "Yoshis Island": 3,
    'Boo Valley': 4,
    "Mario's Star": 5
};

// In constants.js
export const uiElements = {
  mapModal: document.getElementById('map-modal'),
  closeButton: document.getElementById('close-map'),
  mapSvg: document.getElementById('map-svg'),
  compassArrow: document.getElementById('compass-arrow'),
  windSpeedDisplay: document.getElementById('wind-speed-display'),
  distanceDisplay: document.getElementById('distance-display'),
  dataContainer: document.getElementById('data-container'),
  tooltip: document.getElementById('tooltip'),
  // Add other UI elements as needed
};

export const gameSettings = {
    cballStartX: 1904640,
    cballStartX: 1904640,
    cballStartZ: 6820864,
    cpinX: 2007921,
    cpinZ: 1421423,
    cknownDistanceYards: 387,
    gameMaxX: 4194304, // Maximum X coordinate in the game
    gameMaxZ: 8388608, // Maximum Z coordinate in the game
    imageWidth: 256, // Width of the course image in pixels
    imageHeight: 512, // Height of the course image in pixels
    scaleX: 256 / 4194304,
    scaleZ: 512 / 8388608
}