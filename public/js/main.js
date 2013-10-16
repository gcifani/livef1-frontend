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
var carsArr = {};
var liveTimingTable = "";

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
        if (!(data.carId in carsArr)) {
            carsArr[data.carId] = [];
        }
        switch (Object.keys(data)[0]) {
            case 'history':
                carsArr[data.carId][0] = data.history[0];
                break;
            case 'positionUpdate':
                carsArr[data.carId][0] = data.positionUpdate;
                break;
            case 'position':
                carsArr[data.carId][0] = data.position;
                break;
            case 'number':
                carsArr[data.carId][1] = data.number;
                break;
            case 'driver':
                carsArr[data.carId][2] = data.driver;
                break;
            case 'gap':
                carsArr[data.carId][3] = data.gap;
                break;
            case 'interval':
                carsArr[data.carId][4] = data.interval;
                break;
            case 'lapTime':
                carsArr[data.carId][5] = data.lapTime;
                break;
            case 'sector1':
                carsArr[data.carId][6] = data.sector1;
                break;
            case 'pitlap1':
                carsArr[data.carId][7] = data.pitlap1;
                break;
            case 'sector2':
                carsArr[data.carId][8] = data.sector2;
                break;
            case 'pitlap2':
                carsArr[data.carId][9] = data.pitlap2;
                break;
            case 'sector3':
                carsArr[data.carId][10] = data.sector3;
                break;
            case 'pitlap3':
                carsArr[data.carId][11] = data.pitlap3;
                break;
            case 'numPits':
                carsArr[data.carId][12] = data.numPits;
                break;
        }
        for (var i in carsArr) {
            carsArr[i].forEach(function(value, index){
                // console.log(value);
            });
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

    console.log(data);

});
