

document.addEventListener('DOMContentLoaded', function () {
    var KEY_HEX_LENGTH = 64;
    var KEY_BYTE_LENGTH = KEY_HEX_LENGTH / 2;
    var MODULUS = BigInt("0x1" + "0".repeat(KEY_HEX_LENGTH));
    var DEFAULT_STEP = 1n;
    var POSITION_MAP_SLOTS = 40n;

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
        var bytes = hexToBytes(hexKey);
        var binary = "";
        for (var i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    function codeToHex(code) {
        if (!code) {
            return null;
        }

        var trimmed = code.trim();
        var bytes = decodeBase64Url(trimmed);
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

    function parseStepValue(raw) {
        if (raw == null) {
            return null;
        }

        var value = String(raw).trim().toLowerCase();
        if (!value) {
            return null;
        }

        if (/^\d+$/.test(value)) {
            var direct = BigInt(value);
            return direct > 0n ? direct : null;
        }

        var sci = value.match(/^(\d+)e(\d+)$/);
        if (sci) {
            var coeff = BigInt(sci[1]);
            var exponent = BigInt(sci[2]);
            if (coeff <= 0n) {
                return null;
            }
            return coeff * (10n ** exponent);
        }

        return null;
    }

    function normalizeStepValue(raw, fallback) {
        var parsed = parseStepValue(raw);
        return parsed != null ? parsed : fallback;
    }

    function formatBigInt(value) {
        var s = value.toString();
        return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function navigateToHexKey(hexKey, lastValue) {
        var normalizedHex = sanitizeHexKey(hexKey);
        window.location.href = "?key=" + normalizedHex + "&last=" + encodeURIComponent(lastValue);
    }

    function setTargetFromHex(hexKey) {
        targetInput.value = hexToCode(sanitizeHexKey(hexKey));
        targetInput.classList.remove("is-invalid");
    }

    function getCurrentNotableLink(currentCode) {
        var notableLinks = document.querySelectorAll(".notable-link");
        for (var i = 0; i < notableLinks.length; i++) {
            var href = notableLinks[i].getAttribute("href") || "";
            var query = href.split("?")[1] || "";
            var params = new URLSearchParams(query);
            if (params.get("c") === currentCode) {
                return notableLinks[i];
            }
        }
        return null;
    }

    function updateNotableHighlight(currentCode) {
        var notableLinks = document.querySelectorAll(".notable-link");
        for (var i = 0; i < notableLinks.length; i++) {
            notableLinks[i].classList.remove("notable-link-active");
        }

        var currentNotableLink = getCurrentNotableLink(currentCode);
        if (currentNotableLink) {
            currentNotableLink.classList.add("notable-link-active");
            return true;
        }

        return false;
    }

    function renderPositionMap(hexKey, isNotable) {
        var map = document.getElementById("position-map");
        if (!map) {
            return;
        }

        var normalizedHex = sanitizeHexKey(hexKey);
        var numericKey = BigInt("0x" + normalizedHex);
        var activeIndex = Number((numericKey * POSITION_MAP_SLOTS) / MODULUS);
        var slotMarkup = "";

        for (var i = 0; i < Number(POSITION_MAP_SLOTS); i++) {
            if (i === activeIndex) {
                slotMarkup += '<span class="position-map-slot is-active' + (isNotable ? ' is-notable' : '') + '" aria-hidden="true"><i class="bi bi-bullseye"></i></span>';
            } else {
                slotMarkup += '<span class="position-map-slot" aria-hidden="true"><i class="bi bi-dot"></i></span>';
            }
        }

        var percent = ((activeIndex + 0.5) / Number(POSITION_MAP_SLOTS)) * 100;
        map.innerHTML = '<span class="position-map-end position-map-start" aria-hidden="true"><i class="bi bi-signpost-fill"></i></span>' +
            '<span class="position-map-track" aria-hidden="true">' + slotMarkup + '</span>' +
            '<span class="position-map-end position-map-finish" aria-hidden="true"><i class="bi bi-octagon-fill"></i></span>';
        map.title = "Approximate position in sprite space: about " + percent.toFixed(0) + "% through";
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

    var lastStep = normalizeStepValue(urlParams.get('last'), DEFAULT_STEP);
    document.getElementById("numAdjust").value = lastStep.toString();

    var spriteIdInput = document.getElementById('sprite-id');
    var targetInput = document.getElementById('sprite-id-target');
    var currentCode = hexToCode(key);
    spriteIdInput.value = currentCode;
    targetInput.value = "";
    renderPositionMap(key, updateNotableHighlight(currentCode));

    document.getElementById("btnRand").onclick = function (event) {
        event.preventDefault();
        var step = normalizeStepValue(document.getElementById("numAdjust").value, DEFAULT_STEP);
        document.getElementById("numAdjust").value = step.toString();
        navigateToHexKey(getRandomHex(), step.toString());
    };

    function getTargetOrCurrentHex() {
        var raw = targetInput.value.trim();
        if (!raw) {
            return key;
        }

        var parsedHex = codeToHex(raw);
        if (!parsedHex) {
            var sanitizedHex = raw.toLowerCase().replace(/[^a-f0-9]/g, "");
            if (sanitizedHex.length > 0) {
                parsedHex = sanitizeHexKey(sanitizedHex);
            }
        }

        return parsedHex;
    }

    document.getElementById("btnMinus").onclick = function () {
        var numAdjust = normalizeStepValue(document.getElementById("numAdjust").value, DEFAULT_STEP);
        document.getElementById("numAdjust").value = numAdjust.toString();

        var baseHex = getTargetOrCurrentHex();
        if (!baseHex) {
            targetInput.classList.add("is-invalid");
            return;
        }

        var numKey = BigInt("0x" + baseHex);
        numKey = (numKey - numAdjust + MODULUS) % MODULUS;
        setTargetFromHex(numKey.toString(16).padStart(KEY_HEX_LENGTH, '0'));
    };

    document.getElementById("btnPlus").onclick = function () {
        var numAdjust = normalizeStepValue(document.getElementById("numAdjust").value, DEFAULT_STEP);
        document.getElementById("numAdjust").value = numAdjust.toString();

        var baseHex = getTargetOrCurrentHex();
        if (!baseHex) {
            targetInput.classList.add("is-invalid");
            return;
        }

        var numKey = BigInt("0x" + baseHex);
        numKey = (numKey + numAdjust) % MODULUS;
        setTargetFromHex(numKey.toString(16).padStart(KEY_HEX_LENGTH, '0'));
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
        var inputValue = targetInput.value.trim();
        if (!inputValue) {
            return;
        }

        var parsedHex = codeToHex(inputValue);

        if (!parsedHex) {
            var sanitizedHex = inputValue.toLowerCase().replace(/[^a-f0-9]/g, "");
            if (sanitizedHex.length > 0) {
                parsedHex = sanitizeHexKey(sanitizedHex);
            }
        }

        if (!parsedHex) {
            targetInput.classList.add("is-invalid");
            return;
        }

        targetInput.classList.remove("is-invalid");
        var step = normalizeStepValue(document.getElementById("numAdjust").value, DEFAULT_STEP);
        document.getElementById("numAdjust").value = step.toString();
        navigateToHexKey(parsedHex, step.toString());
    }

    var expSlider = document.getElementById("exp-slider");
    var expValue = document.getElementById("exp-value");
    var expPreview = document.getElementById("exp-preview");
    var btnApplyExponent = document.getElementById("btnApplyExponent");

    function clampExponent(raw) {
        var n = parseInt(String(raw), 10);
        if (!Number.isFinite(n)) {
            n = 0;
        }
        if (n < 0) {
            n = 0;
        }
        if (n > 30) {
            n = 30;
        }
        return n;
    }

    function exponentToStep(exp) {
        return 10n ** BigInt(exp);
    }

    function syncExponentControls(exp) {
        var clamped = clampExponent(exp);
        if (expSlider) {
            expSlider.value = String(clamped);
        }
        if (expValue) {
            expValue.value = String(clamped);
        }
        if (expPreview) {
            expPreview.textContent = formatBigInt(exponentToStep(clamped));
        }
    }

    syncExponentControls(0);

    if (expSlider) {
        expSlider.addEventListener("input", function () {
            syncExponentControls(expSlider.value);
        });
    }

    if (expValue) {
        expValue.addEventListener("input", function () {
            syncExponentControls(expValue.value);
        });
    }

    if (btnApplyExponent) {
        btnApplyExponent.addEventListener("click", function () {
            var exp = clampExponent(expValue ? expValue.value : (expSlider ? expSlider.value : "0"));
            var step = exponentToStep(exp);
            document.getElementById("numAdjust").value = step.toString();
            syncExponentControls(exp);
        });
    }

    targetInput.addEventListener("input", function () {
        targetInput.classList.remove("is-invalid");
    });

    document.getElementById("btnGoCode").onclick = goToInputCode;
    targetInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            goToInputCode();
        }
    });
});
