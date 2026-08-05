

document.addEventListener('DOMContentLoaded', function () {
    var KEY_HEX_LENGTH = 128;
    var KEY_BYTE_LENGTH = KEY_HEX_LENGTH / 2;
    var MODULUS = BigInt("0x1" + "0".repeat(KEY_HEX_LENGTH));
    var BASE85_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~";
    var BASE85_CHAR_TO_VALUE = {};
    for (var i = 0; i < BASE85_ALPHABET.length; i++) {
        BASE85_CHAR_TO_VALUE[BASE85_ALPHABET.charAt(i)] = i;
    }

    function sanitizeHexKey(input) {
        var cleaned = (input || "").toLowerCase().replace(/[^a-f0-9]/g, "");
        if (cleaned.length > KEY_HEX_LENGTH) {
            cleaned = cleaned.slice(-KEY_HEX_LENGTH);
        }
        return cleaned.padStart(KEY_HEX_LENGTH, "0");
    }

    function hexToBytes(hexKey) {
        var sanitized = sanitizeHexKey(hexKey);
        var bytes = new Uint8Array(KEY_BYTE_LENGTH);
        for (var i = 0; i < sanitized.length; i += 2) {
            bytes[i / 2] = parseInt(sanitized.slice(i, i + 2), 16);
        }
        return bytes;
    }

    function bytesToHex(bytes) {
        var hex = "";
        for (var i = 0; i < bytes.length; i++) {
            hex += bytes[i].toString(16).padStart(2, "0");
        }
        return sanitizeHexKey(hex);
    }

    function encodeBase85(bytes) {
        var out = "";
        for (var i = 0; i < bytes.length; i += 4) {
            var value = (bytes[i] * 16777216) + (bytes[i + 1] * 65536) + (bytes[i + 2] * 256) + bytes[i + 3];
            var block = "";
            for (var j = 0; j < 5; j++) {
                block = BASE85_ALPHABET.charAt(value % 85) + block;
                value = Math.floor(value / 85);
            }
            out += block;
        }
        return out;
    }

    function decodeBase85(code) {
        if (!code || code.length % 5 !== 0) {
            return null;
        }

        var bytes = new Uint8Array((code.length / 5) * 4);
        var offset = 0;

        for (var i = 0; i < code.length; i += 5) {
            var value = 0;
            for (var j = 0; j < 5; j++) {
                var mapped = BASE85_CHAR_TO_VALUE[code.charAt(i + j)];
                if (mapped === undefined) {
                    return null;
                }
                value = (value * 85) + mapped;
            }

            if (!Number.isFinite(value) || value < 0 || value > 4294967295) {
                return null;
            }

            bytes[offset++] = Math.floor(value / 16777216) & 255;
            bytes[offset++] = Math.floor(value / 65536) & 255;
            bytes[offset++] = Math.floor(value / 256) & 255;
            bytes[offset++] = value & 255;
        }

        return bytes;
    }

    function decodeBase64Url(code) {
        if (!code) {
            return null;
        }
        var normalized = code.trim().replace(/-/g, "+").replace(/_/g, "/");
        while (normalized.length % 4 !== 0) {
            normalized += "=";
        }

        try {
            var binary = atob(normalized);
            if (binary.length !== KEY_BYTE_LENGTH) {
                return null;
            }

            var bytes = new Uint8Array(KEY_BYTE_LENGTH);
            for (var i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        } catch (_error) {
            return null;
        }
    }

    function hexToCode(hexKey) {
        return encodeBase85(hexToBytes(hexKey));
    }

    function codeToHex(code) {
        if (!code) {
            return null;
        }

        var trimmed = code.trim();
        var bytes = decodeBase85(trimmed);
        if (!bytes || bytes.length !== KEY_BYTE_LENGTH) {
            bytes = decodeBase64Url(trimmed);
        }
        if (!bytes || bytes.length !== KEY_BYTE_LENGTH) {
            return null;
        }

        return bytesToHex(bytes);
    }

    function getRandomHex() {
        var result = "";
        for (var i = 0; i < KEY_HEX_LENGTH; i++) {
            result += Math.floor(Math.random() * 16).toString(16);
        }
        return result;
    }

    function navigateToHexKey(hexKey, lastValue) {
        var normalizedHex = sanitizeHexKey(hexKey);
        window.location.href = "?key=" + normalizedHex + "&last=" + encodeURIComponent(lastValue);
    }

    var urlParams = new URLSearchParams(window.location.search);
    var key = null;

    if (urlParams.has('key')) {
        key = sanitizeHexKey(urlParams.get('key'));
    } else if (urlParams.has('c')) {
        key = codeToHex(urlParams.get('c'));
    }

    if (!key) {
        key = "0".repeat(KEY_HEX_LENGTH);
    }

    var last = parseInt(urlParams.get('last') || "1", 10);
    if (!Number.isFinite(last) || last <= 0) {
        last = 1;
    }

    document.getElementById("numAdjust").value = String(last);

    var spriteIdInput = document.getElementById('sprite-id');
    spriteIdInput.value = hexToCode(key);

    window.setValue = function (value) {
        document.getElementById("numAdjust").value = String(value);
    };

    document.getElementById("btnRand").setAttribute("href", "?key=" + getRandomHex());

    document.getElementById("btnMinus").onclick = function () {
        var numAdjust = parseInt(document.getElementById("numAdjust").value, 10);
        if (!Number.isFinite(numAdjust) || numAdjust <= 0) {
            numAdjust = 1;
        }

        var numKey = BigInt("0x" + key);
        numKey = (numKey - BigInt(numAdjust) + MODULUS) % MODULUS;
        key = numKey.toString(16).padStart(KEY_HEX_LENGTH, '0');
        navigateToHexKey(key, numAdjust);
    };

    document.getElementById("btnPlus").onclick = function () {
        var numAdjust = parseInt(document.getElementById("numAdjust").value, 10);
        if (!Number.isFinite(numAdjust) || numAdjust <= 0) {
            numAdjust = 1;
        }

        var numKey = BigInt("0x" + key);
        numKey = (numKey + BigInt(numAdjust)) % MODULUS;
        key = numKey.toString(16).padStart(KEY_HEX_LENGTH, '0');
        navigateToHexKey(key, numAdjust);
    };

    document.getElementById("btnCopyCode").onclick = async function () {
        var valueToCopy = spriteIdInput.value;
        try {
            await navigator.clipboard.writeText(valueToCopy);
        } catch (_error) {
            spriteIdInput.focus();
            spriteIdInput.select();
            document.execCommand("copy");
        }
    };

    function goToInputCode() {
        var inputValue = spriteIdInput.value.trim();
        var parsedHex = codeToHex(inputValue);

        if (!parsedHex) {
            var sanitizedHex = inputValue.toLowerCase().replace(/[^a-f0-9]/g, "");
            if (sanitizedHex.length > 0) {
                parsedHex = sanitizeHexKey(sanitizedHex);
            }
        }

        if (!parsedHex) {
            return;
        }

        navigateToHexKey(parsedHex, document.getElementById("numAdjust").value || "1");
    }

    document.getElementById("btnGoCode").onclick = goToInputCode;
    spriteIdInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            goToInputCode();
        }
    });
});
