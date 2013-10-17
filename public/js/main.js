var commentBox = document.querySelector("#commentBox"),
    eventTitle = document.querySelector("#eventTitle"),
    splash     = document.querySelector("#splash"),
    livetiming = document.querySelector("#livetiming>tbody");
var io = io || {},
    console = console || {};
var socket = io.connect('http://192.168.110.220:3000');
var commentary = {
    texts: [],
    bit: false,
    first: false
};
var colors = {
    1: "white",
    3: "green",
    4: "purple",
    6: "yellow"
}

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
            td, content;
        for (var i=1; i<14; i++) {
            td = document.createElement("td");
            if (column > 0 && i == column) {
                if (extra > 0) {
                    console.log("color: ", extra);
                    td.innerHTML = "<span class=\"" + colors[extra] + "\">" + data + "</span>";
                } else {
                    td.innerHTML = data;
                }
                // content = document.createTextNode(data);
                // td.appendChild(content);
            }
            tr.appendChild(td);
        }
        tr.classList.add("carId-" + id);
        livetiming.appendChild(tr);
    } else if (id > 0 && column > 0) {
        if (extra > 0) {
            console.log("color: ", extra);
            livetiming.querySelector("tr.carId-" + id + ">td:nth-child(" + column + ")").innerHTML = "<span class=\"" + colors[extra] + "\">" + data + "</span>";
        } else {
            livetiming.querySelector("tr.carId-" + id + ">td:nth-child(" + column + ")").innerHTML = data;
        }
    }
};

var removeRow = function(id) {
    var element = isRow(id),
        removeNode = false;
    if (element !== false) {
        var removedNode = livetiming.removeChild(element);
    }
    return removeNode;
};

var sortRows = function() {
    var elements = livetiming.querySelectorAll("tr"),
        store = [];
    Array.prototype.forEach.call(elements, function(row) {
        var sortnr = parseFloat(row.cells[0].textContent || row.cells[0].innerText);
        if(!isNaN(sortnr)) store.push([sortnr, row]);
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
            "pitlap1": 8,
            "sector2": 9,
            "pitlap2": 10,
            "sector3": 11,
            "pitlap3": 12,
            "numPits": 13
        };
        var dataTypeName = Object.keys(data)[0];
        if (dataTypes[dataTypeName] > 0) {
            switch (dataTypeName) {
            case 'history':
                addOrUpdateRow(data.carId, dataTypes[dataTypeName], data.history[0]);
                break;
            case 'positionUpdate':
                addOrUpdateRow(data.carId, dataTypes[dataTypeName], data[dataTypeName]);
                sortRows(data.carId, data[dataTypeName]);
                break;
            default:
                if (data[dataTypeName] != 0) {
                    addOrUpdateRow(data.carId, dataTypes[dataTypeName], data[dataTypeName], data.extra);
                }
                break;
            }
        }
    }

    // copyright
    if (data.copyright) {
        console.log(data.copyright);
    }

    // commentary
    if (data.commentary) {
        if (!commentary.bit) {
            commentary.texts.push(data.commentary);
        } else {
            var commentaryBit = commentary.texts.pop();
            commentary.texts.push(commentaryBit + data.commentary);
        }
        commentBox.innerHTML = commentary.texts.join("<br><br>");
        commentBox.scrollTop = commentBox.scrollHeight;
        commentary.bit = true;
        // first comment
        if (commentary.first) {
            splash.classList.add('hidden');
        } else {
            commentary.first = true;
        }
    } else {
        commentary.bit = false;
    }

    // if (data.extra) console.log(data);

});
