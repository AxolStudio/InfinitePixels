(function () {
    'use strict';

    var username = '';
    var password = '';
    var accessForm = document.getElementById('access-form');
    var usernameInput = document.getElementById('admin-username');
    var passwordInput = document.getElementById('admin-password');
    var accessPanel = document.getElementById('access-panel');
    var queueSection = document.getElementById('queue-section');
    var lockButton = document.getElementById('lock-button');
    var refreshButton = document.getElementById('refresh-button');
    var suggestionsBody = document.getElementById('suggestions-body');
    var queueSummary = document.getElementById('queue-summary');
    var emptyState = document.getElementById('empty-state');
    var notice = document.getElementById('notice');
    var spritePreview = document.getElementById('sprite-preview');
    var spritePreviewCanvas = document.getElementById('sprite-preview-canvas');
    var spritePreviewContext = spritePreviewCanvas.getContext('2d');
    var apiBase = 'https://axolstudio.com/api/';

    function drawSprite(index) {
        if (!/^[a-f0-9]{64}$/i.test(index)) {
            return false;
        }

        var pixels = 10;
        spritePreviewContext.fillStyle = '#E4DBBA';
        spritePreviewContext.fillRect(0, 0, spritePreviewCanvas.width, spritePreviewCanvas.height);
        spritePreviewContext.fillStyle = '#260D1C';

        for (var pixel = 0; pixel < 256; pixel++) {
            var byteStart = Math.floor(pixel / 8) * 2;
            var byte = parseInt(index.slice(byteStart, byteStart + 2), 16);
            if ((byte & (1 << (pixel % 8))) !== 0) {
                spritePreviewContext.fillRect((pixel % 16) * pixels, Math.floor(pixel / 16) * pixels, pixels, pixels);
            }
        }

        return true;
    }

    function showSpritePreview(index, trigger) {
        if (!drawSprite(index)) {
            return;
        }

        spritePreview.setAttribute('aria-label', 'Preview of sprite ' + index);
        spritePreview.classList.remove('hidden');
        var bounds = trigger.getBoundingClientRect();
        var left = Math.min(Math.max(8, bounds.left), Math.max(8, window.innerWidth - 192));
        var top = bounds.bottom + 8;
        if (top + 192 > window.innerHeight) {
            top = Math.max(8, bounds.top - 192);
        }
        spritePreview.style.left = left + 'px';
        spritePreview.style.top = top + 'px';
    }

    function hideSpritePreview() {
        spritePreview.classList.add('hidden');
    }

    function formatSubmittedAt(value) {
        var date = new Date(String(value).replace(' ', 'T') + 'Z');
        return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    }

    function setNotice(message, isError) {
        notice.textContent = message;
        notice.classList.toggle('is-error', Boolean(isError));
        notice.classList.toggle('hidden', !message);
    }

    function setUnlocked(unlocked) {
        accessPanel.classList.toggle('hidden', unlocked);
        queueSection.classList.toggle('hidden', !unlocked);
        lockButton.classList.toggle('hidden', !unlocked);
    }

    async function apiRequest(path, options) {
        var requestOptions = options || {};
        requestOptions.headers = Object.assign({}, requestOptions.headers, {
            Authorization: 'Basic ' + btoa(username + ':' + password)
        });
        var response = await fetch(apiBase + path, requestOptions);
        var result;
        try {
            result = await response.json();
        } catch (_error) {
            throw new Error('API returned a non-JSON response. Check the server route and logs.');
        }

        if (!response.ok) {
            if (response.status === 401) {
                username = '';
                password = '';
                setUnlocked(false);
                usernameInput.value = '';
                passwordInput.value = '';
                usernameInput.focus();
            }
            throw new Error(result.status_message || 'Request failed (' + response.status + ')');
        }

        return result;
    }

    function makeCell(text, className) {
        var cell = document.createElement('td');
        cell.textContent = text == null ? '' : String(text);
        if (className) {
            cell.className = className;
        }
        return cell;
    }

    function renderSuggestions(suggestions) {
        suggestionsBody.replaceChildren();
        queueSummary.textContent = suggestions.length + (suggestions.length === 1 ? ' pending item' : ' pending items');
        emptyState.classList.toggle('hidden', suggestions.length !== 0);

        suggestions.forEach(function (suggestion) {
            var row = document.createElement('tr');
            row.appendChild(makeCell(suggestion.tag));

            var previewCell = document.createElement('td');
            previewCell.className = 'index-cell';
            var previewTrigger = document.createElement('button');
            previewTrigger.type = 'button';
            previewTrigger.className = 'preview-trigger';
            previewTrigger.textContent = suggestion.image_index.slice(0, 10) + '...';
            previewTrigger.setAttribute('aria-label', 'Hover or focus to preview sprite ' + suggestion.image_index);
            previewTrigger.title = suggestion.image_index;
            previewTrigger.addEventListener('mouseenter', function () {
                showSpritePreview(suggestion.image_index, previewTrigger);
            });
            previewTrigger.addEventListener('mouseleave', hideSpritePreview);
            previewTrigger.addEventListener('focus', function () {
                showSpritePreview(suggestion.image_index, previewTrigger);
            });
            previewTrigger.addEventListener('blur', hideSpritePreview);
            previewCell.appendChild(previewTrigger);
            var indexSuffix = document.createElement('span');
            indexSuffix.className = 'index-suffix';
            indexSuffix.textContent = suggestion.image_index.slice(-8);
            previewCell.appendChild(indexSuffix);
            row.appendChild(previewCell);
            row.appendChild(makeCell(formatSubmittedAt(suggestion.created_at)));

            var actions = document.createElement('td');
            actions.className = 'action-cell';
            actions.appendChild(makeReviewButton(suggestion, 'reject', 'Reject', 'reject-button'));
            actions.appendChild(makeReviewButton(suggestion, 'approve', 'Approve', 'approve-button'));
            row.appendChild(actions);
            suggestionsBody.appendChild(row);
        });
    }

    function makeReviewButton(suggestion, decision, label, className) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = label;
        button.addEventListener('click', function () {
            reviewSuggestion(suggestion, decision, button);
        });
        return button;
    }

    async function loadSuggestions() {
        refreshButton.disabled = true;
        setNotice('', false);
        try {
            var result = await apiRequest('admin/suggestions');
            renderSuggestions(result.data.suggestions || []);
        } catch (error) {
            setNotice(error.message, true);
        } finally {
            refreshButton.disabled = false;
        }
    }

    async function reviewSuggestion(suggestion, decision, button) {
        button.disabled = true;
        button.closest('tr').querySelectorAll('button').forEach(function (rowButton) {
            rowButton.disabled = true;
        });
        setNotice('', false);
        try {
            await apiRequest('admin/review-tag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: suggestion.id, decision: decision })
            });
            setNotice(decision === 'approve' ? 'Suggestion approved.' : 'Suggestion rejected.', false);
            await loadSuggestions();
        } catch (error) {
            setNotice(error.message, true);
        } finally {
            if (button.isConnected) {
                button.closest('tr').querySelectorAll('button').forEach(function (rowButton) {
                    rowButton.disabled = false;
                });
            }
        }
    }

    accessForm.addEventListener('submit', function (event) {
        event.preventDefault();
        username = usernameInput.value.trim();
        password = passwordInput.value;
        if (!username || !password) {
            return;
        }
        setUnlocked(true);
        loadSuggestions();
    });

    refreshButton.addEventListener('click', loadSuggestions);
    lockButton.addEventListener('click', function () {
        username = '';
        password = '';
        usernameInput.value = '';
        passwordInput.value = '';
        suggestionsBody.replaceChildren();
        setNotice('', false);
        setUnlocked(false);
        usernameInput.focus();
    });
})();