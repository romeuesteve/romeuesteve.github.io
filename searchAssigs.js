var client_id = '9NYy9WxhUhNtISqa4hGS45fnDsTSoXIp33ZuAsnc';
var assigs = null;
window.selectedAssigs = {};

var baseUrl = "https://api.fib.upc.edu/v2/quadrimestres/2024Q1"; // default value

/**
 * Gets the current semester and calls getAssigs() to get the list of subjects.
*/
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
        // get the base URL without the last character (/)
        baseUrl = baseUrl.substring(0, baseUrl.length - 1); 
    })
    .catch(error => {
        console.error('Error:', error);
    }).then(() => {
        getAssigs();
        loadAssigsFromURL();
    }
);

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

    let dropdown = document.getElementById('dropdown');
    dropdown.innerHTML = ''; // clear the dropdown before adding new results

    // Ensure the dropdown width matches the search bar width
    let searchBar = document.getElementById('searchBar');
    dropdown.style.width = searchBar.offsetWidth + "px";

    sorted.forEach(item => {
        let li = document.createElement('li');
        li.textContent = item;
        li.onclick = () => {
            if (!(item in selectedAssigs)) {
                document.getElementById('searchBar').value = item;
                dropdown.classList.remove('show');
                addAssig(item);
            }
        };
        dropdown.appendChild(li);
    });
    if (input === '') {
        dropdown.classList.remove('show');
    } else {
        dropdown.classList.add('show');
    }
}

function checkForEnter(event) {
    if (assigs === null) return;
    if (event.key === 'Enter') {
        let input = document.getElementById('searchBar').value.toUpperCase();
        let filtered = assigs.filter(item => item.includes(input));
        let sorted = filtered.sort((a, b) => (a === input ? -1 : b === input ? 1 : 0));
        let closestMatch = sorted.find(item => item.includes(input));
        if (closestMatch && !(closestMatch in selectedAssigs)) {
            addAssig(closestMatch);
            document.getElementById('searchBar').value = '';
            document.getElementById('dropdown').classList.remove('show');
        }
    }
}

function addAssig(assig, selectedGroups = null) {
    if (assig in selectedAssigs) {
        return; // Prevent adding duplicates
    }
   
    selectedAssigs[assig] = {};
    
    let selectedAssigsContainer = document.getElementById('selectedAssigsContainer');
    // Create a new div element
    let div = document.createElement('div');
    let div2 = document.createElement('div');
    div2.style.display = 'flex';
    div2.style.justifyContent = 'space-between';
    div2.style.alignItems = 'center';
    // Create a new h2 element
    let h2 = document.createElement('h2');
    h2.textContent = assig;
    // Create a new button element
    let button = document.createElement('button');
    button.textContent = '🗑️';
    // Add a click event listener to remove the assignment
    button.onclick = function () {
        if (assig in selectedAssigs) {
            delete selectedAssigs[assig];
            updateURLParams();
            startGeneratingSchedules();
        }
        div.remove();
    };
    div2.appendChild(h2);
    div2.appendChild(button);
    div.appendChild(div2);
    selectedAssigsContainer.appendChild(div);

    getAssigData(assig).then(data => {
        getCapacity().then(capacity_data => {
            let assigGroups = getAssigGroups(data);
            assigGroups.forEach(group => {
                group.forEach(subgroup => {
                    let checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = assig + subgroup;
                    checkbox.name = subgroup;
                    
                    // Check if this subgroup should be checked
                    checkbox.checked = selectedGroups ? selectedGroups.includes(subgroup) : true;

                    checkbox.onclick = function () {
                        if (checkbox.checked) {
                            selectedAssigs[assig][subgroup] = {};
                            selectedAssigs[assig][subgroup].schedule = getAssigHours(data, subgroup);
                            selectedAssigs[assig][subgroup].capacity = getAssigCapacity(capacity_data, assig, subgroup);
                        } else {
                            delete selectedAssigs[assig][subgroup];
                        }
                        updateURLParams();
                        startGeneratingSchedules();
                    };

                    let label = document.createElement('label');
                    label.htmlFor = checkbox.id;
                    label.appendChild(document.createTextNode(subgroup));
                    div.appendChild(checkbox);
                    div.appendChild(label);

                    if (checkbox.checked) {
                        selectedAssigs[assig][subgroup] = {};
                        selectedAssigs[assig][subgroup].schedule = getAssigHours(data, subgroup);
                        selectedAssigs[assig][subgroup].capacity = getAssigCapacity(capacity_data, assig, subgroup);
                    }

                    if (isDeactivateFullGroupsEnabled() && selectedAssigs[assig][subgroup] && selectedAssigs[assig][subgroup].capacity && selectedAssigs[assig][subgroup].capacity.places_lliures === 0) {
                        checkbox.checked = false;
                        checkbox.disabled = true;
                        delete selectedAssigs[assig][subgroup];
                    }
                });
                div.appendChild(document.createElement('br'));
            });
            updateURLParams();
            startGeneratingSchedules();
        });
    });
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
            let hour = inici + i;
            if (!hours[dia_setmana]) {
                hours[dia_setmana] = new Set();
            }
            hours[dia_setmana].add(hour);
        }
    });
    let result_2 = {};
    Object.keys(hours).forEach(key => {
        let value = Array.from(hours[key]);
        value.sort((a, b) => a - b);
        result_2[key] = value;
    });
    return result_2;
}

