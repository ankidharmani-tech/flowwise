const map = L.map('map').setView([19.0760, 72.8777], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let fastestLayer, cheapestLayer;

// Fare calculation logic
function calcFare(distanceKm, start, end, night=false) {
  const inBandra = (start.lon>72.81 && start.lon<72.86 && start.lat>19.04 && start.lat<19.10);
  const inVileParle = (start.lon>72.83 && start.lon<72.88 && start.lat>19.09 && start.lat<19.15);
  const inChurchgate = (end.lon<72.84 && end.lat<19.0);

  let fare = 0, mode = "";

  if (inChurchgate) {
    fare = 10 + distanceKm * 2;
    mode = "Train/Metro";
  } else if (inBandra) {
    fare = 15;
    mode = "Shared Rickshaw (Bandra)";
  } else if (inVileParle) {
    fare = 20;
    mode = "Shared Rickshaw (Vile Parle/Andheri)";
  } else if (distanceKm < 1.5) {
    fare = 26;
    mode = "Auto Rickshaw";
  } else {
    fare = 26 + (distanceKm - 1.5) * 17.14;
    mode = "Auto Rickshaw";
  }

  if (night) fare *= 1.25;
  return { fare: fare.toFixed(0), mode };
}

// Get route from OSRM
async function getRoute(lat1, lon1, lat2, lon2, mode="car") {
  const profile = mode === "walk" ? "foot" : "driving";
  const url = `https://router.project-osrm.org/route/v1/${profile}/${lon1},${lat1};${lon2},${lat2}?geometries=geojson&overview=full`;
  const r = await fetch(url);
  const data = await r.json();
  const route = data.routes[0];
  return {
    coords: route.geometry.coordinates.map(c => [c[1], c[0]]),
    distance: route.distance / 1000,
    duration: route.duration / 60
  };
}

document.getElementById('routeBtn').addEventListener('click', async () => {
  const startVal = document.getElementById('startSelect').value;
  const destVal = document.getElementById('destSelect').value;
  const info = document.getElementById('routeInfo');
  if (!startVal || !destVal) {
    info.innerHTML = "⚠️ Please select both locations.";
    return;
  }
  info.innerHTML = "Fetching routes…";

  const [slat, slon] = startVal.split(',').map(Number);
  const [dlat, dlon] = destVal.split(',').map(Number);

  try {
    const fastest = await getRoute(slat, slon, dlat, dlon, 'car');
    const cheapest = await getRoute(slat, slon, dlat, dlon, 'walk');

    if (fastestLayer) map.removeLayer(fastestLayer);
    if (cheapestLayer) map.removeLayer(cheapestLayer);

    fastestLayer = L.polyline(fastest.coords, { color: 'red', weight: 5 }).addTo(map);
    cheapestLayer = L.polyline(cheapest.coords, { color: 'green', weight: 4, dashArray: '8 8' }).addTo(map);

    map.fitBounds(L.latLngBounds(fastest.coords.concat(cheapest.coords)));

    const dist = fastest.distance;
    const night = false;
    const fareData = calcFare(dist, { lat: slat, lon: slon }, { lat: dlat, lon: dlon }, night);

    info.innerHTML = `
      🔴 <b>Fastest route:</b> ${dist.toFixed(2)} km (~${fastest.duration.toFixed(1)} min)<br>
      🟢 <b>Cheapest route:</b> ₹${fareData.fare} (${fareData.mode}), ~${cheapest.duration.toFixed(1)} min
    `;
  } catch (e) {
    console.error(e);
    info.innerHTML = "Error fetching routes. Try again.";
  }
});
