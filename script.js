// 🌇 Mumbai background carousel
const images = [
  "https://source.unsplash.com/1600x900/?mumbai,city",
  "https://source.unsplash.com/1600x900/?mumbai,skyline",
  "https://source.unsplash.com/1600x900/?mumbai,bridge",
  "https://source.unsplash.com/1600x900/?mumbai,traffic",
];

let current = 0;
const carousel = document.getElementById("carousel");
function changeImage() {
  carousel.style.backgroundImage = `url(${images[current]})`;
  current = (current + 1) % images.length;
}
changeImage();
setInterval(changeImage, 5000);

// 🗺️ Leaflet Map
const map = L.map("map").setView([19.0760, 72.8777], 11);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// 🧩 Mock Traffic Data
const trafficData = {
  Andheri: { lat: 19.1197, lon: 72.8468, congestion: 0.7, speed: 25 },
  Bandra: { lat: 19.0544, lon: 72.8402, congestion: 0.5, speed: 35 },
  Dadar: { lat: 19.0176, lon: 72.8562, congestion: 0.8, speed: 20 },
  Sion: { lat: 19.0415, lon: 72.8643, congestion: 0.6, speed: 28 },
};

Object.entries(trafficData).forEach(([area, data]) => {
  const color = data.congestion > 0.7 ? "red" : data.congestion > 0.5 ? "orange" : "green";
  const marker = L.circleMarker([data.lat, data.lon], { radius: 10, color }).addTo(map);
  marker.bindPopup(`<b>${area}</b><br>Congestion: ${data.congestion}<br>Speed: ${data.speed} km/h`);
});

// 🌓 Dark Mode Toggle
document.getElementById("toggleDark").onclick = () => {
  document.body.classList.toggle("dark");
};

// 🔔 Alerts Mock
document.getElementById("alertsBtn").onclick = () => {
  alert("🚧 Construction near Bandra\n💥 Accident at Sion Flyover\n🅿️ Parking Full at Dadar");
};

// 🔍 Area Search Functionality
document.getElementById("areaSearch").addEventListener("change", (e) => {
  const area = e.target.value.trim();
  if (trafficData[area]) {
    const { lat, lon, congestion, speed } = trafficData[area];
    map.setView([lat, lon], 13);
    document.getElementById("selectedArea").textContent = area;
    document.getElementById("congestionLevel").textContent = `${(congestion * 100).toFixed(0)}%`;
    document.getElementById("avgSpeed").textContent = speed;
    document.getElementById("forecastData").textContent = "Predicted +15min: Slightly higher congestion";
  } else {
    alert("Area not found in mock data.");
  }
});
