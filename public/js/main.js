var commentBox = document.querySelector("#commentBox"),
    eventTitle = document.querySelector("#eventTitle"),
    splash     = document.querySelector("#splash"),
    table      = document.querySelector("#livetiming"),
    tableHead  = document.querySelector("#livetiming>thead"),
    tableBody  = document.querySelector("#livetiming>tbody");
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
}
var colors = {
    1: "white",
    2: "red",
    3: "green",
    4: "purple",
    5: "blue",
    6: "yellow"
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

var isRow = function(id, column, eventType) {
    if (id > 0 && columns[eventType].indexOf(column) >= 0) {
        var element = tableBody.querySelector("tr.carId-" + id + ">td." + column);
        if (element !== null) {
            return element;
        }
    }
    return false;
};

var createTableHead = function(eventType) {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
    var tr = document.createElement("tr"),
             th, span;
    labels[eventType].forEach(function(val, i){
        th = document.createElement("th");
        span = document.createElement("span");
        span.innerHTML = val;
        th.appendChild(span);
        tr.appendChild(th);
    });
    tableHead.appendChild(tr);
};

var addOrUpdateRow = function(id, eventType, column, data, extra) {
    if (columns[eventType].indexOf(column)>=0) {
        var element = isRow(id, column, eventType);
        if (element === false) {
            var tr = document.createElement("tr"),
                td, span;
            columns[eventType].forEach(function(val, i){
                td = document.createElement("td");
                span = document.createElement("span");
                if (val == column) {
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
            var span = element.querySelector("span");
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
        splash.innerHTML = "<span>" + data.notice + "<span>";
        splash.classList.add('hidden');
    }

    // prepare the user interface
    if (data.startSession) {
        console.clear();
        commentBox.innerHTML = "";
        tableBody.innerHTML = "";
        tableHead.innerHTML = "";
        theEvent.id = data.sessionId;
        theEvent.type = data.eventType;
        table.removeAttribute("class");
        table.classList.add(events[theEvent.type]);
        createTableHead(theEvent.type);
    }

    // live timing datas
    if (data.carId && data.carId > 0) {
        switch (packetName) {
        case 'positionUpdate':
            addOrUpdateRow(data.carId, theEvent.type, 'position', data[packetName], data.extra);
            sortRows(data.carId, data[packetName]);
        case 'position':
            if (data[packetName] === 0) {
                var element = tableBody.querySelector("tr.carId-" + data.carId + ">td:first-child>span");
                element.removeAttribute("class");
                element.classList.add("hidden");
            } else {
                addOrUpdateRow(data.carId, theEvent.type, packetName, data[packetName], data.extra);
                sortRows(data.carId, data[packetName]);
            }
            break;
        default:
            addOrUpdateRow(data.carId, theEvent.type, packetName, data[packetName], data.extra);
            break;
        }
    }

    // best lap record
    if (data.fastestLapCar || data.fastestLapDriver || data.fastestLapTime || data.fastestLapLap) {
        document.querySelector("#" + packetName).innerHTML = data[packetName];
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