function isDeactivateFullGroupsEnabled() {
    return document.getElementById('deactivateFullGroups').checked;
}

// Update capacity button
window.onload = function () {
    const updateCapacityElement = document.getElementById('updateCapacity');
    updateCapacityElement.onclick = handleUpdateCapacity;

    // Get the deactivateFullGroups checkbox
    const deactivateFullGroupsCheckbox = document.getElementById('deactivateFullGroups');
    // Add a 'change' event listener to the checkbox
    deactivateFullGroupsCheckbox.addEventListener('change', handleDeactivateFullGroups);
};

async function handleUpdateCapacity() {
    const updateCapacityElement = this;
    updateCapacityElement.disabled = true;

    try {
        const capacity_data = await getCapacity();
        Object.entries(selectedAssigs).forEach(([assig, groups]) => {
            Object.keys(groups).forEach(group => {
                selectedAssigs[assig][group].capacity = getAssigCapacity(capacity_data, assig, group);
            });
        });
        updateSchedule();
    } catch (error) {
        console.error('Error:', error);
    } finally {
        updateCapacityElement.disabled = false;
    }
}

async function handleDeactivateFullGroups() {
    this.disabled = true;

    if (!this.checked) {
        updateCheckboxes(checkbox => {
            checkbox.disabled = false;
        });
    } else {
        try {
            const capacity_data = await getCapacity();
            updateCheckboxes((checkbox, assig, group) => {
                const capacity = getAssigCapacity(capacity_data, assig, group);
                if (capacity && capacity.places_lliures === 0) {
                    checkbox.checked = false;
                    checkbox.disabled = true;
                    delete selectedAssigs[assig][group];
                }
            });
            startGeneratingSchedules();
        } catch (error) {
            console.error('Error:', error);
        }
    }
    this.disabled = false;
}

function updateCheckboxes(updateFunction) {
    Object.keys(selectedAssigs).forEach(assig => {
        const assigElements = document.querySelectorAll(`input[id^="${assig}"]`);
        assigElements.forEach(checkbox => {
            const group = checkbox.name;
            updateFunction(checkbox, assig, group);
        });
    });
}

function updateURLParams() {
    let baseURL = window.location.origin + window.location.pathname;
    let newURL = baseURL;
    let params = [];
    
    for (let assig in selectedAssigs) {
        for (let group in selectedAssigs[assig]) {
            if (selectedAssigs[assig][group]) {
                params.push(`a=${encodeURIComponent(assig)}_${encodeURIComponent(group)}`);
            }
        }
    }
    
    if (params.length > 0) {
        newURL += '?' + params.join('&');
    }
    
    window.history.replaceState(null, '', newURL);
}

function loadAssigsFromURL() {
    let params = new URLSearchParams(window.location.search);
    let assigGroups = params.getAll('a');
    
    let assigMap = {};
    
    assigGroups.forEach(assigGroup => {
        let [assig, group] = assigGroup.split('_');
        assig = decodeURIComponent(assig);
        group = decodeURIComponent(group);
        
        if (!assigMap[assig]) {
            assigMap[assig] = [];
        }
        assigMap[assig].push(group);
    });
    
    for (let assig in assigMap) {
        addAssig(assig, assigMap[assig]);
    }
}