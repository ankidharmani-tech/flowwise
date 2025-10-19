document.addEventListener("DOMContentLoaded", () => {
  //  Background Carousel
  let current = 0;
  const images = document.querySelectorAll(".carousel-img");
  setInterval(() => {
    images[current].classList.replace("opacity-100", "opacity-0");
    current = (current + 1) % images.length;
    images[current].classList.replace("opacity-0", "opacity-100");
  }, 4000);

  // Leaflet Map Setup
  const map = L.map("map", { zoomControl: false }).setView([19.0760, 72.8777], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  L.control.zoom({ position: "bottomright" }).addTo(map);

  //  Mock Traffic Data
  const trafficData = {
    Andheri: { lat: 19.1197, lon: 72.8468, congestion: 0.7, speed: 25 },
    Bandra: { lat: 19.0544, lon: 72.8402, congestion: 0.5, speed: 35 },
    Dadar: { lat: 19.0176, lon: 72.8562, congestion: 0.8, speed: 20 },
    Sion: { lat: 19.0415, lon: 72.8643, congestion: 0.6, speed: 28 },
    Powai: { lat: 19.118, lon: 72.905, congestion: 0.4, speed: 40 },
    Malad: { lat: 19.186, lon: 72.848, congestion: 0.5, speed: 33 },
  };

  //  Add markers + popups
  Object.entries(trafficData).forEach(([area, data]) => {
    const color = data.congestion > 0.7 ? "red" : data.congestion > 0.5 ? "orange" : "green";
    const marker = L.circleMarker([data.lat, data.lon], { radius: 10, color }).addTo(map);
    marker.bindPopup(
      `<b>${area}</b><br>Congestion: ${(data.congestion * 100).toFixed(0)}%<br>Speed: ${data.speed} km/h`
    );
  });

  // 🔍 Area Search + Forecast + Smooth Panning
  const areaInput = document.getElementById("areaSearch");
  const timeForecast = document.getElementById("timeForecast");

  areaInput.addEventListener("change", () => {
    const area = areaInput.value.trim();
    const forecastTime = parseInt(timeForecast.value);

    if (trafficData[area]) {
      const { lat, lon, congestion, speed } = trafficData[area];

      // Smooth map panning
      map.flyTo([lat, lon], 13, { animate: true, duration: 2 });

      // Forecast simulation
      const futureCongestion = Math.min(congestion + forecastTime * 0.005, 1);
      const forecastText =
        futureCongestion > 0.7
          ? "🚗 Heavy congestion expected"
          : futureCongestion > 0.5
          ? "⚠️ Moderate traffic likely"
          : "✅ Smooth flow expected";

      // Update Insights
      document.getElementById("selectedArea").textContent = area;
      document.getElementById("congestionLevel").textContent = `${(
        congestion * 100
      ).toFixed(0)}%`;
      document.getElementById("avgSpeed").textContent = speed;
      document.getElementById("forecastData").textContent = forecastText;
    } else {
      alert("Area not found in mock data.");
    }
  });

  // Alerts
  document.getElementById("alertsBtn").onclick = () => {
    alert("🚧 Construction near Bandra\n💥 Accident at Sion Flyover\n🅿️ Parking Full at Dadar");
  };

  // Dark Mode Toggle
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    themeToggle.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
  });

  // View Traffic Button Scroll
  const viewTrafficBtn = document.querySelector("button.bg-blue-600");
  if (viewTrafficBtn) {
    viewTrafficBtn.addEventListener("click", () => {
      document.getElementById("map").scrollIntoView({ behavior: "smooth" });
    });
  }
});

