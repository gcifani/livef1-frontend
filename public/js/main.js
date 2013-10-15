// document.addEventListener('touchmove', function(e) { e.preventDefault(); });
var commentBox = document.querySelector("#commentBox"),
    eventTitle = document.querySelector("#eventTitle"),
    splash     = document.querySelector("#splash");
var socket = io.connect('http://192.168.110.220:3000');
var commentary = {
    texts: [],
    bit: false,
    first: false
}

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
