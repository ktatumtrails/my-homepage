const weatherLocation = document.getElementById('weather-location');
const weatherForecast = document.getElementById('weather-forecast');
const weatherStatus = document.getElementById('weather-status');
const fallbackLocation = {
    latitude: 39.9612,
    longitude: -82.9988,
    label: 'Columbus, Ohio'
};

const svgIcons = {
    sun: `
        <svg class="weather-icon" viewBox="0 0 64 64" role="img" aria-label="Sunny" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="11" fill="#FFD34D"/>
            <g stroke="#FFD34D" stroke-width="4" stroke-linecap="round">
                <line x1="32" y1="6" x2="32" y2="16"/>
                <line x1="32" y1="48" x2="32" y2="58"/>
                <line x1="6" y1="32" x2="16" y2="32"/>
                <line x1="48" y1="32" x2="58" y2="32"/>
                <line x1="14" y1="14" x2="21" y2="21"/>
                <line x1="43" y1="43" x2="50" y2="50"/>
                <line x1="14" y1="50" x2="21" y2="43"/>
                <line x1="43" y1="21" x2="50" y2="14"/>
            </g>
        </svg>`,
    clouds: `
        <svg class="weather-icon" viewBox="0 0 64 64" role="img" aria-label="Cloudy" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 46h24a10 10 0 0 0 0-20 13 13 0 0 0-25-3 11 11 0 0 0 1 23Z" fill="#D9E2F2"/>
            <path d="M18 50h28a8 8 0 0 0 0-16 11 11 0 0 0-21-3 9 9 0 0 0-7 19Z" fill="#BFCDE0" opacity="0.95"/>
        </svg>`,
    rain: `
        <svg class="weather-icon" viewBox="0 0 64 64" role="img" aria-label="Rainy" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 38h24a10 10 0 0 0 0-20 13 13 0 0 0-25-3 11 11 0 0 0 1 23Z" fill="#D9E2F2"/>
            <g stroke="#68B7FF" stroke-width="4" stroke-linecap="round">
                <line x1="24" y1="46" x2="20" y2="54"/>
                <line x1="34" y1="46" x2="30" y2="54"/>
                <line x1="44" y1="46" x2="40" y2="54"/>
            </g>
        </svg>`,
    snow: `
        <svg class="weather-icon" viewBox="0 0 64 64" role="img" aria-label="Snowy" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 38h24a10 10 0 0 0 0-20 13 13 0 0 0-25-3 11 11 0 0 0 1 23Z" fill="#D9E2F2"/>
            <g stroke="#FFFFFF" stroke-width="3" stroke-linecap="round">
                <line x1="24" y1="48" x2="24" y2="56"/>
                <line x1="20" y1="52" x2="28" y2="52"/>
                <line x1="36" y1="48" x2="36" y2="56"/>
                <line x1="32" y1="52" x2="40" y2="52"/>
                <line x1="48" y1="48" x2="48" y2="56"/>
                <line x1="44" y1="52" x2="52" y2="52"/>
            </g>
        </svg>`,
    storm: `
        <svg class="weather-icon" viewBox="0 0 64 64" role="img" aria-label="Thunderstorm" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 38h24a10 10 0 0 0 0-20 13 13 0 0 0-25-3 11 11 0 0 0 1 23Z" fill="#D9E2F2"/>
            <path d="M34 42 26 54h8l-4 10 14-16h-8l4-6Z" fill="#FFD34D"/>
        </svg>`,
    fog: `
        <svg class="weather-icon" viewBox="0 0 64 64" role="img" aria-label="Foggy" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#D9E2F2" stroke-width="4" stroke-linecap="round">
                <line x1="12" y1="38" x2="52" y2="38"/>
                <line x1="8" y1="46" x2="48" y2="46"/>
                <line x1="16" y1="54" x2="56" y2="54"/>
            </g>
        </svg>`
};

function dayLabelFor(dateString, index) {
    const date = new Date(`${dateString}T12:00:00`);
    if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
    }

    return index === 0 ? 'Today' : `Day ${index + 1}`;
}

function setWeatherMessage(message, isError = false) {
    weatherStatus.textContent = message;
    weatherStatus.classList.toggle('weather-error', isError);
}

function weatherInfoForCode(code) {
    if (code === 0) return { icon: svgIcons.sun, label: 'Clear sky' };
    if (code === 1 || code === 2) return { icon: svgIcons.sun, label: 'Mostly clear' };
    if (code === 3) return { icon: svgIcons.clouds, label: 'Overcast' };
    if (code === 45 || code === 48) return { icon: svgIcons.fog, label: 'Foggy' };
    if ([51, 53, 55, 56, 57].includes(code)) return { icon: svgIcons.rain, label: 'Drizzle' };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: svgIcons.rain, label: 'Rain' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: svgIcons.snow, label: 'Snow' };
    if ([95, 96, 99].includes(code)) return { icon: svgIcons.storm, label: 'Thunderstorm' };

    return { icon: svgIcons.clouds, label: 'Weather update' };
}

