var commentBox = document.querySelector("#commentBox"),
    eventTitle = document.querySelector("#eventTitle"),
    splash     = document.querySelector("#splash"),
    livetiming = document.querySelector("#livetiming>tbody");
var io = io || {},
    console = console || {};
var socket = io.connect('http://127.0.0.1:3000');
var commentary = {
    texts: [],
    linebreak: false
};
var colors = {
    1: "white",
    3: "green",
    4: "purple",
    6: "yellow"
};

var isRow = function(id) {
    if (id > 0) {
        var element = livetiming.querySelector("tr.carId-"+id);
        if (element !== null) {
            return livetiming.querySelector("tr.carId-"+id);
        }
    }
    return false;
};

var addOrUpdateRow = function(id, column, data, extra) {
    if (isRow(id) === false) {
        var tr = document.createElement("tr"),
            td, span;
        for (var i=1; i<14; i++) {
            td = document.createElement("td");
            span = document.createElement("span");
            if (i === column) {
                span.innerHTML = data !== 0 ? data : "";
            if (extra > 0) { span.classList.add(colors[extra]); }
            }
            td.appendChild(span);
            tr.appendChild(td);
        }
        tr.classList.add("carId-" + id);
        livetiming.appendChild(tr);
    } else {
        var element = livetiming.querySelector("tr.carId-" + id + ">td:nth-child(" + column + ")>span");
        element.innerHTML = data !== "0" ? data : "";
        if (extra > 0) {
            element.removeAttribute("class");
            element.classList.add(colors[extra]);
        }
    }
};

var sortRows = function() {
    var elements = livetiming.querySelectorAll("tr"),
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
        livetiming.appendChild(store[i][1]);
    }
    store = null;
};

socket.on('packet', function (data) {

    var packetName = Object.keys(data)[0];

    // notice
    if (data.notice) {
        splash.innerHTML = "<span>" + data.notice + "<span>";
        splash.classList.remove('hidden');
    }

    // prepare the user interface
    if (data.startSession) {
        commentBox.innerHTML = "";
        console.clear();
        livetiming.innerHTML = "";
        switch (data.eventType) {
        case 1:
            eventTitle.innerHTML = "Race";
            break;
        case 2:
            eventTitle.innerHTML = "Practice";
            break;
        case 3:
            eventTitle.innerHTML = "Qualifying";
            break;
        }
    }

    // live timing datas
    if (data.carId && data.carId > 0) {
        var dataTypes = {
            "history": 1,
            "positionUpdate": 1,
            "position": 1,
            "number": 2,
            "driver": 3,
            "gap": 4,
            "interval": 5,
            "lapTime": 6,
            "sector1": 7,
            "pitLap1": 8,
            "sector2": 9,
            "pitLap2": 10,
            "sector3": 11,
            "pitLap3": 12,
            "numPits": 13
        };
        if (dataTypes[packetName] > 0) {
            switch (packetName) {
            case 'history':
                addOrUpdateRow(data.carId, dataTypes[packetName], data.history[0], data.extra);
                break;
            case 'positionUpdate':
            case 'position':
                if (data[packetName] === 0) {
                    var element = livetiming.querySelector("tr.carId-" + data.carId + ">td:first-child>span");
                    element.removeAttribute("class");
                    element.classList.add("hidden");
                } else {
                    addOrUpdateRow(data.carId, dataTypes[packetName], data[packetName], data.extra);
                    sortRows(data.carId, data[packetName]);
                }
                break;
            default:
                addOrUpdateRow(data.carId, dataTypes[packetName], data[packetName], data.extra);
                break;
            }
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

    // console.log(data);

});
