function skipToContent(){
    const content = document.getElementById("content");
    content.scrollIntoView({behavior: "smooth"});
}

/*
Visualization 1: country-based geographic distribution of releases from 5-year increments with clusters of datapoints
Hovering over a cluster will show the number of releases from that geographic area and the top 5 releases from that area
*/

const periods = ["1990-1994", "1995-1999", "2000-2004", "2005-2009", "2010-2014", "2015-2019", "2020-2024"];
let map1 = L.map('map1').setView([35, 0], 3); // Start with a world view
let layerGroup1 = L.layerGroup().addTo(map1);
map1.attributionControl.setPrefix('');

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map1);

async function updateMap1(index) {
    const period = periods[index];
    document.getElementById('period-display').innerText = period;
    
    // Clear old markers
    layerGroup1.clearLayers();

    try {
        const response = await fetch(`assets/map_data/dnb_viz_${period}_releases.json`);

        if (!response.ok) {
            throw new Error(`Failed to load data (${response.status} ${response.statusText})`);
        }

        const data = await response.json();

        data.forEach(item => {
            const radius = Math.sqrt(item.release_count) * 2.5; // scale radius based on release count 

            const lat = item.coordinates.lat;
            const lng = item.coordinates.lng;

            const circle = L.circleMarker([lat, lng], {
                radius: radius,
                color: '#00ff00',
                fillOpacity: 0.3
            });

            let top5Html = `<b>${item.country}</b><br>Total Releases: ${item.release_count}<hr><b>Top 5 Releases:</b><ul>`;
            item.top_releases.forEach(s => {
                top5Html += `
                    <li style="display:flex; align-items:center;">
                        <img src="${s.image_url}" alt="Cover" style="width:40px; height:40px; margin-right:10px; object-fit:cover; border-radius:4px;">
                        <a href="https://www.discogs.com${s.release_url}" target="_blank" style="font-size: 12px;text-decoration:none;">
                        ${s.title}
                        </a>
                    </li>
                `;
                // cover image
            });
            top5Html += `</ul>`;

            circle.bindPopup(top5Html);
            circle.addTo(layerGroup1);

            // circle.on('click', () => {
            //     if (item.top_releases.length > 0) {
            //         const topRelease = item.top_releases[0];
            //         playInDashboard(topRelease.title);
            //     }
            // });
        });
    } catch (error) {
        console.error('Error loading map data:', error);
    }
}

// Listener for the slider
document.getElementById('year-slider').addEventListener('input', (e) => {
    updateMap1(e.target.value);
});

// Initial Load
updateMap1(0);

/*
Visualization 2: UK city early releases from 1990-1994 with clusters of datapoints
Hovering over a cluster will show the number of releases from that city and the top 5 releases from that city
*/

let map2 = L.map('map2').setView([52, -1], 7.2); // Start with a UK view
let layerGroup2 = L.layerGroup().addTo(map2);
map2.attributionControl.setPrefix('');

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map2);

async function updateMap2() {
    // Clear old markers
    layerGroup2.clearLayers();

    try {
        const response = await fetch(`assets/map_data/dnb_local_viz_releases.json`);

        if (!response.ok) {
            throw new Error(`Failed to load data (${response.status} ${response.statusText})`);
        }

        const data = await response.json();

        data.forEach(item => {
            const radius = Math.sqrt(item.release_count) * 3; // scale radius based on release count

            const lat = item.coordinates.lat;
            const lng = item.coordinates.lng;

            const circle = L.circleMarker([lat, lng], {
                radius: radius,
                color: '#ff0000',
                fillOpacity: 0.3
            });

            let top5Html = `<b>${item.city}</b><br>Total Releases: ${item.release_count}<hr><b>Top 5 Releases:</b><ul>`;
            item.top_releases.forEach(s => {
                top5Html += `
                    <li style="display:flex; align-items:center;">
                        <img src="${s.image_url}" alt="Cover" style="width:40px; height:40px; margin-right:10px; object-fit:cover; border-radius:4px;">
                        <a href="https://www.discogs.com${s.release_url}" target="_blank" style="font-size: 12px;text-decoration:none;">
                        ${s.title}
                        </a>
                    </li>
                `;
            });
            top5Html += `</ul>`;

            circle.bindPopup(top5Html);
            circle.addTo(layerGroup2);
        });
    } catch (error) {
        console.error('Error loading map data:', error);
    }
}

