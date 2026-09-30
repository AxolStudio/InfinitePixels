

document.addEventListener('DOMContentLoaded', function () {
    var KEY_HEX_LENGTH = 64;
    var KEY_BYTE_LENGTH = KEY_HEX_LENGTH / 2;
    var MODULUS = BigInt("0x1" + "0".repeat(KEY_HEX_LENGTH));
    var DEFAULT_STEP = 1n;
    var POSITION_MAP_SLOTS = 40n;
    var DEFAULT_PALETTE = ["#E4DBBA", "#260D1C"];
    var CUSTOM_PALETTES_KEY = "infinitePixels.customPalettes";

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

    function normalizePaletteColor(value) {
        var color = String(value || "").replace(/^#/, "").toUpperCase();
        return /^[0-9A-F]{6}$/.test(color) ? "#" + color : null;
    }

    function paletteValue(colors) {
        return colors.map(function (color) {
            return normalizePaletteColor(color).slice(1);
        }).join(",");
    }

    function parsePaletteValue(value) {
        if (!value) {
            return null;
        }

        var colors = value.split(",").map(normalizePaletteColor);
        return colors.length === 2 && colors[0] && colors[1] ? colors : null;
    }

    function loadCustomPalettes() {
        try {
            var saved = JSON.parse(localStorage.getItem(CUSTOM_PALETTES_KEY) || "[]");
            if (!Array.isArray(saved)) {
                return [];
            }

            return saved.filter(function (palette) {
                return palette && typeof palette.name === "string" &&
                    normalizePaletteColor(palette.background) && normalizePaletteColor(palette.pixels);
            }).map(function (palette) {
                return {
                    name: palette.name.trim().slice(0, 32) || "My Palette",
                    background: normalizePaletteColor(palette.background),
                    pixels: normalizePaletteColor(palette.pixels)
                };
            });
        } catch (_error) {
            return [];
        }
    }

    function appendCustomPaletteOption(group, palette) {
        var option = document.createElement("option");
        option.value = paletteValue([palette.background, palette.pixels]);
        option.textContent = palette.name;
        group.appendChild(option);
    }

    function updatePalettePreview(backgroundColor, pixelsColor, backgroundId, pixelsId) {
        document.getElementById(backgroundId).style.backgroundColor = backgroundColor;
        document.getElementById(pixelsId).style.backgroundColor = pixelsColor;
    }

    function applyPalette(colors) {
        var params = new URLSearchParams(window.location.search);
        params.set("palette", paletteValue(colors));
        var query = params.toString();
        window.location.href = window.location.pathname + (query ? "?" + query : "") + window.location.hash;
    }

    function navigateToHexKey(hexKey, lastValue) {
        var normalizedHex = sanitizeHexKey(hexKey);
        var params = new URLSearchParams(window.location.search);
        params.delete("c");
        params.set("key", normalizedHex);
        params.set("last", lastValue);
        window.location.href = "?" + params.toString();
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

    var paletteSelect = document.getElementById("palette-select");
    var paletteModalElement = document.getElementById("paletteModal");
    var paletteEditorModalElement = document.getElementById("paletteEditorModal");
    var paletteModal = bootstrap.Modal.getOrCreateInstance(paletteModalElement);
    var paletteEditorModal = bootstrap.Modal.getOrCreateInstance(paletteEditorModalElement);
    var paletteStatus = document.getElementById("palette-status");
    var paletteBackgroundInput = document.getElementById("palette-color-background");
    var palettePixelsInput = document.getElementById("palette-color-pixels");
    var paletteNameInput = document.getElementById("palette-name");
    var editorStatus = document.getElementById("palette-editor-status");
    var customPalettes = loadCustomPalettes();
    var customPaletteGroup = document.createElement("optgroup");
    customPaletteGroup.label = "Saved palettes";
    customPalettes.forEach(function (palette) {
        appendCustomPaletteOption(customPaletteGroup, palette);
    });
    if (customPalettes.length > 0) {
        paletteSelect.appendChild(customPaletteGroup);
    }

    var currentPalette = parsePaletteValue(urlParams.get("palette")) || DEFAULT_PALETTE;
    var currentPaletteValue = paletteValue(currentPalette);
    var paletteOptionExists = Array.prototype.some.call(paletteSelect.options, function (option) {
        return option.value.toUpperCase() === currentPaletteValue;
    });
    if (!paletteOptionExists) {
        var currentPaletteOption = document.createElement("option");
        currentPaletteOption.value = currentPaletteValue;
        currentPaletteOption.textContent = "Current custom palette";
        paletteSelect.insertBefore(currentPaletteOption, paletteSelect.firstChild);
    }
    paletteSelect.value = currentPaletteValue;

    function getSelectedPalette() {
        return parsePaletteValue(paletteSelect.value) || DEFAULT_PALETTE;
    }

    function updateSelectedPalettePreview() {
        var colors = getSelectedPalette();
        updatePalettePreview(colors[0], colors[1], "palette-preview-background", "palette-preview-pixels");
        paletteStatus.textContent = "Background " + colors[0] + " / Pixels " + colors[1];
    }

    function updateEditorPalettePreview() {
        updatePalettePreview(paletteBackgroundInput.value, palettePixelsInput.value, "palette-editor-background", "palette-editor-pixels");
    }

    function hideThen(modalElement, modalInstance, callback) {
        modalElement.addEventListener("hidden.bs.modal", callback, { once: true });
        modalInstance.hide();
    }

    paletteSelect.addEventListener("change", updateSelectedPalettePreview);
    updateSelectedPalettePreview();
    updateEditorPalettePreview();

    document.getElementById("btnApplyPalette").addEventListener("click", function () {
        var colors = getSelectedPalette();
        hideThen(paletteModalElement, paletteModal, function () {
            applyPalette(colors);
        });
    });

    document.getElementById("btnAddPalette").addEventListener("click", function () {
        var colors = getSelectedPalette();
        paletteNameInput.value = "My Palette";
        paletteBackgroundInput.value = colors[0];
        palettePixelsInput.value = colors[1];
        editorStatus.textContent = "";
        updateEditorPalettePreview();
        hideThen(paletteModalElement, paletteModal, function () {
            paletteEditorModal.show();
        });
    });

    paletteBackgroundInput.addEventListener("input", updateEditorPalettePreview);
    palettePixelsInput.addEventListener("input", updateEditorPalettePreview);

    document.getElementById("btnSavePalette").addEventListener("click", function () {
        var name = paletteNameInput.value.trim();
        if (!name) {
            editorStatus.textContent = "Enter a name for this palette.";
            paletteNameInput.focus();
            return;
        }

        var palette = {
            name: name.slice(0, 32),
            background: normalizePaletteColor(paletteBackgroundInput.value),
            pixels: normalizePaletteColor(palettePixelsInput.value)
        };
        var value = paletteValue([palette.background, palette.pixels]);
        var existingOption = Array.prototype.find.call(paletteSelect.options, function (option) {
            return option.value.toUpperCase() === value;
        });

        if (!existingOption) {
            if (!customPaletteGroup.parentNode) {
                paletteSelect.appendChild(customPaletteGroup);
            }
            customPalettes.push(palette);
            try {
                localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(customPalettes));
            } catch (_error) {
                editorStatus.textContent = "Could not save palettes in this browser.";
                return;
            }
            appendCustomPaletteOption(customPaletteGroup, palette);
        }

        paletteSelect.value = value;
        hideThen(paletteEditorModalElement, paletteEditorModal, function () {
            applyPalette([palette.background, palette.pixels]);
        });
    });

    document.querySelectorAll(".notable-link").forEach(function (link) {
        link.addEventListener("click", function (event) {
            var currentParams = new URLSearchParams(window.location.search);
            if (!currentParams.has("palette")) {
                return;
            }

            event.preventDefault();
            var targetUrl = new URL(link.href, window.location.href);
            targetUrl.searchParams.set("palette", currentParams.get("palette"));
            if (currentParams.has("last")) {
                targetUrl.searchParams.set("last", currentParams.get("last"));
            }
            window.location.href = targetUrl.pathname + targetUrl.search + targetUrl.hash;
        });
    });

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
