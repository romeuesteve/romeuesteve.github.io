const table = document.getElementById('schedule');
const days = ['', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];
const hours = Array.from({ length: 13 }, (_, i) => i + 8); // from 8 to 20

// Create header row
const headerRow = document.createElement('tr');
days.forEach(day => {
    const th = document.createElement('th');
    th.textContent = day;
    headerRow.appendChild(th);
});
table.appendChild(headerRow);

// Create schedule rows
hours.forEach(hour => {
    const row = document.createElement('tr');
    const timeCell = document.createElement('td');
    timeCell.textContent = `${hour}-${hour + 1}h`;
    row.appendChild(timeCell);
    for (let i = 1; i < days.length; i++) {
        const cell = document.createElement('td');
        row.appendChild(cell);
    }
    table.appendChild(row);
});

let schedules = [];
let currentSchedule = 0;

function generateSchedules(assigs = [], zeroGroups = [], schedule = {}) {
    let sameGroup = document.getElementById('sameGroup').checked;
    if (zeroGroups.length === 0 && assigs.length === 0) {
        schedules.push(schedule);
        return;
    }

    if (zeroGroups.length > 0) {
        const currentAssig = zeroGroups[0].assig;
        const groups = zeroGroups.filter(group => group.assig === currentAssig);
        const restGroups = zeroGroups.filter(group => group.assig !== currentAssig);
        for (let i = 0; i < groups.length; i++) {
            const newSchedule = JSON.parse(JSON.stringify(schedule));
            let overlap = false;
            if (selectedAssigs[currentAssig][groups[i].group].schedule) { // Check if the group exists
                for (let day in selectedAssigs[currentAssig][groups[i].group].schedule) {
                    if (!newSchedule[day]) newSchedule[day] = {};
                    selectedAssigs[currentAssig][groups[i].group].schedule[day].forEach(hour => {
                        if (newSchedule[day][hour]) {
                            overlap = true;
                        } else {
                            newSchedule[day][hour] = `${currentAssig} ${groups[i].group}`;
                        }
                    });
                }
            }
            if (!overlap) {
                generateSchedules(assigs, restGroups, newSchedule, sameGroup);
            }
        }
    } else {
        const [currentAssig, ...restAssigs] = assigs;
        for (let group in selectedAssigs[currentAssig]) {
            if (group.endsWith('0')) continue; // Skip groups ending in 0
            const newSchedule = JSON.parse(JSON.stringify(schedule));
            let overlap = false;
            if (selectedAssigs[currentAssig][group]) { // Check if the group exists
                for (let day in selectedAssigs[currentAssig][group].schedule) {
                    if (!newSchedule[day]) newSchedule[day] = {};
                    selectedAssigs[currentAssig][group].schedule[day].forEach(hour => {
                        if (newSchedule[day][hour]) {
                            overlap = true;
                        } else {
                            if (sameGroup) {
                                const firstDigit = group.charAt(0);
                                for (let otherDay in newSchedule) {
                                    for (let otherHour in newSchedule[otherDay]) {
                                        const otherAssigGroup = newSchedule[otherDay][otherHour].split(' ');
                                        const otherAssig = otherAssigGroup[0];
                                        const otherGroup = otherAssigGroup[1];
                                        if (otherAssig === currentAssig && otherGroup.charAt(0) !== firstDigit) {
                                            overlap = true;
                                            break;
                                        }
                                    }
                                    if (overlap) break;
                                }

                            }
                            if (!overlap) {
                                newSchedule[day][hour] = `${currentAssig} ${group}`;
                            }
                        }
                    });
                }
            }
            if (!overlap) {
                generateSchedules(restAssigs, zeroGroups, newSchedule, sameGroup);
            }
        }
    }
}

function startGeneratingSchedules() {
    currentSchedule = 0; // Reset the current schedule index
    document.getElementById('scheduleIndex').value = 1;

    schedules = []; // Clear the schedules array
    let zeroGroups = [];
    let allAssigs = Object.keys(selectedAssigs);
    for (let i = 0; i < allAssigs.length; i++) {
        let hasNonZeroGroup = false;
        for (let group in selectedAssigs[allAssigs[i]]) {
            if (group.endsWith('0')) {
                zeroGroups.push({ assig: allAssigs[i], group });
            }
            else {
                hasNonZeroGroup = true;
            }
        }
        if (!hasNonZeroGroup) {
            allAssigs.splice(i, 1);
            i--;
        }
    }

    //let sameGroup = true;
    generateSchedules(allAssigs, zeroGroups, {});

    schedules.sort((a, b) => compareSchedules(a, b));
    updateSchedule();
}

startGeneratingSchedules();

function updateSchedule() {
    const table = document.getElementById('schedule');
    // Clear the table
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
    // Add the current schedule to the table
    const schedule = schedules[currentSchedule];
    for (let hour = 8; hour <= 20; hour++) {
        const row = table.insertRow(-1);
        row.insertCell(0).innerHTML = `${hour}-${hour + 1}h`;
        for (let day = 1; day <= 5; day++) {
            const cell = row.insertCell(-1);
            if (schedule && schedule[day] && schedule[day][hour]) {
                const [assig, group] = schedule[day][hour].split(' ');
                const strStyle = getStyle(`${assig}`);
                if (document.getElementById('showCapacity').checked) {
                    const capacity = selectedAssigs[assig][group].capacity;
                    const strCapacity = capacity ? ` (${capacity.places_lliures}/${capacity.places_totals})` : "";
                    cell.innerHTML = `<div ${strStyle}>${schedule[day][hour]}<br>${strCapacity}</div>`;
                } else {
                    cell.innerHTML = `<div ${strStyle}>${schedule[day][hour]}</div>`;
                }
            } else {
                cell.innerHTML = "";
            }
            cell.style.textAlign = "center";
            cell.style.verticalAlign = "middle";
        }
    }
    // Update the schedule index
    if (schedule) {
        document.getElementById('scheduleSelector').textContent = `Horari ${currentSchedule + 1} de ${schedules.length}`;
    } else {
        document.getElementById('scheduleSelector').textContent = "No s'han trobat horaris possibles";
    }
}

