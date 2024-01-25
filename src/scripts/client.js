const CLUBS = {
  0: "1 Wood (Driver)",
  1: "3 Wood",
  2: "4 Wood",
  3: "2 Iron",
  4: "3 Iron",
  5: "4 Iron",
  6: "5 Iron",
  7: "6 Iron",
  8: "7 Iron",
  9: "8 Iron",
  10: "9 Iron",
  11: "Pitching Wedge",
  12: "Sand Wedge",
  13: "Putter",
};

const COURSES = {
  0: "Toad Highlands",
  1: "Koopa Park",
  2: "Shy Guy Desert",
  3: "Yoshis Island",
  4: "Boo Valley",
  5: "Marios Star",
};

const TYPES = {
  0: "Power",
  1: "Normal",
  2: "Blue",
};

const fairwayTypes = {
  0: "Fairway",
  1: "Semi Fairway",
  2: "Rough Fairway",
  3: "Mud",
  7: "Rough",
  8: "Deep Rough",
  12: "Very Deep Rough",
  9: "Extreme Rough",
  4: "Bunker",
  5: "Deep Bunker",
  6: "Very Deep Bunker",
};

var trajectoryPoints = []; // Global array to store trajectory points
var eventState = "idle";

function getClubType(clubNumber) {
  return CLUBS[clubNumber] || "Unknown club";
}

function getClubPower(type) {
  return TYPES[type] || "Unknown";
}

function getCourse(courseNumber) {
  return COURSES[courseNumber] || "Unknown course";
}

function getFairway(fairWay) {
  return fairwayTypes[fairWay] || "Unknown ground type";
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
  return spinX > midPoint ? (-1 * (4294967296 - spinX)) / midPoint : spinX / midPoint;
}

function readMemoryValues() {
  return {
    wind: mem.u32[0x800ba9f0],
    pAngle: mem.u32[0x80227150],
    spinXAngle: mem.u32[0x80227160],
    spinYAngle: mem.u32[0x80227164],
    angle: mem.u8[0x800ba9f4],
    club: mem.u32[0x80227154],
    strokes: mem.u8[0x801b71f3],
    rain: mem.u8[0x800ba9fb],
    type: mem.u8[0x800fbe57],
    ballX: mem.s32[0x800fbe64],
    ballY: mem.s32[0x800fbe68],
    ballZ: mem.s32[0x800fbe6c],
    cameraZ: mem.s32[0x800fbe7c],
    cameraY: mem.s32[0x800fbe84],
    gridX: mem.s32[0x800fbe8c],
    gridY: mem.s32[0x800fbe90],
    gridZ: mem.s32[0x800fbe94],
    course: mem.u8[0x801b6097],
    hole: mem.u8[0x801b609b],
    pinX: mem.u32[0x800ba9d8],
    pinZ: mem.u32[0x800ba9e0],
    ballCondition: mem.u8[0x800c59df],
    ballStatus: mem.u8[0x800b78df],
    landingX: mem.s32[0x800b7868],
    landingY: mem.s32[0x800b786c],
    landingZ: mem.s32[0x800b7870],
  };
}

function processDataAndSend(trajectoryPts) {
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
    pinZ: memValues.pinZ,
    ballCondition: getFairway(memValues.ballCondition),
    gridX: memValues.gridX,
    gridY: memValues.gridY,
    gridZ: memValues.gridZ,
    landingX: memValues.landingX,
    landingY: memValues.landingY,
    landingZ: memValues.landingZ,
    trajectory: trajectoryPts,
    date: new Date().toDateString(),
  };

  var dataString = JSON.stringify(dataToSend);

  var client = new Socket();
  client.connect(3000, "165.22.40.190", function () {
    client.write(dataString);
    console.log("Data sent:", dataString);
    client.end();
    client.close();
  });
}

function handleBallEvent() {
  var memValues = readMemoryValues();
  var currentBallCondition = memValues.ballStatus;

  switch (eventState) {
    case "idle":
      if (currentBallCondition === 1) {
        eventState = "ballInAir";
        trajectoryPoints = [];
        console.log("Ball has been shot.");
      }
      break;
    case "ballInAir":
      trajectoryPoints.push({ x: memValues.landingX, y: memValues.landingY, z: memValues.landingZ });

      if (currentBallCondition === 0) {
        eventState = "ballLanded";
        trajectoryPoints.pop();
        executeLogicAfterBallLands(
          memValues.ballX,
          memValues.ballY,
          memValues.ballZ,
          trajectoryPoints,
          memValues.landingX,
          memValues.landingY,
          memValues.landingZ
        );
        eventState = "idle";
      }
      break;
  }
}

function executeLogicAfterBallLands(startingX, startingY, startingZ, trajectory, landingX, landingY, landingZ) {
  var simplifiedTrajectory = douglasPeucker(trajectory, 200);
  console.log(trajectory.length);
  console.log(simplifiedTrajectory.length);
  console.log("Ball has landed. Executing logic.");
  console.log("Start: " + startingX + " " + startingY + " " + startingZ);
  console.log("Trajectory Points: ", simplifiedTrajectory);
  console.log("Landing: " + landingX + " " + landingY + " " + landingZ);
  processDataAndSend(simplifiedTrajectory);
}

/*Credits: https://medium.com/@lucasdiogodasilva/reducing-json-data-size-7c7e9c56dbd6*/
function douglasPeucker(points, epsilon) {
  var maxDistance = 0;
  var index = 0;

  for (var i = 1; i < points.length - 1; i++) {
    var distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance > epsilon) {
    var recResults1 = douglasPeucker(points.slice(0, index + 1), epsilon);
    var recResults2 = douglasPeucker(points.slice(index, points.length), epsilon);

    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    return [points[0], points[points.length - 1]];
  }
}

function perpendicularDistance(point, lineStart, lineEnd) {
  var dx = lineEnd.x - lineStart.x;
  var dy = lineEnd.y - lineStart.y;

  var normalLength = Math.sqrt(dx * dx + dy * dy);
  return Math.abs((point.x - lineStart.x) * dy - (point.y - lineStart.y) * dx) / normalLength;
}

setInterval(handleBallEvent, 300);
