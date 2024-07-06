var client_id = '9NYy9WxhUhNtISqa4hGS45fnDsTSoXIp33ZuAsnc';
var assigs = null;
window.selectedAssigs = {};

let baseUrl = "https://api.fib.upc.edu/v2/quadrimestres/2024Q1/"; // default value

/**
 * Gets the current semester
 */
function getCurrentSemester() {
    let url = 'https://api.fib.upc.edu/v2/quadrimestres/actual-horaris/?client_id=' + client_id;
    fetch(url, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())  
        .then(data => {
            baseUrl = data.url;
        })
        .catch(error => {
            console.error('Error:', error);
        }
        );
    return baseUrl;
}   

getCurrentSemester();

function getAssigs() {
    let url = baseUrl + '/assignatures/?client_id=' + client_id;
    fetch(url, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            assigs = data.results;
        })
        .catch(error => console.error('Error:', error));
}

function search() {
    if (assigs === null) return;
    let input = document.getElementById('searchBar').value.toUpperCase();
    let filtered = assigs.filter(item => item.includes(input));
    let sorted = filtered.sort((a, b) => (a === input ? -1 : b === input ? 1 : 0));

    let output = document.getElementById('output');
    output.innerHTML = ''; // clear the output before adding new results

    sorted.forEach(item => {
        let li = document.createElement('li');
        li.textContent = item;
        output.appendChild(li);
    });
    if (input === '') {
        output.innerHTML = '';
    }
}

async function getAssigData(assig) {
    let url = baseUrl + '/classes/?codi_assig=' + assig + '&client_id=' + client_id;
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    } catch (error) {
        return console.error('Error:', error);
    }
}

async function getCapacity() {
    let url = 'https://api.fib.upc.edu/v2/assignatures/places/?client_id=' + client_id;
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        return console.error('Error:', error);
    }
}

function getAssigCapacity(data, assig, group) {
    let result = data.results.find(item =>
        item.assig === assig && item.grup === group);
    if (!result) return null;
    else return { "places_lliures": result.places_lliures, "places_totals": result.places_totals };
}

function getAssigGroups(data) {
    let result_1 = data.results.map(item => item.grup);
    let groups = {};
    result_1.forEach(numStr => {
        let num = Number(numStr);
        let key = Math.floor(num / 10) * 10;
        if (!groups[key]) {
            groups[key] = new Set();
        }
        groups[key].add(numStr);
    });
    let sortedAndClassified = Object.values(groups).map(set => {
        let array = Array.from(set);
        array.sort((a, b) => Number(a) - Number(b));
        return array;
    });
    return sortedAndClassified;
}

function getAssigHours(data, group) {
    let hours = {};
    let result_1 = data.results.filter(item => item.grup === group);
    result_1.forEach(item_1 => {
        let dia_setmana = item_1.dia_setmana;
        let inici = parseInt(item_1.inici.split(':')[0]);
        for (let i = 0; i < item_1.durada; i++) {
            if (hours[dia_setmana]) {
                hours[dia_setmana].push(inici + i);
            }
            else {
                hours[dia_setmana] = [inici + i];
            }
        }
    });
    return hours;
}

function isDeactivateFullGroupsEnabled() {
    return document.getElementById('deactivateFullGroups').checked;
}

