"use strict";

async function fetchWeather() {
    const cityInput = document.getElementById("city-input").value.trim();
    if (!cityInput) return;

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            alert("City not found");
            return;
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // 2. Отримуємо погоду без потреби у приватних API-ключах
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=ms`);
        const weatherData = await weatherRes.json();
        const current = weatherData.current;

        document.getElementById("city").textContent = `${name}, ${country}`;
        document.getElementById("temp").textContent = `${Math.round(current.temperature_2m)}°C`;
        document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
        document.getElementById("wind").textContent = `${current.wind_speed_10m} m/s`;
        document.getElementById("condition").textContent = getWeatherDesc(current.weather_code);
    } catch (err) {
        console.error(err);
        alert("Failed to retrieve weather data.");
    }
}

function getWeatherDesc(code) {
    const codes = {
        0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Foggy", 51: "Light Drizzle", 61: "Rain", 71: "Snow", 95: "Thunderstorm"
    };
    return codes[code] || "Scattered Clouds";
}