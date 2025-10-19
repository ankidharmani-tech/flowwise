// Background Carousel
let current = 0;
const images = document.querySelectorAll('.carousel-img');
setInterval(() => {
  images[current].classList.replace('opacity-100', 'opacity-0');
  current = (current + 1) % images.length;
  images[current].classList.replace('opacity-0', 'opacity-100');
}, 4000);

// Leaflet Map Setup
const map = L.map("map").setView([19.0760, 72.8777], 11);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// Mock Traffic Data (can be replaced later with live API)
const trafficData = {
  Andheri: { lat: 19.1197, lon: 72.8468, congestion: 0.7, speed: 25 },
  Bandra: { lat: 19.0544, lon: 72.8402, congestion: 0.5, speed: 35 },
  Dadar: { lat: 19.0176, lon: 72.8562, congestion: 0.8, speed: 20 },
  Sion: { lat: 19.0415, lon: 72.8643, congestion: 0.6, speed: 28 },
  Powai: { lat: 19.118, lon: 72.905, congestion: 0.4, speed: 40 },
  Malad: { lat: 19.186, lon: 72.848, congestion: 0.5, speed: 33 },
};

// Add Markers for Each Area
Object.entries(trafficData).forEach(([area, data]) => {
  const color = data.congestion > 0.7 ? "red" : data.congestion > 0.5 ? "orange" : "green";
  const marker = L.circleMarker([data.lat, data.lon], { radius: 10, color }).addTo(map);
  marker.bindPopup(`<b>${area}</b><br>Congestion: ${(data.congestion*100).toFixed(0)}%<br>Speed: ${data.speed} km/h`);
});

// Dark Mode Toggle
document.getElementById("theme-toggle").onclick = () => {
  document.body.classList.toggle("dark");
};

//  Alerts
document.getElementById("alertsBtn").onclick = () => {
  alert("🚧 Construction near Bandra\n💥 Accident at Sion Flyover\n🅿️ Parking Full at Dadar");
};

//  Area Search + Forecast
document.getElementById("areaSearch").addEventListener("change", (e) => {
  const area = e.target.value.trim();
  const forecastTime = parseInt(document.getElementById("timeForecast").value);

  if (trafficData[area]) {
    const { lat, lon, congestion, speed } = trafficData[area];
    map.setView([lat, lon], 13);

    // simple forecast prediction mock
    const futureCongestion = Math.min(congestion + forecastTime * 0.005, 1);
    const forecastText =
      futureCongestion > 0.7
        ? "Heavy congestion expected"
        : futureCongestion > 0.5
        ? "Moderate traffic likely"
        : "Smooth flow expected";

    document.getElementById("selectedArea").textContent = area;
    document.getElementById("congestionLevel").textContent = `${(congestion * 100).toFixed(0)}%`;
    document.getElementById("avgSpeed").textContent = speed;
    document.getElementById("forecastData").textContent = forecastText;
  } else {
    alert("Area not found in mock data.");
  }
});
