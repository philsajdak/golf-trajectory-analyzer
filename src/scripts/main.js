import {
    COURSES,
    gameSettings,
    uiElements
} from "./constants.js";

const {
    cballStartX,
    cballStartZ,
    cpinX,
    cpinZ,
    cknownDistanceYards,
    imageWidth,
    scaleX,
    scaleZ
} = gameSettings;
const {
    mapModal,
    closeButton,
    mapSvg,
    compassArrow,
    windSpeedDisplay,
    distanceDisplay,
    dataContainer,
    tooltip
} = uiElements;

const distanceInGameCoordinates = calculateDistance(cballStartX, cballStartZ, cpinX, cpinZ);
const conversionFactor = cknownDistanceYards / distanceInGameCoordinates;

document.addEventListener("DOMContentLoaded", () => {
    fetchShotValues();
    setupEventListeners([mapModal, closeButton], "click", hideMapPosition);
});

function setupEventListeners(elements, eventType, handler) {
    elements.forEach((element) => element && element.addEventListener(eventType, handler));
}

// Retrieves and processes shot value data from a database, updating the UI
async function fetchShotValues() {
    const snapshot = await database.ref("gameData").once("value");
    displayData(Object.entries(snapshot.val()).map(([key, value]) => ({
        ...value,
        key
    })));
}

// Draws the actual trajectory path based on start, flight, and end coordinates
function drawTrajectory(startCoord, flightPathCoords, endCoord) {
    let d = "";
    let coordinates = [startCoord, ...flightPathCoords, endCoord];

    if (coordinates.length < 2) {
        return; // Not enough points to draw a curve
    }

    d += `M ${coordinates[0].x},${coordinates[0].y} `;
    for (let i = 1; i < coordinates.length - 1; i++) {
        const thisPoint = coordinates[i];
        const nextPoint = coordinates[i + 1];
        const controlPoint1X = (thisPoint.x + nextPoint.x) / 2;
        const controlPoint1Y = thisPoint.y;
        const controlPoint2X = (thisPoint.x + nextPoint.x) / 2;
        const controlPoint2Y = nextPoint.y;

        d += `C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${nextPoint.x},${nextPoint.y} `;
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    setAttributes(path, {
        d: d,
        stroke: "blue",
        "stroke-width": "2",
        fill: "none",
    });
    mapSvg.appendChild(path);
}

// Calculates an adjusted landing position based on original grid coordinates and wind factors
// This is a simplified model. In reality, this would depend on more complex physics
function calculateAdjustedLandingPosition(originalGridX, originalGridZ, windAngle, windSpeed) {
    const windEffect = calculateWindEffect(windAngle, windSpeed);
    const adjustedGridX = originalGridX + windEffect.x * 15000;
    const adjustedGridZ = originalGridZ + windEffect.y * 12000;

    return {
        x: adjustedGridX,
        y: adjustedGridZ
    };
}

// Determines the effect of wind on a shot using the wind's angle and speed.
// NOTE: Since 0 degrees is to the left in game and increases counter-clockwise, we convert directly to radians
function calculateWindEffect(windAngle, windSpeed) {
    const angleRadians = (windAngle * Math.PI) / 180;
    return {
        x: windSpeed * Math.cos(angleRadians),
        y: windSpeed * Math.sin(angleRadians),
    };
}

// Displays the map modal with updated positions, images, and trajectory for a specific golf shot
function showMapPosition(
    ballX,
    ballZ,
    pinX,
    pinZ,
    courseNumber,
    holeNumber,
    gridX = null,
    gridZ = null,
    windAngle = null,
    windSpeed = null,
    playerAngle = null,
    ballState = null,
    landingX = null,
    landingZ = null,
    flightPath = null
) {
    clearChildNodes(mapSvg);
    mapModal.style.display = "flex";
    updateCourseImage(courseNumber, holeNumber);
    updateCompass(windAngle, windSpeed, playerAngle);
    displayDistanceFromPin(ballX, ballZ, pinX, pinZ);

    const ballPosition = createAndPlaceMarker(ballX, ballZ, "ball-marker", `Starting Ball Position${ballState ? `: ${ballState}` : ""}`);
    const pinPosition = createAndPlaceMarker(pinX, pinZ, "pin-marker", "Current Pin Position");
    const landingPosition = createAndPlaceMarker(landingX, landingZ, "landing-marker", "Actual Ball Landing Position");
    const flight = getFlightPath(flightPath);

    handleGridMarkers(gridX, gridZ, windAngle, windSpeed, ballPosition);
    drawPathToPin(ballPosition, pinPosition, "white", 1.0, true);
    drawTrajectory(ballPosition, flight, landingPosition);
}

// Clears all child nodes of a given DOM element. Implemented for the map modal
function clearChildNodes(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

// Creates and positions a marker on the map, also setting up a tooltip for additional information display
function createAndPlaceMarker(x, y, markerId, tooltipText) {
    const position = positionMarker(x, y, markerId);
    setupTooltipForMarker(markerId, tooltipText);
    return position;
}

// Handles the creation and visibility of the grid markers (calculated yellow markers) based on given coordinates and wind factors
function handleGridMarkers(gridX, gridZ, windAngle, windSpeed) {
    const adjustedGridPosition = calculateAdjustedLandingPosition(gridX, gridZ, windAngle, windSpeed);
    createAndPlaceMarker(adjustedGridPosition.x, adjustedGridPosition.y, "expected-marker", "Calculated Landing Area (100% Velocity)");
    createAndPlaceMarker(gridX, gridZ, "grid-marker", "Calculated Aim Point (100% Velocity)");

    ["grid-marker", "expected-marker"].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.style.visibility = "visible";
        }
    });
}

