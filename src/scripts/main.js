function fetchShotValues() {
    const ref = database.ref("gameData");
    ref.on("value", (snapshot) => {
        const data = snapshot.val();
        displayData(data);
    });
}

const COURSES = {
    'Toad Highlands': 0,
    'Koopa Park': 1,
    'Shy Guy Desert': 2,
    "Yoshi's Island": 3,
    'Boo Valley': 4,
    "Mario's Star": 5
};

function showMapPosition(ballX, ballZ, pinX, pinZ, courseNumber, holeNumber) {
    const mapModal = document.getElementById('map-modal');

    mapModal.style.display = 'flex';
    updateCourseImage(courseNumber, holeNumber);

    displayDistanceFromPin(ballX, ballZ);
    const ballPosition = positionBallMarker(ballX, ballZ);
    const pinPosition = positionPinMarker(pinX, pinZ);

    drawLine(ballPosition, pinPosition);
}

function updateCourseImage(courseNumber, holeNumber) {
    const courseImage = document.querySelector('.course-image');
    courseImage.src = `/img/course${courseNumber}/hole${holeNumber}.png`;
}

function drawLine(ballPosition, pinPosition) {
    const mapSvg = document.getElementById('map-svg');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', ballPosition.x);
    line.setAttribute('y1', ballPosition.y);
    line.setAttribute('x2', pinPosition.x);
    line.setAttribute('y2', pinPosition.y);
    line.setAttribute('stroke', 'white');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '5,5');
    line.setAttribute('stroke-dashoffset', '10');

    while (mapSvg.firstChild) {
        mapSvg.removeChild(mapSvg.firstChild);
    }

    mapSvg.appendChild(line);

    let offset = 10;
    const animateLine = () => {
        offset -= 0.2;
        if (offset < 0) {
            offset = 10;
        }
        line.setAttribute('stroke-dashoffset', offset);
        requestAnimationFrame(animateLine);
    };

    animateLine();
}

function hideMapPosition() {
    const mapModal = document.getElementById('map-modal');
    mapModal.style.display = 'none';
}

const pixelStartX = 140;
const pixelStartY = 414;
const gameStartX = 1904640;
const gameStartZ = 6820864;

const scaleX = 256 / (4194304 - 0);
const scaleZ = 512 / (8388608 - 0);

function getBallPositionOnImage(ballX, ballZ) {
    const pixelX = (ballX - gameStartX) * scaleX + pixelStartX;
    const pixelY = (ballZ - gameStartZ) * scaleZ + pixelStartY;
    return { x: pixelX, y: pixelY };
}

function positionBallMarker(ballX, ballZ) {
    const position = getBallPositionOnImage(ballX, ballZ);
    const ballMarker = document.getElementById('ball-marker');
    ballMarker.style.left = `${position.x}px`;
    ballMarker.style.top = `${position.y}px`;
    return position;
}

function positionPinMarker(pinX, pinZ) {
    const pinPosition = getBallPositionOnImage(pinX, pinZ);
    const pinMarker = document.getElementById('pin-marker');
    pinMarker.style.left = `${pinPosition.x}px`;
    pinMarker.style.top = `${pinPosition.y}px`;
    return pinPosition;
}

function calculateDistance(x1, z1, x2, z2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
}

const ballStartX = 1904640;
const ballStartZ = 6820864;
const pinX = 1759533;
const pinZ = 1374644;
const knownDistanceYards = 387;
const distanceInGameCoordinates = calculateDistance(ballStartX, ballStartZ, pinX, pinZ);
const conversionFactor = knownDistanceYards / distanceInGameCoordinates;

function displayDistanceFromPin(ballX, ballZ) {
    const currentDistanceInGameCoordinates = calculateDistance(ballX, ballZ, pinX, pinZ);
    const distanceInYards = currentDistanceInGameCoordinates * conversionFactor;
    const distanceDisplay = document.getElementById('distance-display');
    distanceDisplay.textContent = `Distance to Pin: ${distanceInYards.toFixed(2)} yards`;
}

function displayData(data) {
    const dataContainer = document.getElementById("data-container");
    dataContainer.innerHTML = "";

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const shotData = data[key];
            const cardHtml = `
                <div class="card">
                    <div class="card-header">
                        Shot Data
                        <img src="img/gol.png" alt="Golf Icon" class="golf-icon" />
                    </div>
                    <div class="card-content">
                        <div class="main-data">
                            <div class="data-field"><span class="label">Course:</span> <span class="value">${shotData.course}</span></div>
                            <div class="data-field"><span class="label">Hole:</span> <span class="value">${shotData.hole}</span></div>
                            <div class="data-field"><span class="label">Strokes:</span> <span class="value">${shotData.strokes}</span></div>
                        </div>
                        <button class="dropdown-btn map-position-btn" onclick="showMapPosition(${shotData.ballX}, ${shotData.ballZ}, ${shotData.pinX}, ${shotData.pinZ}, ${COURSES[shotData.course]}, ${shotData.hole})">Map Position</button>
                        <button class="dropdown-btn more-details-btn" onclick="toggleDropdown('dropdown-${key}', this)">More Details</button>
                        <div class="additional-data" id="dropdown-${key}" data-key="${key}">
                            <div class="data-field">
                                <span class="label">Ball Position:</span> 
                                <span class="value">[${shotData.ballX}, ${shotData.ballY}, ${shotData.ballZ}]</span>
                            </div>
                            <div class="data-field">
                                <span class="label">Pin Position:</span> 
                                <span class="value">[${shotData.pinX}, ${shotData.pinZ}]</span>
                            </div>
                            <div class="data-field">
                                <span class="label">Camera Position:</span> 
                                <span class="value">[${shotData.cameraY}, ${shotData.cameraZ}]</span>
                            </div>
                            <div class="data-field">
                                <span class="label">Club:</span> 
                                <span class="value">${shotData.club}</span>
                            </div>
                            <div class="data-field">
                                <span class="label">Shot Angle:</span> 
                                <span class="value">${shotData.shotAngle}</span>
                            </div>
                            <div class="data-field">
                                <span class="label">Spin:</span> 
                                <span class="value">X: ${shotData.spinX}, Y: ${shotData.spinY}</span>
                            </div>
                            <div class="data-field">
                                <span class="label">Wind:</span> 
                                <span class="value">${shotData.windSpeed} m/s at ${shotData.windAngle} degrees</span>
                            </div>
                            <div class="data-field">
                                <span class="label">Shot Type:</span> 
                                <span class="value">${shotData.type}</span>
                            </div>
                            <div class="data-field">
                                <span class="label">Weather:</span> 
                                <span class="value">${shotData.weather}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        All values are in real-time
                    </div>
                </div>
            `;

            dataContainer.innerHTML += cardHtml;
        }
    }
}

function toggleDropdown(dropdownId, button) {
    const dropdown = document.getElementById(dropdownId);
    const isExpanded = dropdown.style.maxHeight && dropdown.style.maxHeight !== '0px';

    button.innerText = isExpanded ? 'More Details' : 'Less Details';

    if ('dropdown-' + dropdown.getAttribute('data-key') === dropdownId) {
        dropdown.style.maxHeight = isExpanded ? '0' : dropdown.scrollHeight + 'px';
        dropdown.style.paddingTop = isExpanded ? '0' : '15px';
        dropdown.style.paddingBottom = isExpanded ? '0' : '15px';
    } else {
        dropdown.style.maxHeight = '0';
        dropdown.style.paddingTop = '0';
        dropdown.style.paddingBottom = '0';
    }
}
