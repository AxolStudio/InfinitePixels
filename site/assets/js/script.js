

document.addEventListener('DOMContentLoaded', function () {
    // get key from search params
    var urlParams = new URLSearchParams(window.location.search);
    var key = urlParams.get('key');
    var last = urlParams.get('last');
    if (!last)
        last = 1;
    setValue(last);

    var minKey = '';
    var maxKey = '';
    for (var i = 0; i < 128; i++) {
        minKey += "0";
        maxKey += "f";
    }
    if (key == null) {
        key = minKey;
    }
    else {
        key = key.replace(/[^a-f0-9]/gi, '');

        key = key.padStart(128, '0');
    }

    document.getElementById('sprite-id').value = key;




    function getRandom() {
        // make a random 128-digit hex number
        var r = "";
        for (var i = 0; i < 128; i++) {
            r += Math.floor(Math.random() * 16).toString(16);
        }
        return r;
    }
    var uniqueID = BigInt('0x' + key).toString(36);

    function setValue(Value) {
        document.getElementById("numAdjust").value = Value;
    }

    document.getElementById("btnRand").setAttribute("href", "?key=" + getRandom());
    document.getElementById("btnMinus").onclick = function () {

        var numAdjust = parseInt(document.getElementById("numAdjust").value);
        var numKey = BigInt("0x" + key);
        numKey -= BigInt(numAdjust);
        if (numKey < BigInt("0x" + minKey)) {
            numKey += maxKey;
        }
        key = numKey.toString(16);
        window.location.href = "?key=" + key.padStart(128, '0') + "&last=" + numAdjust;
    }
    document.getElementById("btnPlus").onclick = function () {

        var numAdjust = parseInt(document.getElementById("numAdjust").value);
        var numKey = BigInt("0x" + key);
        numKey += BigInt(numAdjust);
        if (numKey > BigInt("0x" + maxKey)) {
            numKey -= maxKey;
        }
        key = numKey.toString(16);
        window.location.href = "?key=" + key.padStart(128, '0') + "&last=" + numAdjust;
    }


});
