// ---------- Helper utilities ----------
function haversineKm([lat1,lon1],[lat2,lon2]) {
  const toRad = d => d * Math.PI/180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

async function osrmRoute(lat1, lon1, lat2, lon2, profile='driving') {
  // profile: 'driving' or 'walking'
  const url = `https://router.project-osrm.org/route/v1/${profile}/${lon1},${lat1};${lon2},${lat2}?geometries=geojson&overview=full`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('OSRM fetch failed');
    const data = await r.json();
    if (!data.routes || data.routes.length === 0) throw new Error('No OSRM route');
    const route = data.routes[0];
    return { distance: route.distance, duration: route.duration, coords: route.geometry.coordinates.map(c => [c[1], c[0]]) };
  } catch (e) {
    // fallback: estimate from haversine and average speed
    return null;
  }
}

// ---------- Constants & local data ----------
const TAXI_BASE = 26;           // ₹
const TAXI_PER_KM = 17.14;      // ₹/km
const NIGHT_SURCHARGE = 1.25;   // 25% (if needed)
const AVERAGE_DRIVING_KMH = 28; // conservative urban average for Mumbai
const AVERAGE_WALK_KMH = 5;
const AVERAGE_METRO_KMH = 35;   // metro average speed incl stops
const AVG_METRO_WAIT_MIN = 6;   // wait + transfer penalty in minutes

// Minimal station list (examples). Add more accurate stations for better estimates.
const stations = {
  "Andheri": [19.1196, 72.8469],
  "Vile Parle": [19.0983, 72.8408],
  "Santacruz": [19.0840, 72.8397],
  "Bandra": [19.0558, 72.8351],
  "Khar Road": [19.0592, 72.8299],
  "Dadar": [19.0180, 72.8420],
  "Churchgate": [18.9417, 72.8234]
};

// Example locations -- put your real college/hangout coords here
const locations = {
  "Thadomal Shahani Engineering College": [19.0647, 72.8357],
  "D. J. Sanghvi College of Engineering": [19.0673, 72.8354],
  "Sardar Patel Institute of Technology": [19.1232, 72.8369],
  "IIT Bombay": [19.1334, 72.9133],
  "Carter Road": [19.0658, 72.8264],
  "Juhu Beach": [19.0962, 72.8265],
  "Marine Drive": [18.9430, 72.8238],
  "Colaba Causeway": [18.9103, 72.8089],
  "Bandra Fort": [19.0463, 72.8173]
};

// Utility: find nearest station to coords
function nearestStation(coords) {
  let best=null; let bestD=1e9;
  for (const [name, scoord] of Object.entries(stations)) {
    const d = haversineKm(coords, scoord);
    if (d < bestD) { best = {name, coord: scoord, distKm: d}; bestD = d; }
  }
  return best;
}

// Fare calculators
function taxiFareForKm(distanceKm, isNight=false) {
  // Apply minimum: base covers first ~1 km (approx) — use simple formula
  if (distanceKm <= 1) {
    return Math.round(TAXI_BASE);
  }
  const fare = TAXI_BASE + TAXI_PER_KM * Math.max(0, distanceKm - 1);
  return Math.round(isNight ? fare * NIGHT_SURCHARGE : fare);
}
function shareRickFare(originName) {
  // if origin contains 'Bandra' -> 15, else 20 (user rule); if Churchgate area no autos (we'll mark as NaN)
  if (/Bandra/i.test(originName)) return 15;
  if (/Churchgate|Colaba|Marine Drive/i.test(originName)) return null; // not available
  return 20;
}

