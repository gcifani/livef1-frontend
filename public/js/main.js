var commentBox   = document.querySelector("#commentBox"),
    splash       = document.querySelector("#splash"),
    timingBox    = document.querySelector("#timingBox"),
    table        = document.querySelector("#livetiming"),
    tableHead    = document.querySelector("#livetiming>thead"),
    tableBody    = document.querySelector("#livetiming>tbody"),
    // tableFoot    = document.querySelector("#livetiming>tfoot"),
    // sessionClock = document.querySelector("#session_clock"),
    bestLap      = document.querySelector("#best_lap");
    
var io = io || {},
    console = console || {};
var socket = io.connect('http://127.0.0.1:3000');
var commentary = {
    texts: [""],
    linebreak: false
};
var theEvent = {
    id: 0,
    type: 0
};
var colors = {
    1: "white",
    2: "red",
    3: "green",
    4: "purple",
    5: "blue",
    6: "yellow",
    7: "grey"
};
var events = {
    1: 'Race',
    2: 'Practice',
    3: 'Qualifying'
};
var labels = {
    1: ['P','','Name','Gap','Int','','S1','','S2','','S3','','Pit'],
    2: ['P','','Name','Best','Gap','S1','S2','S3','Laps'],
    3: ['P','','Name','Period 1','Period 2','Period 3','S1','S2','S3','Laps']
};
var columns = {
    1: ['position','number','driver','gap','interval','lapTime','sector1','pitLap1','sector2','pitLap2','sector3','pitLap3','numPits'],
    2: ['position','number','driver','bestLapTime','gap','sector1','sector2','sector3','lapCount'],
    3: ['position','number','driver','period1','period2','period3','sector1','sector2','sector3','lapCount'],
};
var errorMessages = {
    'EHOSTUNREACH': "Error, host unreachable!"
};

var isRow = function(id, column) {
    if (id > 0 && columns[theEvent.type].indexOf(column) >= 0) {
        var element = tableBody.querySelector("tr.carId-" + id + ">td." + column);
        if (element !== null) {
            return element;
        }
    }
    return false;
};

var createTableHead = function() {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
    var tr = document.createElement("tr"),
             th, span;
    labels[theEvent.type].forEach(function(val){
        th = document.createElement("th");
        span = document.createElement("span");
        span.innerHTML = val;
        th.appendChild(span);
        tr.appendChild(th);
    });
    tableHead.appendChild(tr);
};

var addOrUpdateRow = function(id, column, data, extra) {
    if (columns[theEvent.type].indexOf(column)>=0) {
        var element = isRow(id, column);
        var span;
        if (element === false) {
            var tr = document.createElement("tr"),
                td;
            columns[theEvent.type].forEach(function(val){
                td = document.createElement("td");
                span = document.createElement("span");
                if (val === column) {
                    span.innerHTML = data !== 0 ? data : "";
                    if (extra > 0) { span.classList.add(colors[extra]); }
                }
                td.classList.add(val);
                td.appendChild(span);
                tr.appendChild(td);
            });
            tr.classList.add("carId-" + id);
            tableBody.appendChild(tr);
        } else {
            span = element.querySelector("span");
            span.innerHTML = data !== "0" ? data : "";
            if (extra > 0) {
                span.removeAttribute("class");
                span.classList.add(colors[extra]);
            }
        }
    }
};

var sortRows = function() {
    var elements = tableBody.querySelectorAll("tr"),
        store = [];
    Array.prototype.forEach.call(elements, function(row) {
        var sortnr = parseFloat(row.cells[0].textContent || row.cells[0].innerText);
        if (!isNaN(sortnr)) {
            store.push([sortnr, row]);
        }
    });
    store.sort(function(x, y) {
        return x[0] - y[0];
    });
    for (var i=0, len=store.length; i<len; i++) {
        tableBody.appendChild(store[i][1]);
    }
    store = null;
};

socket.on('error', function (data) {
    console.error(data);
    splash.innerHTML = "<span>" + errorMessages[data.code] + "<span>";
    splash.classList.remove('hidden');
});

socket.on('packet', function (data) {

    var packetName = Object.keys(data)[0];

    // notice
    if (data.notice) {
        if (data.notice.indexOf('img:/') >= 0) {
            timingBox.style.backgroundImage = "url('http://live-timing.formula1.com/" + data.notice.slice(5) + "')";
        } else {
            timingBox.backgroundImage = "none";
            splash.innerHTML = "<span>" + data.notice + "<span>";
        }
    }

    // prepare the user interface
    if (data.startSession) {
        console.clear();
        commentBox.innerHTML = "";
        tableBody.innerHTML = "";
        tableHead.innerHTML = "";
        if (events.hasOwnProperty(data.eventType)) {
            theEvent.id = data.sessionId;
            theEvent.type = data.eventType;
            table.removeAttribute("class");
            table.classList.add(events[theEvent.type]);
            createTableHead(theEvent.type);
        }
        splash.classList.add('hidden');
    }

    // live timing datas
    if (data.carId && data.carId > 0) {
        switch (packetName) {
        case 'positionUpdate':
            addOrUpdateRow(data.carId, 'position', data[packetName], data.extra);
            sortRows(data.carId, data[packetName]);
            break;
        case 'position':
            if (data[packetName] === 0) {
                var element = tableBody.querySelector("tr.carId-" + data.carId + ">td:first-child>span");
                element.removeAttribute("class");
                element.classList.add("hidden");
            } else {
                addOrUpdateRow(data.carId, packetName, data[packetName], data.extra);
                sortRows(data.carId, data[packetName]);
            }
            break;
        default:
            addOrUpdateRow(data.carId, packetName, data[packetName], data.extra);
            break;
        }
    }

    // best lap record
    if (data.fastestLapCar || data.fastestLapDriver || data.fastestLapTime || data.fastestLapLap) {
        document.querySelector("#" + packetName).innerHTML = data[packetName];
        if (data.fastestLapTime && data.fastestLapTime === "0") {
            bestLap.removeAttribute("class");
            bestLap.classList.add("hidden");
        } else if (data.fastestLapTime) {
            bestLap.removeAttribute("class");
        }
    }

    // Track status
    if (data.trackStatus) {
        // TODO: display track status
    }

    // copyright
    if (data.copyright) {
        console.log(data.copyright);
    }

    // commentary
    if (data.commentary) {
        if (commentary.linebreak) {
            commentary.texts.push(data.commentary[1]);
        } else {
            var commentaryBit = commentary.texts.pop();
            commentary.texts.push(commentaryBit + data.commentary[1]);
        }
        commentBox.innerHTML = commentary.texts.join("<br><br>");
        commentBox.scrollTop = commentBox.scrollHeight;
        commentary.linebreak = data.commentary[0];
    }

    // if (data.extra && data.extra > 4 && data.extra !== 6) {
        console.log(data);
    // }

});