function renderForecast(data, cityName) {
    const daily = data && data.daily;

    if (!daily || !Array.isArray(daily.time) || !Array.isArray(daily.weather_code) || !Array.isArray(daily.temperature_2m_min) || !Array.isArray(daily.temperature_2m_max)) {
        throw new Error('Open-Meteo response did not include daily forecast data.');
    }

    const dailyCount = Math.min(5, daily.time.length, daily.weather_code.length, daily.temperature_2m_min.length, daily.temperature_2m_max.length);
    weatherLocation.textContent = cityName ? `Forecast for ${cityName}` : 'Forecast for your area';
    weatherForecast.innerHTML = '';

    for (let index = 0; index < dailyCount; index += 1) {
        const weatherInfo = weatherInfoForCode(daily.weather_code[index]);
        const dayName = dayLabelFor(daily.time[index], index);
        const low = Math.round(daily.temperature_2m_min[index]);
        const high = Math.round(daily.temperature_2m_max[index]);

        const article = document.createElement('article');
        article.className = 'weather-day';
        article.innerHTML = `
            <div class="weather-day-name">${dayName}</div>
            ${weatherInfo.icon}
            <div class="weather-day-label">${weatherInfo.label}</div>
            <div class="weather-day-temps">
                <span class="weather-low">L ${low}°F</span>
                <span class="weather-high">H ${high}°F</span>
            </div>
        `;

        weatherForecast.appendChild(article);
    }

    setWeatherMessage('Updated from Open-Meteo in real time.');
}

function failWeather(message) {
    weatherForecast.innerHTML = `
        <article class="weather-day" aria-hidden="true">
            <div class="weather-day-name">--</div>
            <div class="weather-day-label">Weather unavailable</div>
            <div class="weather-day-temps">
                <span class="weather-low">L --°F</span>
                <span class="weather-high">H --°F</span>
            </div>
        </article>
    `;
    weatherLocation.textContent = 'Location unavailable';
    setWeatherMessage(message, true);
}

async function loadWeather(latitude, longitude, fallbackLabel = '') {
    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.searchParams.set('latitude', latitude);
    forecastUrl.searchParams.set('longitude', longitude);
    forecastUrl.searchParams.set('daily', 'weather_code,temperature_2m_min,temperature_2m_max');
    forecastUrl.searchParams.set('temperature_unit', 'fahrenheit');
    forecastUrl.searchParams.set('timezone', 'auto');
    forecastUrl.searchParams.set('forecast_days', '5');

    const forecastResponse = await fetch(forecastUrl.toString());

    if (!forecastResponse.ok) {
        throw new Error(`Open-Meteo forecast request failed with status ${forecastResponse.status}.`);
    }

    const forecastData = await forecastResponse.json();

    let cityLabel = fallbackLabel;

    try {
        const cityUrl = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
        cityUrl.searchParams.set('latitude', latitude);
        cityUrl.searchParams.set('longitude', longitude);
        cityUrl.searchParams.set('count', '1');
        cityUrl.searchParams.set('language', 'en');
        cityUrl.searchParams.set('format', 'json');

        const cityResponse = await fetch(cityUrl.toString());
        if (cityResponse.ok) {
            const cityData = await cityResponse.json();
            const cityResult = cityData && Array.isArray(cityData.results) && cityData.results[0];
            const cityNameParts = [];

            if (cityResult?.name) cityNameParts.push(cityResult.name);
            if (cityResult?.admin1 && cityResult.admin1 !== cityResult.name) cityNameParts.push(cityResult.admin1);
            if (cityResult?.country && (!cityResult.admin1 || cityResult.country !== cityResult.admin1)) cityNameParts.push(cityResult.country);

            cityLabel = cityNameParts.join(', ') || fallbackLabel;
        }
    } catch (error) {
        cityLabel = fallbackLabel;
    }

    renderForecast(forecastData, cityLabel);
}

async function loadFallbackForecast() {
    await loadWeather(fallbackLocation.latitude, fallbackLocation.longitude, fallbackLocation.label);
    setWeatherMessage('Location unavailable, so this forecast is based on Columbus, Ohio.');
}

function handleLocationError(error) {
    if (error && error.code === 1) {
        loadFallbackForecast().catch((fallbackError) => {
            failWeather(`Fallback forecast failed: ${fallbackError.message}`);
        });
        return;
    }

    if (error && error.code === 3) {
        loadFallbackForecast().catch((fallbackError) => {
            failWeather(`Fallback forecast failed: ${fallbackError.message}`);
        });
        return;
    }

    loadFallbackForecast().catch((fallbackError) => {
        failWeather(`Fallback forecast failed: ${fallbackError.message}`);
    });
}

if (!navigator.geolocation) {
    loadFallbackForecast().catch((fallbackError) => {
        failWeather(`Fallback forecast failed: ${fallbackError.message}`);
    });
} else {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            loadWeather(position.coords.latitude, position.coords.longitude).catch((error) => {
                loadFallbackForecast().catch((fallbackError) => {
                    failWeather(`Fallback forecast failed: ${fallbackError.message}`);
                });
            });
        },
        handleLocationError,
        {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 30 * 60 * 1000
        }
    );
}
