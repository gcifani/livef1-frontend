var commentBox = document.querySelector("#commentBox"),
    eventTitle = document.querySelector("#eventTitle"),
    splash     = document.querySelector("#splash"),
    livetiming = document.querySelector("#livetiming>tbody");
var socket = io.connect('http://192.168.110.220:3000');
var commentary = {
    texts: [],
    bit: false,
    first: false
}

var addRow = function(carId) {
    var element = livetiming.querySelector("tr.carId-"+carId);
    if (element == null) {
        var tr = document.createElement("tr"),
            td;
        for (var i=1; i<14; i++) {
            td = document.createElement("td");
            tr.appendChild(td);
        }
        livetiming.appendChild(tr);
        return element;
    }
}
addRow(13);

var positionUpdate = function(carId, posId) {
    return true;
}
exit;
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
    if (data.carId && data.carId >= 0) {
        switch (Object.keys(data)[0]) {
            case 'history':
                console.log( livetiming.querySelector("tr>td:nth-child(3)") );
                // .innerHTML = data.history[0];
                break;
            // case 'positionUpdate':
            //     carsArr[data.carId][0] = data.positionUpdate;
            //     break;
            // case 'position':
            //     carsArr[data.carId][0] = data.position;
            //     break;
            // case 'number':
            //     carsArr[data.carId][1] = data.number;
            //     break;
            // case 'driver':
            //     carsArr[data.carId][2] = data.driver;
            //     break;
            // case 'gap':
            //     carsArr[data.carId][3] = data.gap;
            //     break;
            // case 'interval':
            //     carsArr[data.carId][4] = data.interval;
            //     break;
            // case 'lapTime':
            //     carsArr[data.carId][5] = data.lapTime;
            //     break;
            // case 'sector1':
            //     carsArr[data.carId][6] = data.sector1;
            //     break;
            // case 'pitlap1':
            //     carsArr[data.carId][7] = data.pitlap1;
            //     break;
            // case 'sector2':
            //     carsArr[data.carId][8] = data.sector2;
            //     break;
            // case 'pitlap2':
            //     carsArr[data.carId][9] = data.pitlap2;
            //     break;
            // case 'sector3':
            //     carsArr[data.carId][10] = data.sector3;
            //     break;
            // case 'pitlap3':
            //     carsArr[data.carId][11] = data.pitlap3;
            //     break;
            // case 'numPits':
            //     carsArr[data.carId][12] = data.numPits;
            //     break;
        }

        // console.log(data);
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

    // console.log(data);

});