function string2color(str) {
    // Calculate hash value
    var hash = 5382;
    for (var i = 0; i < str.length; ++i) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }

    // Use the hash value to generate HSL values
    var h = (hash % 360);       // Hue value between 0 and 360
    var s = 80;                 // Saturation fixed at 80%
    var l = 40 + (hash % 3)*20;   // Lightness varies oscillates between 40, 60 and 80

    // Function to convert HSL to RGB
    function hslToRgb(h, s, l) {
        var r, g, b;

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            var hue2rgb = function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    // Function to convert RGB to hex
    function rgbToHex(r, g, b) {
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    // Convert HSL to RGB
    var rgb = hslToRgb(h / 360, s / 100, l / 100);

    // Convert RGB to hex
    var col = rgbToHex(rgb[0], rgb[1], rgb[2]);

    // Exceptions
    var excepcions = {'AL-F': '#781919'};
    if (excepcions[str] !== undefined) {
        return excepcions[str];
    }
    return "#" + col;
}


function blackOverColor(bg) {
    var r = parseInt(bg.substr(1, 2), 16);
    var g = parseInt(bg.substr(3, 2), 16);
    var b = parseInt(bg.substr(5, 2), 16);
    return 0.213 * r + 0.715 * g + 0.072 * b > 127;
}

/**
 * Estil d'una caixa d'horari
 * @param str Nom de l'assignatura
 * @returns {string} Retorna el parametre style per a una assignatura donada
 */
function getStyle(str)
{
    var bgcolor = string2color(str)
    var color = blackOverColor(bgcolor) ? 'black' : 'white'
    return 'style="padding:2px;background-color: ' + bgcolor + '; color: ' + color + '"'
}

// Sorting functions
function sortSchedules() {
    schedules.sort((a, b) => compareSchedules(a, b));
    updateSchedule();
}

function compareSchedules(a, b) {
    // Valores de retorno estan puesto a ojo
    let result = 0;

    function calculateDeadHours(schedule) {
        let totalDeadHours = 0;
        for (let day = 1; day <= 5; day++) {
            let previousHour = null;
            for (let hour = 8; hour <= 20; hour++) {
                if (schedule[day] && schedule[day][hour]) {
                    if (previousHour !== null && hour - previousHour > 1) {
                        totalDeadHours += hour - previousHour - 1;
                    }
                    previousHour = hour;
                }
            }
        }
        return totalDeadHours / 3.5;
    }
    function calculateFreeDays(schedule) {
        let totalFreeDays = 0;
        for (let day = 1; day <= 5; day++) {
            let isFreeDay = true;
            for (let hour = 8; hour <= 20; hour++) {
                if (schedule[day] && schedule[day][hour]) {
                    isFreeDay = false;
                    break;
                }
            }
            if (isFreeDay) {
                totalFreeDays++;
            }
        }

        return -totalFreeDays / 2.5;
    }

    // each marks from 0 to 10 how important is to have less dead hours
    let deadHours = document.getElementById('deadHours');
    let freeDays = document.getElementById('freeDays');

    result += (calculateDeadHours(a) - calculateDeadHours(b)) * deadHours.value;
    result += (calculateFreeDays(a) - calculateFreeDays(b)) * freeDays.value;


    return result;
}




// Add event listeners for schedule navigation buttons
document.getElementById('prevSchedule').addEventListener('click', () => {
    currentSchedule = (currentSchedule - 1 + schedules.length) % schedules.length;
    document.getElementById('scheduleIndex').value = currentSchedule + 1;
    updateSchedule();
});
document.getElementById('nextSchedule').addEventListener('click', () => {
    currentSchedule = (currentSchedule + 1) % schedules.length;
    document.getElementById('scheduleIndex').value = currentSchedule + 1;
    updateSchedule();
});

window.addEventListener('keydown', function (event) {
    switch (event.key) {
        case 'ArrowLeft':
            currentSchedule = (currentSchedule - 1 + schedules.length) % schedules.length;
            document.getElementById('scheduleIndex').value = currentSchedule + 1;
            updateSchedule();
            break;
        case 'ArrowRight':
            currentSchedule = (currentSchedule + 1) % schedules.length;
            document.getElementById('scheduleIndex').value = currentSchedule + 1;
            updateSchedule();
            break;
    }
});


document.getElementById('sameGroup').addEventListener('change', startGeneratingSchedules);

document.getElementById('showCapacity').addEventListener('change', updateSchedule);

document.getElementById('scheduleIndex').addEventListener('change', () => {
    //check if it's in the range
    if (document.getElementById('scheduleIndex').value > schedules.length) {
        document.getElementById('scheduleIndex').value = schedules.length;
    }
    currentSchedule = document.getElementById('scheduleIndex').value - 1;
    updateSchedule();
});

document.getElementById('deadHours').addEventListener('change', sortSchedules);
document.getElementById('freeDays').addEventListener('change', sortSchedules);