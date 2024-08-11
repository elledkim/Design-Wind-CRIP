const stateFipsToAbbreviation = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
    "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
    "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
    "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
    "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
    "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
    "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
    "54": "WV", "55": "WI", "56": "WY", "72": "PR"
};

document.addEventListener('DOMContentLoaded', function () {
    console.log('Document loaded');

    const riskButtons = document.querySelectorAll('.risk-button');
    const calcButtons = document.querySelectorAll('.calc-button');
    const calculateBtn = document.getElementById('calculate-btn');
    const countySelect = document.getElementById('county-select');
    const buildYearInput = document.getElementById('build-year');
    const lifespanInput = document.getElementById('lifespan');
    let csvData = [];
    let currentHighlightedLayer = null;
    let shadedCountyCount = 0;
    let shadedBounds = L.latLngBounds();

    const popupWrapper = document.getElementById('popup-wrapper');
    popupWrapper.style.display = 'none';

    const popupContainer = document.getElementById('popup-container');
    const overlay = document.getElementById('overlay');
    const closePopup = document.getElementById('close-popup');
    const countyNameElem = document.getElementById('county-name');
    const stateLocationElem = document.getElementById('state-location');
    const windSpeedsElem = document.getElementById('wind-speeds');
    const countyOutlineElem = document.getElementById('county-outline');

    const loadingOverlay = document.getElementById('loading-overlay');


    // Initialize Select2
    $('#county-select').select2({
        placeholder: 'Select a county',
        allowClear: true
    });

    if (countySelect) {
        console.log('countySelect element found:', countySelect);

        // Initialize Select2
        $('#county-select').select2({
            placeholder: 'Select a county',
            allowClear: true,
            data: [] // Empty data array
        });

        // Reinitialize Select2 to ensure no options are available initially
        $('#county-select').select2('destroy').select2({
            placeholder: 'Select a county',
            allowClear: true
        });

        // Use jQuery to listen for change events on the Select2 instance
        $('#county-select').on('change', function () {
            const selectedCounty = $(this).val();
            console.log('Selected county:', selectedCounty); // Debug log to check selected county value

            geojson.eachLayer(function (layer) {
                const countyFullName = `${layer.feature.properties.NAME}, ${stateFipsToAbbreviation[layer.feature.properties.STATEFP.padStart(2, '0')]}`;

                if (countyFullName === selectedCounty) {
                    highlightOnClick({ target: layer });
                }
            });
        });
    } else {
        console.log('countySelect element not found');
    }

    closePopup.addEventListener('click', function () {
        popupWrapper.style.display = 'none';
        overlay.style.display = 'none';
    });

    riskButtons.forEach(button => {
        button.addEventListener('click', function () {
            riskButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            // Save the selected risk category to localStorage
            localStorage.setItem('riskCategory', this.getAttribute('data-value'));
        });
    });

    calcButtons.forEach(button => {
        button.addEventListener('click', function () {
            calcButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            // Save the selected calculation method to localStorage
            localStorage.setItem('calcMethod', this.getAttribute('data-value'));
        });
    });

    buildYearInput.addEventListener('change', function () {
        if (buildYearInput.value) {
            buildYearInput.classList.add('selected');
            // Save the build year to localStorage
            localStorage.setItem('buildYear', buildYearInput.value);
        }
    });

    lifespanInput.addEventListener('change', function () {
        if (lifespanInput.value) {
            lifespanInput.classList.add('selected');
            // Save the lifespan to localStorage
            localStorage.setItem('lifespan', lifespanInput.value);
        }
    });

    function loadFormValues() {
        const riskCategory = localStorage.getItem('riskCategory');
        const calcMethod = localStorage.getItem('calcMethod');
        const buildYear = localStorage.getItem('buildYear');
        const lifespan = localStorage.getItem('lifespan');

        if (riskCategory) {
            riskButtons.forEach(btn => btn.classList.remove('active'));
            const riskButton = document.querySelector(`.risk-button[data-value="${riskCategory}"]`);
            if (riskButton) {
                riskButton.classList.add('active');
            }
        }

        if (calcMethod) {
            calcButtons.forEach(btn => btn.classList.remove('active'));
            const calcButton = document.querySelector(`.calc-button[data-value="${calcMethod}"]`);
            if (calcButton) {
                calcButton.classList.add('active');
            }
        }

        if (buildYear) {
            buildYearInput.value = buildYear;
            buildYearInput.classList.add('selected');
        }

        if (lifespan) {
            lifespanInput.value = lifespan;
            lifespanInput.classList.add('selected');
        }
    }

    function updateMap(event) {
        event.preventDefault();  // Prevent form submission
        console.log('Update map called');
    
        const riskCategory = document.querySelector('.risk-button.active').getAttribute('data-value');
        const buildYear = document.getElementById('build-year').value;
        const lifespan = document.getElementById('lifespan').value;
        const calcMethod = document.querySelector('.calc-button.active').getAttribute('data-value');
    
        if (!buildYear || !lifespan || !calcMethod || !riskCategory) {
            alert("Please fill in all the fields.");
            return;
        }
    
        // Show loading overlay
        showLoading();
    
        fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ riskCategory, buildYear, lifespan, calcMethod })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Calculate response received:', data);
    
            if (data.error) {
                alert("Error: " + data.error);
            } else {
                const csvFile = data.csv_file;
                console.log("CSV File to fetch:", csvFile);
                localStorage.setItem('calcMethod', calcMethod); // Store the calc method
                console.log("CSV File to fetch:", csvFile);
                fetch(`/get_csv/${csvFile}`)
                    .then(response => response.text())
                    .then(csvText => {
                        console.log('CSV text received:', csvText);
    
                        Papa.parse(csvText, {
                            header: true,
                            complete: function (results) {
                                csvData = results.data;
                                console.log("Parsed CSV Data:", csvData);
                                // Store the CSV data in localStorage
                                localStorage.setItem('csvData', JSON.stringify(csvData));
                                applyMapData();
                                // Hide loading overlay
                                hideLoading();
                            },
                            error: function (error) {
                                console.error("PapaParse Error:", error);
                                alert("Failed to parse the CSV file.");
                                // Hide loading overlay
                                hideLoading();
                            }
                        });
                    })
                    .catch(error => {
                        console.error('Fetch Error:', error);
                        alert("Failed to load the CSV file.");
                        // Hide loading overlay
                        hideLoading();
                    });
            }
        })
        .catch(error => {
            console.error('Calculation Error:', error);
            alert("Failed to calculate wind speeds.");
            // Hide loading overlay
            hideLoading();
        });
    }
    
    function applyMapData() {
        console.log('Applying map data');
    
        const calcMethod = localStorage.getItem('calcMethod'); // Get the selected method
        shadedCountyCount = 0;
        shadedBounds = L.latLngBounds();
        const unmatchedEntries = [];
        const shadedCounties = [];
    
        geojson.eachLayer(function (layer) {
            const geojsonCountyID = layer.feature.properties.STATEFP.padStart(2, '0') + layer.feature.properties.COUNTYFP.padStart(3, '0');
            const countyData = csvData.find(row => row.ID.padStart(5, '0') === geojsonCountyID);
    
            if (countyData) {
                const windSpeeds = [parseFloat(countyData.XD_LEP), parseFloat(countyData.XD_MRI), parseFloat(countyData.XD_AEP), parseFloat(countyData.XD2_LEP), parseFloat(countyData.XD2_MRI), parseFloat(countyData.XD2_AEP)];
                let windSpeed;
    
                if (calcMethod === "LEP") {
                    windSpeed = windSpeeds[0];
                } else if (calcMethod === "MRI") {
                    windSpeed = windSpeeds[1];
                } else if (calcMethod === "AEP") {
                    windSpeed = windSpeeds[2];
                }
                else if (calcMethod === "LEP-Static") {
                    windSpeed = windSpeeds[3];
                }
                else if (calcMethod === "MRI-Static") {
                    windSpeed = windSpeeds[4];
                }
                else if (calcMethod === "AEP-Static") {
                    windSpeed = windSpeeds[5];
                }
    
                if (windSpeed !== undefined) {
                    layer.setStyle({
                        fillColor: getColor(windSpeed),
                        fillOpacity: 0.7,
                        color: '#C5C5C5',
                        weight: 1
                    });
                    layer.feature.properties.fillColor = getColor(windSpeed);
                    layer.feature.properties.windSpeed = windSpeed;
                    layer.feature.properties.windSpeeds = windSpeeds;
                    layer.bindTooltip(`County: ${layer.feature.properties.NAME}<br>Wind speed: ${windSpeed} m/s`, {
                        permanent: false,
                        direction: 'top',
                        className: 'county-tooltip',
                        offset: [0, -10]
                    });
                    shadedCountyCount++;
                    shadedBounds.extend(layer.getBounds());

                    shadedCounties.push({
                        name: `${layer.feature.properties.NAME}, ${stateFipsToAbbreviation[layer.feature.properties.STATEFP.padStart(2, '0')]}`,
                        value: `${layer.feature.properties.NAME}, ${stateFipsToAbbreviation[layer.feature.properties.STATEFP.padStart(2, '0')]}`
                    });
                    
                } else {
                    console.log('No Data for County:', layer.feature.properties.NAME);
                    unmatchedEntries.push(layer.feature.properties.NAME);
                    layer.setStyle({
                        fillColor: '#FFFFFF',
                        fillOpacity: 0,
                        color: '#10101010',
                        weight: 1
                    });
                    layer.feature.properties.fillColor = '#FFFFFF';
                    layer.feature.properties.windSpeeds = null;
                    layer.bindTooltip(`County: ${layer.feature.properties.NAME}<br>No data available`, {
                        permanent: false,
                        direction: 'top',
                        className: 'county-tooltip',
                        offset: [0, -10]
                    });
                }
            }
        });
    
        console.log(`Total Shaded Counties: ${shadedCountyCount}`);
        console.log('Unmatched Entries:', unmatchedEntries);

        populateCountyDropdown(shadedCounties);

            // Automatically rescale the map to the shaded bounds
        if (shadedCountyCount > 0) {
            map.fitBounds(shadedBounds, {
                padding: [80, 80],
                duration: 1
            });
        } else {
            map.setView([37.8, -96], 4, {
                duration: 1
            });
        }
    }
    
    

    function getColor(value) {
        const colorScale = d3.scaleSequential()
            .domain([40, 200]) // Adjust this range based on your data
            .interpolator(d3.interpolateTurbo); // Turbo provides a wide range of colors

        return colorScale(value);
    }

    calculateBtn.addEventListener('click', updateMap);

    var map = L.map('map').setView([37.8, -96], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    function style(feature) {
        return {
            color: '#10101010',
            weight: 1,
            fillColor: feature.properties.fillColor || '#FFFFFF',
            fillOpacity: feature.properties.fillColor ? 0.7 : 0
        };
    }
    function highlightFeature(e) {
        var layer = e.target;
    
        layer._originalStyle = {
            weight: layer.options.weight,
            color: layer.options.color,
            fillOpacity: layer.options.fillOpacity,
            fillColor: layer.options.fillColor
        };
    
        layer.setStyle({
            weight: 2,
            color: '#383434',
            fillOpacity: 0.7,
            fillColor: '000000'
        });
    
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    
        const stateFips = layer.feature.properties.STATEFP.padStart(2, '0');
        const stateAbbr = stateFipsToAbbreviation[stateFips];
        const countyName = layer.feature.properties.NAME;
    
        const calcMethod = localStorage.getItem('calcMethod');
        let windSpeed;
    
        if (layer.feature.properties.windSpeeds && Array.isArray(layer.feature.properties.windSpeeds)) {
            if (calcMethod === "LEP") {
                windSpeed = layer.feature.properties.windSpeeds[0];
            } else if (calcMethod === "MRI") {
                windSpeed = layer.feature.properties.windSpeeds[1];
            } else if (calcMethod === "AEP") {
                windSpeed = layer.feature.properties.windSpeeds[2];
            }
            else if (calcMethod === "LEP-Static") {
                windSpeed = layer.feature.properties.windSpeeds[3];
            }
            else if (calcMethod === "MRI-Static") {
                windSpeed = layer.feature.properties.windSpeeds[4];
            }
            else if (calcMethod === "AEP-Static") {
                windSpeed = layer.feature.properties.windSpeeds[5];
            }
        }
    
        const tooltipContent = windSpeed !== undefined ?
            `County: ${countyName}, ${stateAbbr}<br>Wind speed: ${windSpeed} m/s` :
            `County: ${countyName}, ${stateAbbr}`;
    
        layer.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
            className: 'county-tooltip',
            offset: [0, -10]
        }).openTooltip();
    }
    
    function resetHighlight(e) {
        var layer = e.target;
        layer.setStyle(layer._originalStyle);
        layer.closeTooltip();
        const stateFips = layer.feature.properties.STATEFP.padStart(2, '0');
        const stateAbbr = stateFipsToAbbreviation[stateFips];
        const countyName = layer.feature.properties.NAME;
        const tooltipContent = layer.feature.properties.xdValue !== null ?
            `County: ${countyName}, ${stateAbbr}<br>Wind speed: ${layer.feature.properties.xdValue} m/s` :
            `County: ${countyName}, ${stateAbbr}`;
        layer.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
            className: 'county-tooltip',
            offset: [0, -10]
        });
    }

    function showPopup(countyName, stateLocation, windSpeeds, countyShape) {
        countyNameElem.textContent = countyName;
        stateLocationElem.textContent = stateLocation;
        windSpeedsElem.innerHTML = '';
        windSpeeds.forEach(speed => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${speed.category}</strong>: ${speed.speed} m/s`;
            windSpeedsElem.appendChild(li);
        });

        // Generate SVG content for the county shape
        const svgContent = generateCountySVG(countyShape);

        countyOutlineElem.innerHTML = svgContent;
        popupWrapper.style.display = 'flex';
        overlay.style.display = 'block';
    }

    function generateCountySVG(geojsonGeometry) {
        const pathData = geojsonPath(geojsonGeometry);
        return `
            <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
                <path d="${pathData}" fill="black" stroke="black" stroke-width="1"/>
            </svg>
        `;
    }

    function highlightOnClick(e) {
        const layer = e.target;
        if (currentHighlightedLayer) {
            geojson.resetStyle(currentHighlightedLayer);
            currentHighlightedLayer.closeTooltip();
        }
        currentHighlightedLayer = layer;
    
        const countyName = layer.feature.properties.NAME;
        const stateFips = layer.feature.properties.STATEFP.padStart(2, '0');
        const countyFips = layer.feature.properties.COUNTYFP.padStart(3, '0');
        const stateAbbr = stateFipsToAbbreviation[stateFips];
        const geojsonCountyID = stateFips + countyFips;
        const windSpeeds = [
            { category: "LEP", speed: layer.feature.properties.windSpeeds[0] },
            { category: "MRI", speed: layer.feature.properties.windSpeeds[1] },
            { category: "LEP-AEP", speed: layer.feature.properties.windSpeeds[2] },
            { category: "LEP Static", speed: layer.feature.properties.windSpeeds[3] },
            { category: "MRI Static", speed: layer.feature.properties.windSpeeds[4] },
            { category: "LEP-AEP Static", speed: layer.feature.properties.windSpeeds[5] }
        ];
    
        // Extract county shape from GeoJSON
        const countyShape = layer.feature.geometry;
    
        showPopup(countyName, `${countyName} County, ${stateAbbr}`, windSpeeds, countyShape);
    }
    

    // function updatePopup(countyGeoJson, countyName) {
    //     const svgContent = generateSVG(countyGeoJson.geometry);
    //     const countySvgContainer = document.getElementById('county-svg-container');
    //     countySvgContainer.innerHTML = svgContent;
    
    //     const countyNameElem = document.getElementById('county-name');
    //     const stateLocationElem = document.getElementById('state-location');
    //     const windSpeedsElem = document.getElementById('wind-speeds');
    
    //     countyNameElem.textContent = countyName;
    //     stateLocationElem.textContent = `State: ${countyGeoJson.properties.STATEFP}`; // Modify as needed
    //     windSpeedsElem.innerHTML = `
    //         <li><b>LEP:</b> ${countyGeoJson.properties.METHOD_AEP} m/s</li>
    //         <li><b>MRI:</b> ${countyGeoJson.properties.METHOD_MRI} m/s</li>
    //         <li><b>LEP-AEP:</b> ${countyGeoJson.properties.METHOD_LEP} m/s</li>
    //         <li><b>LEP-AEP:</b> ${countyGeoJson.properties.METHOD_static} m/s</li>
    //     `;
    
    //     // Show popup
    //     document.getElementById('popup-wrapper').style.display = 'block';
    //     document.getElementById('overlay').style.display = 'block';
    // }

    function createCountyOutlineImageUrl(fipsCode) {
        if (!fipsCode) {
            console.error('FIPS code is undefined or null.');
            return Promise.reject(new Error('FIPS code is undefined or null.'));
        }
    
        return fetch('/static/USA_Counties_with_FIPS_and_names.svg')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch SVG file: ${response.statusText}`);
                }
                return response.text();
            })
            .then(svgText => {
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const countyId = `c${fipsCode}`; // Assuming the IDs are prefixed with 'c'
                const county = svgDoc.getElementById(countyId);
    
                if (!county) {
                    throw new Error(`County with FIPS code ${fipsCode} not found in the SVG.`);
                }
    
                const svgContent = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
                        ${county.outerHTML}
                    </svg>`;
                const blob = new Blob([svgContent], { type: 'image/svg+xml' });
                return URL.createObjectURL(blob);
            })
            .catch(error => {
                console.error('Error creating county outline image:', error);
                return null;
            });
    }
    
    function geojsonPath(geojson) {
        // Convert GeoJSON coordinates to SVG path data
        const coordinates = geojson.coordinates[0];
        return coordinates.map(coord => `L${coord[0] * 10},${coord[1] * 10}`).join(' ').replace('L', 'M');
    }
    

    function onEachFeature(feature, layer) {
        const stateFips = feature.properties.STATEFP.padStart(2, '0');
        const stateAbbr = stateFipsToAbbreviation[stateFips];
        const countyName = feature.properties.NAME;
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: highlightOnClick
        });
        const initialTooltipContent = layer.feature.properties.xdValue !== null ?
            // `${countyName} County, ${stateAbbr}<br>Wind speed: ${layer.feature.properties.xdValue} m/s` :
            `${countyName} County, ${stateAbbr}<br>Wind SPEED: ${layer.feature.properties.xdValue} m/s` :

            `${countyName} County, ${stateAbbr}`;
        layer.bindTooltip(initialTooltipContent, {
            permanent: false,
            direction: 'top',
            className: 'county-tooltip',
            offset: [0, -10]
        });
    }

    function populateCountyDropdown(countyOptions) {
        // Sort the options alphabetically by name
        countyOptions.sort((a, b) => a.name.localeCompare(b.name));
    
        countySelect.innerHTML = '<option value="" disabled selected>Select...</option>'; // Clear existing options
        countyOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.text = option.name;
            countySelect.add(opt);
        });
    
        // Reinitialize Select2 to update the dropdown options
        $('#county-select').select2({
            placeholder: 'Select a county',
            allowClear: true
        });
    }
    
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }
    
    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }
    
    
    

    var geojson;
    // fetch('/static/usa-counties.geojson')
    //     .then(response => response.json())
    //     .then(data => {
    //         geojson = L.geoJSON(data, {
    //             style: style,
    //             onEachFeature: onEachFeature
    //         }).addTo(map);
    //         populateCountyDropdown(data.features);
    //         // Check if there is stored data in localStorage and apply it
    //         const storedCsvData = localStorage.getItem('csvData');
    //         if (storedCsvData) {
    //             csvData = JSON.parse(storedCsvData);
    //             applyMapData();
    //         }
    //     })
    //     .catch(error => console.error('Error loading the GeoJSON file:', error));

    fetch('/static/usa-counties.geojson')
        .then(response => response.json())
        .then(geojsonData => {
            // Store geojsonData for later use
            window.geojsonData = geojsonData;
            // Initialize the map or perform other setup actions
            geojson = L.geoJSON(geojsonData, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);
            // populateCountyDropdown(geojsonData.features);
            // Check if there is stored data in localStorage and apply it
            const storedCsvData = localStorage.getItem('csvData');
            if (storedCsvData) {
                csvData = JSON.parse(storedCsvData);
                applyMapData();
            }
        })
        .catch(error => console.error('Error loading GeoJSON:', error));

    fetch('/static/us-states.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function (feature) {
                    return {
                        color: '#aaaaaa',
                        weight: 1.5,
                        fillOpacity: 0
                    };
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading the GeoJSON file:', error));

    L.Control.Home = L.Control.extend({
        onAdd: function (map) {
            var btn = L.DomUtil.create('button', 'leaflet-control-home');
            btn.innerHTML = 'Rescale';
            btn.onclick = function () {
                if (shadedCountyCount > 0) {
                    map.flyToBounds(shadedBounds, {
                        padding: [80, 80],
                        duration: 1
                    });
                } else {
                    map.flyTo([37.8, -96], 4, {
                        duration: 1
                    });
                }
                if (currentHighlightedLayer) {
                    geojson.resetStyle(currentHighlightedLayer);
                    currentHighlightedLayer.closeTooltip();
                    currentHighlightedLayer = null;
                }
            };
            return btn;
        },
        onRemove: function (map) { }
    });

    L.control.home = function (opts) {
        return new L.Control.Home(opts);
    };

    L.control.home({ position: 'bottomleft' }).addTo(map);

    // countySelect.addEventListener('change', function () {
    //     const selectedCounty = countySelect.value;
    //     geojson.eachLayer(function (layer) {
    //         if (`${layer.feature.properties.NAME}, ${stateFipsToAbbreviation[layer.feature.properties.STATEFP.padStart(2, '0')]}` === selectedCounty) {
    //             if (currentHighlightedLayer) {
    //                 geojson.resetStyle(currentHighlightedLayer);
    //                 currentHighlightedLayer.closeTooltip();
    //             }
    //             currentHighlightedLayer = layer;
    //             layer.setStyle({
    //                 weight: 2,
    //                 color: '#383434',
    //                 fillOpacity: 0.9,
    //                 fillColor: layer.feature.properties.fillColor
    //             });
    //             map.flyToBounds(layer.getBounds(), {
    //                 padding: [80, 80],
    //                 duration: 0.8
    //             });
    //             const tooltipContent = layer.feature.properties.xdValue !== null ?
    //                 `County: ${layer.feature.properties.NAME}<br>Wind speed: ${layer.feature.properties.xdValue} m/s` :
    //                 `County: ${layer.feature.properties.NAME}`;
    //             layer.bindTooltip(tooltipContent, {
    //                 permanent: false,
    //                 direction: 'top',
    //                 className: 'county-tooltip',
    //                 offset: [0, -10]
    //             }).openTooltip();
    //         }
    //     });
    // });

    
    countySelect.addEventListener('change', function () {
        const selectedCounty = countySelect.value;
        console.log('Selected county:', selectedCounty); // Debug log to check selected county value
    
        geojson.eachLayer(function (layer) {
            const countyFullName = `${layer.feature.properties.NAME}, ${stateFipsToAbbreviation[layer.feature.properties.STATEFP.padStart(2, '0')]}`;
            console.log('Comparing with:', countyFullName); // Debug log to check each layer's county name
    
            if (countyFullName === selectedCounty) {
                console.log('Match found, triggering highlightOnClick'); // Debug log to confirm match
                highlightOnClick({ target: layer });
            }
        });
    });
    
    

    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        var grades = [40, 60, 80, 100, 120]; // Fewer grades for a more compact legend
        var labels = [];

        var gradient = '<i style="background: linear-gradient(to right, '
            + d3.interpolateTurbo(0) + ', '
            + d3.interpolateTurbo(0.25) + ', '
            + d3.interpolateTurbo(0.5) + ', '
            + d3.interpolateTurbo(0.75) + ', '
            + d3.interpolateTurbo(1) + '); width: 100%; height: 10px; display: block;"></i>';

        labels.push(gradient);

        for (var i = 0; i < grades.length; i++) {
            labels.push(
                '<span style="float: left; margin-right: 10px;">' + grades[i] + '</span>');
        }

        labels.push('<span style="float: right;">m/s</span>');

        div.innerHTML = labels.join('');
        return div;
    };

    legend.addTo(map);

    // Load the form values from localStorage
    loadFormValues();
});