// Updates the compass display based on wind angle, wind speed, and player's angle
function updateCompass(windAngle, windSpeed, playerAngle) {
    let relativeWindAngle = windAngle - playerAngle;
    relativeWindAngle = (relativeWindAngle + 360) % 360;
    let flippedAngle = (360 - relativeWindAngle) % 360;
    compassArrow.style.transform = `rotate(${flippedAngle}deg)`;
    windSpeedDisplay.innerHTML = `<span class="inner">Wind Speed:</span> ${windSpeed} m/s`;
}

// Sets up a tooltip for a given marker, displaying additional information on hover events
function setupTooltipForMarker(markerId, tooltipText) {
    const marker = document.getElementById(markerId);
    marker.addEventListener("mousemove", function(event) {
        const xOffset = 850; // Offsets
        const yOffset = 200;
        tooltip.style.left = event.clientX - xOffset + "px";
        tooltip.style.top = event.clientY - yOffset + "px";
    });

    marker.addEventListener("mouseover", function() {
        tooltip.textContent = tooltipText;
        tooltip.style.display = "block";
    });

    marker.addEventListener("mouseout", function() {
        tooltip.style.display = "none";
    });
}

// Updates the course image based on the selected course number and hole number.
function updateCourseImage(courseNumber, holeNumber) {
    const courseImage = document.querySelector(".course-image");
    courseImage.src = `/img/course${courseNumber}/hole${holeNumber}.png`;
}

// Used for updating element properties dynamically.
function setAttributes(element, attributes) {
    Object.keys(attributes).forEach((key) => {
        element.setAttribute(key, attributes[key]);
    });
}

// Draws a line representing the shortest path from the ball's starting position to the pin
function drawPathToPin(startPosition, endPosition, lineColor = "white", opacity = 1.0, animate = true) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    setAttributes(line, {
        x1: startPosition.x,
        y1: startPosition.y,
        x2: endPosition.x,
        y2: endPosition.y,
        stroke: lineColor,
        "stroke-width": "2",
        "stroke-dasharray": animate ? "5,5" : "",
        "stroke-dashoffset": animate ? "10" : "",
        opacity: opacity,
    });

    mapSvg.appendChild(line);
    if (animate) animateLine(line);
}

function animateLine(line) {
    let offset = 10;
    const animate = () => {
        offset -= 0.2;
        if (offset < 0) offset = 10;
        line.setAttribute("stroke-dashoffset", offset);
        requestAnimationFrame(animate);
    };
    animate();
}

function hideMapPosition() {
    mapModal.style.display = "none";
}

// Converts game coordinates to pixel coordinates for positioning elements on an image
// NOTE: We invert the X-axis as game's (0,0) is at top-right of the image
function getBallPositionOnImage(x, z) {
    const pixelX = imageWidth - x * scaleX;
    const pixelY = z * scaleZ;
    return {
        x: pixelX,
        y: pixelY
    };
}

// Translates a series of game coordinates into image pixel coordinates for plotting a flight path
function getFlightPath(coordinatesArray) {
    return coordinatesArray.map((coord) => getBallPositionOnImage(coord.x, coord.z));
}

// Positions a visual marker on the game's map based on given X and Z coordinates
function positionMarker(x, z, markerId) {
    const position = getBallPositionOnImage(x, z);
    const marker = document.getElementById(markerId);
    marker.style.left = `${position.x}px`;
    marker.style.top = `${position.y}px`;
    return position;
}