// Initial Load
updateMap2();

/*
Visualization 3: radar chart comparing case studies for 5 songs for Bristol and London on audio features
*/

// obtain mean data from city_feature_summary.json

async function loadSummaryData() {
    try {
        const response = await fetch('assets/city_feature_summary.json');

        if (!response.ok) {
            throw new Error(`Failed to load data (${response.status} ${response.statusText})`);
        }

        const summaryData = await response.json();

        const bristol = summaryData.Bristol;
        const london = summaryData.London;

        const bristol_data = [bristol.danceability, bristol.energy, bristol.valence, bristol.acousticness, bristol.instrumentalness];
        const london_data = [london.danceability, london.energy, london.valence, london.acousticness, london.instrumentalness];

        return { bristol_data, london_data };
    } catch (error) {
        console.error('Error loading summary data:', error);
        return null;
    }
}

function renderRadarChart(bristol_data, london_data) {
    const ctx = document.getElementById('dnbRadarChart').getContext('2d');

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Danceability', 'Energy', 'Valence', 'Acousticness', 'Instrumentalness'],
            datasets: [{
                label: 'Bristol (Mean)',
                data: bristol_data,
                backgroundColor: 'rgba(72, 0, 255, 0.2)',
                borderColor: '#5e3effff',
                borderWidth: 2
            }, {
                label: 'London (Mean)',
                data: london_data,
                backgroundColor: 'rgba(195, 255, 64, 0.2)',
                borderColor: '#e74c3c',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                r: { beginAtZero: true, max: 1 }
            }
        }
    });
}

async function initRadarChart() {
    const chartData = await loadSummaryData();
    if (!chartData) {
        return;
    }

    renderRadarChart(chartData.bristol_data, chartData.london_data);
}

initRadarChart();

// populate song cards with data from bristol_features.json and london_features.json

async function loadCityFeatures(city) {
    try {
        const response = await fetch(`assets/${city.toLowerCase()}_features.json`);

        if (!response.ok) {
            throw new Error(`Failed to load data (${response.status} ${response.statusText})`);
        }

        const featuresData = await response.json();
        return featuresData;
    } catch (error) {
        console.error(`Error loading ${city} features:`, error);
        return null;
    }
}

async function populateSongCards() {
    const bristolFeatures = await loadCityFeatures('Bristol');
    const londonFeatures = await loadCityFeatures('London');

    if (!bristolFeatures || !londonFeatures) {
        return;
    }

    const cities = ['Bristol', 'London'];
    const cityData = { Bristol: bristolFeatures, London: londonFeatures };

    cities.forEach(city => {
        const container = document.getElementById(`${city.toLowerCase()}-cards`);
        container.innerHTML = '';
        cityData[city].forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card';
            // on click, open up new tab for spotify link using song.uri
            let spotifyUrl = song.uri.replace('spotify:track:', 'https://open.spotify.com/track/');
            card.addEventListener('click', () => {
                window.open(spotifyUrl, '_blank');
                console.log('song.uri' + spotifyUrl);
            });
            card.innerHTML = `
                <p><b>${song.title}</b></p>
                <p>Danceability: ${song.danceability.toFixed(2)}</p>
                <p>Energy: ${song.energy.toFixed(2)}</p>
                <p>Valence: ${song.valence.toFixed(2)}</p>
                <p>Acousticness: ${song.acousticness.toFixed(2)}</p>
                <p>Instrumentalness: ${song.instrumentalness.toFixed(2)}</p>
            `;
            container.appendChild(card);
        });
    });
}

populateSongCards();