// ---------- Multimodal estimation ----------
async function estimateOptions(startCoords, destCoords, startName, destName) {
  const results = [];

  // 1) Driving (OSRM driving with fallback)
  const drive = await osrmRoute(startCoords[0], startCoords[1], destCoords[0], destCoords[1], 'driving');
  if (drive) {
    results.push({
      mode: 'Taxi (drive)',
      timeMin: drive.duration/60,
      distanceKm: drive.distance/1000,
      fare: taxiFareForKm(drive.distance/1000)
    });
  } else {
    // fallback estimate using haversine and average speed
    const dkm = haversineKm(startCoords, destCoords);
    const tmin = (dkm / AVERAGE_DRIVING_KMH) * 60;
    results.push({
      mode: 'Taxi (drive, est)',
      timeMin: tmin,
      distanceKm: dkm,
      fare: taxiFareForKm(dkm)
    });
  }

  // 2) Walk-only (OSRM walking or estimate)
  const walk = await osrmRoute(startCoords[0], startCoords[1], destCoords[0], destCoords[1], 'walking');
  if (walk) {
    results.push({ mode: 'Walk', timeMin: walk.duration/60, distanceKm: walk.distance/1000, fare: 0 });
  } else {
    const dkm = haversineKm(startCoords, destCoords);
    const tmin = (dkm / AVERAGE_WALK_KMH) * 60;
    results.push({ mode: 'Walk (est)', timeMin: tmin, distanceKm: dkm, fare: 0 });
  }

  // 3) Shared rickshaw (flat-by-area logic) — assume ride length similar to taxi distance but cheaper
  const shareFare = shareRickFare(startName);
  if (shareFare !== null) {
    // time roughly like taxi but slightly longer due to stops
    const dkm = drive ? drive.distance/1000 : haversineKm(startCoords, destCoords);
    const tmin = drive ? drive.duration/60 * 1.05 : (dkm/AVERAGE_DRIVING_KMH)*60*1.05;
    results.push({ mode: 'Shared Rickshaw', timeMin: tmin, distanceKm: dkm, fare: shareFare });
  } else {
    // not available -> skip or mark unavailable
  }

  // 4) Metro/Train + walk heuristic:
  // walk from origin to nearest station A, train from A to B, walk from B to dest
  const startStation = nearestStation(startCoords);
  const endStation = nearestStation(destCoords);
  if (startStation && endStation) {
    const walkToStartKm = startStation.distKm;
    const walkFromEndKm = endStation.distKm;
    // rail distance approx (haversine between stations)
    const railDistKm = haversineKm(startStation.coord, endStation.coord);

    // times
    const walkToStartMin = (walkToStartKm / AVERAGE_WALK_KMH) * 60;
    const walkFromEndMin = (walkFromEndKm / AVERAGE_WALK_KMH) * 60;
    const railMin = (railDistKm / AVERAGE_METRO_KMH) * 60;
    const totalMin = walkToStartMin + AVG_METRO_WAIT_MIN + railMin + walkFromEndMin;

    // approximate fare: metro conservatively 15-30 depending distance; we only return 0 as "cheap" for now,
    // but you can integrate Mumbai local fare table; here we'll estimate ₹20 for short, ₹30 for mid-dist
    let metroFare = railDistKm < 3 ? 10 : (railDistKm < 8 ? 20 : 30);

    results.push({
      mode: 'Train/Metro + walk',
      timeMin: totalMin,
      distanceKm: walkToStartKm + railDistKm + walkFromEndKm,
      fare: metroFare
    });
  }

  return results;
}

// ---------- Main UI hookup ----------
async function onRouteButtonClicked() {
  const startName = document.getElementById('startSelect').value;
  const destName  = document.getElementById('destSelect').value;
  const infoBox = document.getElementById('routeInfo');

  if (!startName || !destName) {
    infoBox.innerText = 'Choose start and destination from the dropdowns.';
    return;
  }
  const startCoords = locations[startName];
  const destCoords  = locations[destName];

  if (!startCoords || !destCoords) {
    infoBox.innerText = 'Unknown location — add coordinates to locations map.';
    return;
  }

  infoBox.innerText = 'Computing options...';

  try {
    const options = await estimateOptions(startCoords, destCoords, startName, destName);

    // pick fastest by time
    const valid = options.filter(o => o.timeMin && !isNaN(o.timeMin));
    valid.sort((a,b) => a.timeMin - b.timeMin);
    const fastest = valid[0];

    // display summary: only total fare and total estimated time as requested
    if (!fastest) throw new Error('No viable option');

    const timeStr = `${fastest.timeMin.toFixed(1)} min`;
    const fareStr = (fastest.fare === null || fastest.fare === undefined) ? 'N/A' : `₹${fastest.fare}`;

    infoBox.innerHTML = `<b>Best option:</b> ${fastest.mode}<br>⏱ ${timeStr} — 💰 ${fareStr}`;

  } catch (err) {
    console.error(err);
    infoBox.innerText = 'Failed to estimate routes (network or service error).';
  }
}

// Attach listener (call this after DOM ready)
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('routeBtn');
  if (btn) btn.addEventListener('click', onRouteButtonClicked);
});
