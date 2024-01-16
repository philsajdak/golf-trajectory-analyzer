const CLUBS = {
    0: '1 Wood (Driver)', 1: '3 Wood', 2: '4 Wood',
    3: '2 Iron', 4: '3 Iron', 5: '4 Iron',
    6: '5 Iron', 7: '6 Iron', 8: '7 Iron',
    9: '8 Iron', 10: '9 Iron', 11: 'Pitching Wedge',
    12: 'Sand Wedge', 13: 'Putter'
};

const COURSES = {
    0: 'Toad Highlands', 1: 'Koopa Park', 2: 'Shy Guy Desert',
    3: 'Yoshis Island', 4: 'Boo Valley', 5: 'Marios Star',
};

const TYPES = {
    0: 'Power', 1: 'Normal', 2: 'Blue'
};

function getClubType(clubNumber) {
    return CLUBS[clubNumber] || 'Unknown club';
}

function getClubPower(type) {
    return TYPES[type] || 'Unknown';
}

function getCourse(courseNumber) {
    return COURSES[courseNumber] || 'Unknown course';
}

// Conversion functions
function translateWindValue(x) {
    return Math.floor(x / 30000);
}

function convertValue(originalValue, useShortRange) {
    if (useShortRange) {
        return Math.floor((originalValue / 255) * 360);
    }
    const normalized = (originalValue - 11468800) / (4290576384 - 11468800);
    return Math.floor(normalized * 360);
}

function convertSpinX(spinX) {
    const midPoint = 2147483648; // Half of maxInt32
    return (spinX > midPoint) ? -1 * (4294967296 - spinX) / midPoint : spinX / midPoint;
}

function readMemoryValues() {
    return {
        wind: mem.u32[0x800BA9F0],
        pAngle: mem.u32[0x80227150],
        spinXAngle: mem.u32[0x80227160],
        spinYAngle: mem.u32[0x80227164],
        angle: mem.u8[0x800BA9F4],
        club: mem.u32[0x80227154],
        strokes: mem.u8[0x801B71F3],
        rain: mem.u8[0x800BA9FB],
        type: mem.u8[0x800FBE57],
        ballX: mem.s32[0x800FBE64],
        ballY: mem.s32[0x800FBE68],
        ballZ: mem.s32[0x800FBE6C],
        cameraZ: mem.s32[0x800FBE7C],
        cameraY: mem.s32[0x800FBE84],
        //gridX: mem.s32[0x800FBE8C],
        //gridY: mem.s32[0x800FBE90],
        //gridZ: mem.s32[0x800FBE94],
        course: mem.u8[0x801B6097],
        hole: mem.u8[0x801B609B],
        pinX: mem.u32[0x800BA9D8],
        pinZ: mem.u32[0x800BA9E0]
    };
}

function handleData() {
    var memValues = readMemoryValues();
    console.log("Shot Angle: " + convertValue(memValues.pAngle, false));
    console.log("Spin X: " + convertSpinX(memValues.spinXAngle));
    console.log("Spin Y: " + convertSpinX(memValues.spinYAngle));
    console.log("Wind Speed: " + translateWindValue(memValues.wind));
    console.log("Wind Angle: " + convertValue(memValues.angle, true));
    console.log("Club: " + getClubType(memValues.club));
    console.log("Type: " + getClubPower(memValues.type));
    console.log("Strokes: ", memValues.strokes);
    console.log("Weather: ", memValues.rain === 1 ? "Rain" : "Clear");
    console.log("Ball X Position: ", memValues.ballX);
    console.log("Ball Y Position: ", memValues.ballY);
    console.log("Ball Z Position: ", memValues.ballZ);
    console.log("Camera Z Position: ", memValues.cameraZ);
    console.log("Camera Y Position: ", memValues.cameraY);
    console.log("Course: " + getCourse(memValues.course));
    console.log("Hole: " + (memValues.hole + 1));
    console.log("PinX: ", memValues.pinX);
    console.log("PinZ: ", memValues.pinZ);
    
    /* Debug - To fix later
    // 8012F53F 00C6 - char
    // 800F717F 00E4 - course counter?
    // 800F7193 0003 actual score
    // 800F718F 00A4 score card. if negative, not done. if pos, done..?
    // get shot val details? like if perfect, display perfect?
    // console.log("Grid X Position: ", memValues.gridX);
    // console.log("Grid Y Position: ", memValues.gridY);
    // console.log("Grid Z Position: ", memValues.gridZ);
    */
}

setInterval(handleData, 1000);

function processDataAndSend() {
    var memValues = readMemoryValues();

    // Prepare the data to be sent
    var dataToSend = {
        shotAngle: convertValue(memValues.pAngle, false),
        spinX: convertSpinX(memValues.spinXAngle),
        spinY: convertSpinX(memValues.spinYAngle),
        windSpeed: translateWindValue(memValues.wind),
        windAngle: convertValue(memValues.angle, true),
        club: getClubType(memValues.club),
        type: getClubPower(memValues.type),
        strokes: memValues.strokes,
        weather: memValues.rain === 1 ? "Rain" : "Clear",
        ballX: memValues.ballX,
        ballY: memValues.ballY,
        ballZ: memValues.ballZ,
        cameraZ: memValues.cameraZ,
        cameraY: memValues.cameraY,
        course: getCourse(memValues.course),
        hole: memValues.hole + 1,
        pinX: memValues.pinX,
        pinZ: memValues.pinZ
    };

    // Convert data to a string format
    var dataString = JSON.stringify(dataToSend);

    // Send data to the server
    var client = new Socket();
    client.connect(3000, '127.0.0.1', function() { // Edit IP here
        client.write(dataString);
        console.log("Data sent:", dataString);
        client.end();
        client.close();  // Close the connection after sending
    });
}

processDataAndSend();