function checkForEnter(event) {
    if (assigs === null) return;

    if (event.key === 'Enter') {
        let input = document.getElementById('searchBar').value.toUpperCase();
        let filtered = assigs.filter(item => item.includes(input));
        let sorted = filtered.sort((a, b) => (a === input ? -1 : b === input ? 1 : 0));

        let closestMatch = sorted.find(item => item.includes(input));

        if (closestMatch && !(closestMatch in selectedAssigs)) {
            selectedAssigs[closestMatch] = {};
            document.getElementById('searchBar').value = '';

            // Create a new div element
            let div = document.createElement('div');
            let div2 = document.createElement('div');
            div2.style.display = 'flex';
            div2.style.justifyContent = 'space-between';
            div2.style.alignItems = 'center';

            // Create a new h2 element
            let h2 = document.createElement('h2');
            h2.textContent = closestMatch;

            // Create a new button element
            let button = document.createElement('button');
            button.textContent = 'X';
            button.onclick = function () {
                // Remove the h2 and button elements from the DOM
                if (closestMatch in selectedAssigs) {
                    delete selectedAssigs[closestMatch];
                    startGeneratingSchedules();
                }

                div.remove();
            };
            div2.appendChild(h2);
            div2.appendChild(button);

            div.appendChild(div2);

            // Append the div element to the DOM
            document.getElementById('selectedAssigsContainer').appendChild(div);

            let assigGroups = null;

            getAssigData(closestMatch).then(data => {
                getCapacity().then(capacity_data => {
                    assigGroups = getAssigGroups(data);

                    assigGroups.forEach(group => {
                        group.forEach(subgroup => {
                            // Create a new checkbox element
                            let checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.id = closestMatch + subgroup;
                            checkbox.name = subgroup;
                            checkbox.checked = true;

                            checkbox.onclick = function () {
                                if (checkbox.checked) {
                                    selectedAssigs[closestMatch][subgroup] = {};
                                    selectedAssigs[closestMatch][subgroup].schedule = getAssigHours(data, subgroup);
                                    selectedAssigs[closestMatch][subgroup].capacity = getAssigCapacity(capacity_data, closestMatch, subgroup);
                                }
                                else {
                                    delete selectedAssigs[closestMatch][subgroup];
                                }
                                startGeneratingSchedules();
                            };

                            // Create a new label element
                            let label = document.createElement('label');
                            label.htmlFor = checkbox.id;
                            label.appendChild(document.createTextNode(subgroup));

                            // Append the checkbox and label elements to the DOM
                            div.appendChild(checkbox);
                            div.appendChild(label);

                            selectedAssigs[closestMatch][subgroup] = {};
                            selectedAssigs[closestMatch][subgroup].schedule = getAssigHours(data, subgroup);
                            selectedAssigs[closestMatch][subgroup].capacity = getAssigCapacity(capacity_data, closestMatch, subgroup);
                            if (isDeactivateFullGroupsEnabled() && selectedAssigs[closestMatch][subgroup].capacity && selectedAssigs[closestMatch][subgroup].capacity.places_lliures === 0) {

                                checkbox.checked = false;
                                checkbox.disabled = true;
                                delete selectedAssigs[closestMatch][subgroup];
                            }
                        });
                        div.appendChild(document.createElement('br'));

                    });
                    startGeneratingSchedules();
                });
            });
        }
    }
}

getAssigs();

// Handle deactivation of full groups
/*document.getElementById('deactivateFullGroups').onchange = function () {
    startGeneratingSchedules();
};*/

// Update capacity button
window.onload = function () {
    var updateCapacityElement = document.getElementById('updateCapacity');
    if (updateCapacityElement) {
        updateCapacityElement.onclick = function () {
            // disable the button
            updateCapacityElement.disabled = true;

            getCapacity().then(capacity_data => {
                for (let assig in selectedAssigs) {
                    for (let group in selectedAssigs[assig]) {
                        selectedAssigs[assig][group].capacity = getAssigCapacity(capacity_data, assig, group);
                    }
                }
                updateSchedule();
                // Re-enable the button
                updateCapacityElement.disabled = false;
            }).catch(error => {
                console.error('Error:', error);

                // Re-enable the button in case of error
                updateCapacityElement.disabled = false;
            });
        };
    } else {
        console.error("Element with id 'updateCapacity' not found");
    }
};

// Get the deactivateFullGroups checkbox
let deactivateFullGroupsCheckbox = document.getElementById('deactivateFullGroups');

// Add a 'change' event listener to the checkbox
deactivateFullGroupsCheckbox.addEventListener('change', function () {
    // If the checkbox is unchecked
    if (!this.checked) {
        this.disabled = true;
        // Iterate over all checkboxes
        for (let assig in selectedAssigs) {
            let assigElements = document.querySelectorAll('input[id^="' + assig + '"]');
            assigElements.forEach(checkbox => {
                // Set the checkbox to checked and enabled
                checkbox.disabled = false;
            });
        }
        this.disabled = false;
    }
    else {
        this.disabled = true;
        // Iterate over all checkboxes and deactivate full groups
        getCapacity().then(capacity_data => {
            for (let assig in selectedAssigs) {
                let assigElements = document.querySelectorAll('input[id^="' + assig + '"]');

                assigElements.forEach(checkbox => {
                    let group = checkbox.name;
                    let capacity = getAssigCapacity(capacity_data, assig, group);
                    if (capacity && capacity.places_lliures === 0) {
                        checkbox.checked = false;
                        checkbox.disabled = true;
                        delete selectedAssigs[assig][group];
                    }
                });
            }
            this.disabled = false;
            startGeneratingSchedules();
        });
    }
});