// Calculates the distance between two points in game coordinates
function calculateDistance(x1, z1, x2, z2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
}

// Displays the distance from the ball's position to the pin in yards
function displayDistanceFromPin(ballX, ballZ, pinX, pinZ) {
    const currentDistanceInGameCoordinates = calculateDistance(ballX, ballZ, pinX, pinZ);
    const distanceInYards = currentDistanceInGameCoordinates * conversionFactor;
    distanceDisplay.innerHTML = `<span class="inner">Distance to Pin:</span> ${distanceInYards.toFixed(2)} yards`;
}

// Processes and displays shot data on the UI, creating a card layout for each shot
function displayData(dataArray) {
    dataContainer.innerHTML = "";
    dataArray.forEach((shotData) => {
        const key = shotData.key;
        const cardHtml = generateCardHtml(shotData, key);
        dataContainer.innerHTML += cardHtml;
    });

    attachEventListenersToButtons(dataArray);
}

function generateCardHtml(shotData, key) {
    return `
    <div class="card">
      <div class="card-header">
        Shot Data <span class="shot-date">${shotData.date}</span>
        <img src="img/shot-icon.png" alt="Golf Icon" class="golf-icon" />
      </div>
      <div class="card-content">
        <div class="main-data">
          <div class="data-field"><span class="label">Course:</span> <span class="value">${shotData.course}</span></div>
          <div class="data-field"><span class="label">Hole:</span> <span class="value">${shotData.hole}</span></div>
          <div class="data-field"><span class="label">Strokes:</span> <span class="value">${shotData.strokes}</span></div>
        </div>
        <button class="dropdown-btn map-position-btn" data-key="${key}">Map Position</button>
        <button class="dropdown-btn more-details-btn" data-key="${key}">More Details</button>
        <div class="additional-data" id="dropdown-${key}" data-key="${key}">
          ${generateAdditionalDataFields(shotData)}
        </div>
      </div>
      <div class="card-footer">
        All values are in real-time
      </div>
    </div>
  `;
}

function generateAdditionalDataFields(shotData) {
    const fieldsToShow = {
        "Ball Position": `[${shotData.ballX}, ${shotData.ballY}, ${shotData.ballZ}]`,
        "Pin Position": `[${shotData.pinX}, ${shotData.pinZ}]`,
        "Camera Position": `[${shotData.cameraY}, ${shotData.cameraZ}]`,
        Club: shotData.club,
        "Shot Angle": shotData.shotAngle,
        Spin: `X: ${shotData.spinX}, Y: ${shotData.spinY}`,
        Wind: `${shotData.windSpeed} m/s at ${shotData.windAngle} degrees`,
        "Shot Type": shotData.type,
        Weather: shotData.weather,
    };

    return Object.entries(fieldsToShow)
        .map(([label, value]) => {
            return `<div class="data-field">
                <span class="label">${label}:</span>
                <span class="value">${value}</span>
              </div>`;
        })
        .join("");
}

// Attaches event listeners to buttons for viewing map positions or details
function attachEventListenersToButtons(dataArray) {
    document.querySelectorAll(".map-position-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.getAttribute("data-key");
            const shotData = dataArray.find((dataItem) => dataItem.key === key);
            if (shotData) {
                showMapPosition(
                    shotData.ballX,
                    shotData.ballZ,
                    shotData.pinX,
                    shotData.pinZ,
                    COURSES[shotData.course],
                    shotData.hole,
                    shotData.gridX,
                    shotData.gridZ,
                    shotData.windAngle,
                    shotData.windSpeed,
                    shotData.shotAngle,
                    shotData.ballCondition,
                    shotData.landingX,
                    shotData.landingZ,
                    shotData.trajectory
                );
            }
        });
    });

    document.querySelectorAll(".more-details-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.getAttribute("data-key");
            const dropdownId = "dropdown-" + key;
            toggleDropdown(dropdownId);
        });
    });
}

// Toggles the visibility of additional shot details.
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const card = dropdown.closest(".card");
    const isExpanded = dropdown.style.maxHeight && dropdown.style.maxHeight !== "0px";

    document.querySelectorAll(".additional-data").forEach((d) => {
        d.style.maxHeight = "0";
        const parentCard = d.closest(".card");
        if (parentCard) {
            parentCard.style.maxHeight = "342px";
        }
    });

    if (!isExpanded) {
        dropdown.style.maxHeight = dropdown.scrollHeight + "px";
        if (card) {
            card.style.height = "878px";
            card.style.maxHeight = "878px";
        }
    } else {
        dropdown.style.maxHeight = "0";
        if (card) {
            card.style.maxHeight = "342px";
        }
    }
}