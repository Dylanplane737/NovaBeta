/* =============================================
   main.js — Core search logic, state management,
   event listeners, dashboard rendering
   ============================================= */

// Global namespace
window.Nova = window.Nova || {};

// ========== Application State ==========
Nova.state = {
    currentQuery: '',
    wikiData: null,
    wikiExtract: '',
    mediaImages: [],       // Array of { thumb: url, full: url }
    mediaOffset: 0,
    mediaQuery: '',
    mediaLoading: false,
    lightboxImages: [],
    lightboxIndex: 0,
    matrixAnimId: null,
    matrixActive: false
};

// ========== DOM References ==========
Nova.dom = {
    searchScreen: document.getElementById('searchScreen'),
    urlInput: document.getElementById('urlInput'),
    searchBtn: document.getElementById('searchBtn'),
    autocompleteDropdown: document.getElementById('autocompleteDropdown'),
    dashboard: document.getElementById('dashboard'),
    dashTitle: document.getElementById('dashTitle'),
    backBtn: document.getElementById('backBtn'),
    dashContent: document.getElementById('dashContent'),
    wikiWidget: document.getElementById('wikiWidget'),
    mediaWidget: document.getElementById('mediaWidget'),
    videoWidget: document.getElementById('videoWidget'),
    dictWidget: document.getElementById('dictWidget'),
    timelineWidget: document.getElementById('timelineWidget'),
    calculatorWidget: document.getElementById('calculatorWidget'),
    calcInput: document.getElementById('calcInput'),
    calcResult: document.getElementById('calcResult'),
    graphCanvas: document.getElementById('graphCanvas'),
    mapWidget: document.getElementById('mapWidget'),
    mapContainer: document.getElementById('mapContainer'),
    mapResults: document.getElementById('mapResults'),
    mapTitle: document.getElementById('mapTitle'),
    mapBackBtn: document.getElementById('mapBackBtn'),
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxClose: document.getElementById('lightboxClose'),
    lightboxPrev: document.getElementById('lightboxPrev'),
    lightboxNext: document.getElementById('lightboxNext'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    matrixCanvas: document.getElementById('matrixCanvas'),
    easterEggImg: document.getElementById('easterEggImg'),
    floatingWindows: document.getElementById('floatingWindows')
};

// ========== Utility Functions ==========
function showLoading() {
    Nova.dom.loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    Nova.dom.loadingSpinner.classList.add('hidden');
}

function showScreen(name) {
    var dom = Nova.dom;
    dom.searchScreen.classList.add('hidden');
    dom.dashboard.classList.add('hidden');
    dom.mapWidget.classList.add('hidden');
    dom.calculatorWidget.classList.add('hidden');

    if (name === 'search') {
        dom.searchScreen.classList.remove('hidden');
        dom.calculatorWidget.classList.add('hidden');
    } else if (name === 'dashboard') {
        dom.dashboard.classList.remove('hidden');
    } else if (name === 'map') {
        dom.mapWidget.classList.remove('hidden');
    } else if (name === 'search-calc') {
        dom.searchScreen.classList.remove('hidden');
        dom.calculatorWidget.classList.remove('hidden');
    }
}

function closeLightbox() {
    Nova.dom.lightbox.classList.add('hidden');
    Nova.dom.lightboxImg.src = '';
}

function openLightbox(images, index) {
    if (!images || images.length === 0) return;
    Nova.state.lightboxImages = images;
    Nova.state.lightboxIndex = index;
    Nova.dom.lightboxImg.src = images[index];
    Nova.dom.lightbox.classList.remove('hidden');
}

function navigateLightbox(direction) {
    var imgs = Nova.state.lightboxImages;
    var idx = Nova.state.lightboxIndex;
    if (imgs.length === 0) return;
    idx = idx + direction;
    if (idx < 0) idx = imgs.length - 1;
    if (idx >= imgs.length) idx = 0;
    Nova.state.lightboxIndex = idx;
    Nova.dom.lightboxImg.src = imgs[idx];
}

// ========== Autocomplete ==========
var acIndex = -1;
var debounceTimer = null;

function closeAutocomplete() {
    Nova.dom.autocompleteDropdown.classList.add('hidden');
    Nova.dom.autocompleteDropdown.innerHTML = '';
    acIndex = -1;
}

function updateAcHighlight(items) {
    for (var i = 0; i < items.length; i++) {
        items[i].classList.remove('active');
    }
    if (acIndex >= 0 && acIndex < items.length) {
        items[acIndex].classList.add('active');
    }
}

function fetchAutocomplete(query) {
    if (!query || query.length < 2) {
        closeAutocomplete();
        return;
    }
    var url = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' +
        encodeURIComponent(query) + '&limit=8&format=json&origin=*';

    fetch(url)
        .then(function(resp) { return resp.json(); })
        .then(function(data) {
            var suggestions = data[1];
            if (!suggestions || suggestions.length === 0) {
                closeAutocomplete();
                return;
            }
            var dd = Nova.dom.autocompleteDropdown;
            dd.innerHTML = '';
            dd.classList.remove('hidden');
            for (var i = 0; i < suggestions.length; i++) {
                var div = document.createElement('div');
                div.className = 'ac-item';
                div.textContent = suggestions[i];
                div.setAttribute('role', 'option');
                div.dataset.value = suggestions[i];
                dd.appendChild(div);
            }
            acIndex = -1;
        })
        .catch(function() {
            closeAutocomplete();
        });
}

// ========== Easter Eggs ==========
function stopMatrix() {
    if (Nova.state.matrixAnimId) {
        cancelAnimationFrame(Nova.state.matrixAnimId);
        Nova.state.matrixAnimId = null;
    }
    Nova.state.matrixActive = false;
    Nova.dom.matrixCanvas.classList.add('hidden');
}

function startMatrix() {
    var canvas = Nova.dom.matrixCanvas;
    canvas.classList.remove('hidden');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var ctx = canvas.getContext('2d');
    var cols = Math.floor(canvas.width / 18);
    var drops = [];
    for (var i = 0; i < cols; i++) {
        drops[i] = Math.random() * -100;
    }
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()';
    Nova.state.matrixActive = true;

    function draw() {
        if (!Nova.state.matrixActive) return;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff41';
        ctx.font = '15px monospace';
        for (var i = 0; i < drops.length; i++) {
            var ch = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(ch, i * 18, drops[i] * 18);
            if (drops[i] * 18 > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        Nova.state.matrixAnimId = requestAnimationFrame(draw);
    }
    draw();
}

function showEasterEggImage(src, isGif) {
    var container = Nova.dom.easterEggImg;
    container.innerHTML = '';
    if (isGif) {
        var txt = document.createElement('div');
        txt.className = 'ee-text';
        txt.textContent = 'You got Rickrolled!';
        container.appendChild(txt);
    } else {
        var img = document.createElement('img');
        img.src = src;
        img.alt = 'Easter egg';
        container.appendChild(img);
    }
    container.classList.remove('hidden');
}

function closeEasterEgg() {
    Nova.dom.easterEggImg.classList.add('hidden');
    Nova.dom.easterEggImg.innerHTML = '';
}

function checkEasterEggs(query) {
    var q = query.trim().toLowerCase();
    if (q === 'matrix') {
        startMatrix();
        return true;
    }
    if (q === '67') {
        showEasterEggImage('', true);
        return true;
    }
    if (q === 'doge') {
        showEasterEggImage('https://upload.wikimedia.org/wikipedia/en/5/5f/Original_Doge_meme.jpg', false);
        return true;
    }
    if (q === 'flip') {
        document.body.classList.add('flipping');
        setTimeout(function() {
            document.body.classList.remove('flipping');
        }, 900);
        return true;
    }
    return false;
}

// ========== URL Detection ==========
function isUrl(query) {
    // Contains a dot but doesn't start with a math expression
    var trimmed = query.trim();
    if (trimmed.indexOf('.') !== -1) {
        // Make sure it's not just a decimal number like "3.14"
        var parts = trimmed.split('.');
        if (parts.length >= 2) {
            var afterDot = parts[1].replace(/\s/g, '');
            // If the part after dot has letters, it's likely a URL
            if (/[a-zA-Z]/.test(afterDot)) {
                return true;
            }
        }
    }
    return false;
}

function openWebsite(url) {
    var finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
    }
    window.open(finalUrl, '_blank', 'noopener');
}

// ========== Math Detection ==========
function isMathExpression(query) {
    var q = query.trim();
    // Contains math operators
    if (/[+\-*/^()=]/.test(q) && /\d/.test(q)) {
        return true;
    }
    // Contains 'x' as a variable near numbers
    if (/\d/.test(q) && /x/i.test(q)) {
        // Remove common words that might have x
        var cleaned = q.replace(/next|exit|extra|example|excellent|explore|explain|exchange|exactly|except|expect|experience|express|extended|extension|extreme|text|context|index|flex|complex|box|mix|fix|six|tax|max|ox|pixel|lux|vex|wax|hex|sex|lex|nexus|index|relax|reflex/gi, '');
        if (/\d/.test(cleaned) && /x/i.test(cleaned)) {
            return true;
        }
    }
    return false;
}

// ========== Map Detection ==========
function isMapQuery(query) {
    var q = query.trim().toLowerCase();
    var mapWords = ['map', 'near me', 'coffee', 'restaurant', 'cafe', 'hotel', 'hospital', 'pharmacy', 'park', 'school', 'library', 'airport', 'station', 'mall', 'store', 'shop', 'bank', 'atm', 'gas', 'parking'];
    for (var i = 0; i < mapWords.length; i++) {
        if (q.indexOf(mapWords[i]) !== -1) return true;
    }
    // City,Country format
    if (/^[a-zA-Z\s]+,[a-zA-Z\s]+$/.test(q)) return true;
    return false;
}

// ========== API Fetch Functions (Top-Level) ==========

function fetchWikiData(query) {
    var url = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=true&explaintext=true&piprop=thumbnail|original&pithumbsize=400&titles=' +
        encodeURIComponent(query) + '&format=json&origin=*';

    return fetch(url)
        .then(function(resp) { return resp.json(); })
        .then(function(data) {
            var pages = data.query.pages;
            var pageId = Object.keys(pages)[0];
            var page = pages[pageId];
            if (pageId === '-1' || page.missing !== undefined) {
                return null;
            }
            return {
                title: page.title,
                extract: page.extract || '',
                thumbnail: page.thumbnail ? page.thumbnail.source : null,
                original: page.original ? page.original.source : null,
                pageId: pageId
            };
        })
        .catch(function() {
            return null;
        });
}

function fetchMediaData(query, offset) {
    var offsetVal = offset || 0;
    var url = 'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=' +
        encodeURIComponent(query) + '&srnamespace=6&srlimit=20&sroffset=' + offsetVal +
        '&format=json&origin=*';

    return fetch(url)
        .then(function(resp) { return resp.json(); })
        .then(function(data) {
            var results = data.query.search;
            var images = [];
            for (var i = 0; i < results.length; i++) {
                var title = results[i].title;
                var filename = title.replace('File:', '').replace('file:', '');
                var thumbUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/' +
                    encodeURIComponent(filename) + '?width=400';
                var fullUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/' +
                    encodeURIComponent(filename);
                images.push({ thumb: thumbUrl, full: fullUrl, title: filename });
            }
            return {
                images: images,
                total: data.query.searchinfo ? data.query.searchinfo.totalhits : 0
            };
        })
        .catch(function() {
            return { images: [], total: 0 };
        });
}

function fetchPeerTubeVideos(query) {
    var url = 'https://framatube.org/api/v1/videos/search?search=' +
        encodeURIComponent(query) + '&count=4';
    return fetch(url)
        .then(function(resp) { return resp.json(); })
        .then(function(data) {
            var videos = [];
            if (data.data && Array.isArray(data.data)) {
                for (var i = 0; i < data.data.length; i++) {
                    var v = data.data[i];
                    videos.push({
                        title: v.name || 'Untitled',
                        embedUrl: v.embedUrl || '',
                        type: 'peertube'
                    });
                }
            }
            return videos;
        })
        .catch(function() {
            return [];
        });
}

function fetchDailymotionVideos(query) {
    var url = 'https://api.dailymotion.com/videos?search=' +
        encodeURIComponent(query) + '&fields=title,embed_url,thumbnail_url&limit=4';
    return fetch(url)
        .then(function(resp) { return resp.json(); })
        .then(function(data) {
            var videos = [];
            if (data.list && Array.isArray(data.list)) {
                for (var i = 0; i < data.list.length; i++) {
                    var v = data.list[i];
                    if (v.embed_url) {
                        videos.push({
                            title: v.title || 'Untitled',
                            embedUrl: v.embed_url,
                            type: 'dailymotion'
                        });
                    }
                }
            }
            return videos;
        })
        .catch(function() {
            return [];
        });
}

function fetchDictionaryData(query) {
    var word = query.trim().split(/\s+/)[0]; // First word only
    var url = 'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word);
    return fetch(url)
        .then(function(resp) {
            if (!resp.ok) return null;
            return resp.json();
        })
        .then(function(data) {
            if (!data || !Array.isArray(data) || data.length === 0) return null;
            var entry = data[0];
            var phonetics = '';
            if (entry.phonetics) {
                for (var i = 0; i < entry.phonetics.length; i++) {
                    if (entry.phonetics[i].text) {
                        phonetics = entry.phonetics[i].text;
                        break;
                    }
                }
            }
            var definitions = [];
            if (entry.meanings) {
                var defNum = 1;
                for (var m = 0; m < entry.meanings.length; m++) {
                    var meaning = entry.meanings[m];
                    if (meaning.definitions) {
                        for (var d = 0; d < meaning.definitions.length; d++) {
                            definitions.push({
                                num: defNum++,
                                definition: meaning.definitions[d].definition,
                                partOfSpeech: meaning.partOfSpeech
                            });
                        }
                    }
                }
            }
            return {
                word: entry.word,
                phonetics: phonetics,
                definitions: definitions
            };
        })
        .catch(function() {
            return null;
        });
}

// ========== Dashboard Rendering ==========

function renderWikiWidget(data) {
    var widget = Nova.dom.wikiWidget;
    if (!data) {
        widget.innerHTML = '<div class="widget-title">Wikipedia</div><div class="widget-empty">No Wikipedia article found.</div>';
        return;
    }
    Nova.state.wikiData = data;
    Nova.state.wikiExtract = data.extract;
    var html = '<div class="widget-title">Wikipedia</div>';
    var hasImg = data.thumbnail ? '' : ' wiki-no-img';
    html += '<div class="wiki-body' + hasImg + '">';
    if (data.thumbnail) {
        html += '<img class="wiki-thumb" src="' + data.thumbnail + '" alt="' + data.title + '">';
    }
    html += '<div class="wiki-text-wrap">';
    html += '<div class="wiki-page-title">' + escapeHtml(data.title) + '</div>';
    html += '<div class="wiki-extract">' + escapeHtml(data.extract) + '</div>';
    html += '<a class="wiki-link" href="https://en.wikipedia.org/?curid=' + data.pageId + '" target="_blank" rel="noopener">Read full article →</a>';
    html += '</div></div>';
    widget.innerHTML = html;
}

function renderMediaWidget(images, append) {
    var widget = Nova.dom.mediaWidget;
    var grid = widget.querySelector('.media-grid');
    if (!append) {
        widget.innerHTML = '<div class="widget-title">Media</div><div class="media-grid"></div>';
        grid = widget.querySelector('.media-grid');
        Nova.state.mediaImages = [];
    }

    if (!grid) return;

    for (var i = 0; i < images.length; i++) {
        var img = document.createElement('img');
        img.className = 'media-img';
        img.src = images[i].thumb;
        img.alt = images[i].title;
        img.loading = 'lazy';
        img.dataset.full = images[i].full;
        img.dataset.index = String(Nova.state.mediaImages.length);
        Nova.state.mediaImages.push(images[i].full);

        (function(fullUrl, idx) {
            img.addEventListener('click', function() {
                openLightbox(Nova.state.mediaImages, idx);
            });
        })(images[i].full, Nova.state.mediaImages.length - 1);

        grid.appendChild(img);
    }

    // Add loading indicator at bottom
    if (widget.querySelector('.media-loading')) {
        widget.querySelector('.media-loading').remove();
    }
    if (Nova.state.mediaImages.length < (Nova.state.mediaTotal || Infinity)) {
        var loading = document.createElement('div');
        loading.className = 'media-loading';
        loading.textContent = 'Loading more...';
        widget.appendChild(loading);
    }
}

function renderVideoWidget(videos) {
    var widget = Nova.dom.videoWidget;
    var html = '<div class="widget-title">Videos</div>';
    if (!videos || videos.length === 0) {
        html += '<div class="widget-empty">No videos found.</div>';
        widget.innerHTML = html;
        return;
    }
    html += '<div class="video-grid">';
    for (var i = 0; i < videos.length; i++) {
        html += '<div class="video-card">';
        html += '<iframe src="' + escapeAttr(videos[i].embedUrl) + '" allowfullscreen loading="lazy" title="' + escapeAttr(videos[i].title) + '"></iframe>';
        html += '<div class="video-title">' + escapeHtml(videos[i].title) + '</div>';
        html += '</div>';
    }
    html += '</div>';
    widget.innerHTML = html;
}

function renderDictWidget(data) {
    var widget = Nova.dom.dictWidget;
    var html = '<div class="widget-title">Dictionary</div>';
    if (!data) {
        html += '<div class="dict-error">No definition found for this term.</div>';
        widget.innerHTML = html;
        return;
    }
    html += '<div class="dict-word">' + escapeHtml(data.word) + '</div>';
    if (data.phonetics) {
        html += '<div class="dict-phonetic">' + escapeHtml(data.phonetics) + '</div>';
    }
    for (var i = 0; i < data.definitions.length; i++) {
        var def = data.definitions[i];
        html += '<div class="dict-def">';
        html += '<span class="dict-def-num">' + def.num + '.</span> ';
        html += '<em style="color:var(--primary);font-size:12px;margin-right:6px;">(' + escapeHtml(def.partOfSpeech) + ')</em> ';
        html += escapeHtml(def.definition);
        html += '</div>';
    }
    widget.innerHTML = html;
}

function renderTimelineWidget(extract) {
    var widget = Nova.dom.timelineWidget;
    var html = '<div class="widget-title">Timeline</div>';
    if (!extract) {
        html += '<div class="timeline-empty">No timeline data available.</div>';
        widget.innerHTML = html;
        return;
    }

    // Extract years and their sentences
    var yearRegex = /\b(1[0-9]{3}|20[0-9]{2})\b/g;
    var matches = [];
    var match;
    while ((match = yearRegex.exec(extract)) !== null) {
        var year = parseInt(match[1], 10);
        // Find the sentence containing this year
        var sentenceStart = extract.lastIndexOf('.', match.index) + 1;
        var sentenceEnd = extract.indexOf('.', match.index);
        if (sentenceEnd === -1) sentenceEnd = extract.length;
        else sentenceEnd += 1;
        var sentence = extract.substring(sentenceStart, sentenceEnd).trim();
        if (sentence.length > 10) {
            matches.push({ year: year, sentence: sentence });
        }
    }

    // Remove duplicates by year
    var seen = {};
    var unique = [];
    for (var i = 0; i < matches.length; i++) {
        if (!seen[matches[i].year]) {
            seen[matches[i].year] = true;
            unique.push(matches[i]);
        }
    }

    // Sort by year
    unique.sort(function(a, b) { return a.year - b.year; });

    if (unique.length === 0) {
        html += '<div class="timeline-empty">No timeline data found in this article.</div>';
        widget.innerHTML = html;
        return;
    }

    html += '<div class="timeline-list">';
    html += '<div class="timeline-line"></div>';
    for (var j = 0; j < unique.length; j++) {
        html += '<div class="timeline-item">';
        html += '<div class="timeline-dot"></div>';
        html += '<span class="timeline-year">' + unique[j].year + '</span>';
        html += escapeHtml(unique[j].sentence);
        html += '</div>';
    }
    html += '</div>';
    widget.innerHTML = html;
}

// ========== Infinite Scroll for Media ==========
function setupMediaInfiniteScroll() {
    Nova.dom.mediaWidget.addEventListener('scroll', function() {
        var st = Nova.state;
        if (st.mediaLoading) return;
        if (st.mediaImages.length >= (st.mediaTotal || Infinity)) return;
        var el = Nova.dom.mediaWidget;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
            st.mediaLoading = true;
            st.mediaOffset += 20;
            fetchMediaData(st.mediaQuery, st.mediaOffset).then(function(result) {
                renderMediaWidget(result.images, true);
                st.mediaLoading = false;
            });
        }
    });
}

// ========== Main Search Handler ==========
function handleSearch(query) {
    var q = query.trim();
    if (!q) return;

    // Stop any easter egg effects
    stopMatrix();
    closeEasterEgg();
    closeLightbox();

    // Close autocomplete
    closeAutocomplete();

    Nova.state.currentQuery = q;

    // 1. Easter eggs
    if (checkEasterEggs(q)) return;

    // 2. URL detection
    if (isUrl(q)) {
        openWebsite(q);
        return;
    }

    // 3. Math expression
    if (isMathExpression(q)) {
        if (window.Nova && Nova.Calculator) {
            Nova.Calculator.handle(q);
        }
        return;
    }

    // 4. Map query
    if (isMapQuery(q)) {
        if (window.Nova && Nova.Map) {
            Nova.Map.handle(q);
        }
        return;
    }

    // 5. Dashboard
    showDashboard(q);
}

function showDashboard(query) {
    showScreen('dashboard');
    Nova.dom.dashTitle.textContent = query;
    showLoading();

    // Reset media state
    Nova.state.mediaImages = [];
    Nova.state.mediaOffset = 0;
    Nova.state.mediaQuery = query;
    Nova.state.mediaLoading = false;
    Nova.state.mediaTotal = 0;

    // Clear widgets
    Nova.dom.wikiWidget.innerHTML = '<div class="widget-title">Wikipedia</div><div class="widget-empty">Loading...</div>';
    Nova.dom.mediaWidget.innerHTML = '<div class="widget-title">Media</div><div class="widget-empty">Loading...</div>';
    Nova.dom.videoWidget.innerHTML = '<div class="widget-title">Videos</div><div class="widget-empty">Loading...</div>';
    Nova.dom.dictWidget.innerHTML = '<div class="widget-title">Dictionary</div><div class="widget-empty">Loading...</div>';
    Nova.dom.timelineWidget.innerHTML = '<div class="widget-title">Timeline</div><div class="widget-empty">Loading...</div>';

    // Fetch all data in parallel
    var wikiPromise = fetchWikiData(query).then(function(data) {
        renderWikiWidget(data);
        // Timeline depends on wiki extract
        renderTimelineWidget(data ? data.extract : '');
        return data;
    });

    var mediaPromise = fetchMediaData(query, 0).then(function(result) {
        Nova.state.mediaTotal = result.total;
        renderMediaWidget(result.images, false);
        return result;
    });

    // Videos from both sources
    var videoPromise = Promise.allSettled([
        fetchPeerTubeVideos(query),
        fetchDailymotionVideos(query)
    ]).then(function(results) {
        var allVideos = [];
        for (var i = 0; i < results.length; i++) {
            if (results[i].status === 'fulfilled') {
                allVideos = allVideos.concat(results[i].value);
            }
        }
        renderVideoWidget(allVideos);
    });

    var dictPromise = fetchDictionaryData(query).then(function(data) {
        renderDictWidget(data);
    });

    // Hide loading when all done
    Promise.allSettled([wikiPromise, mediaPromise, videoPromise, dictPromise])
        .then(function() {
            hideLoading();
        });
}

// ========== HTML Escape Helpers ==========
function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ========== Placeholder function for any cleanup ==========
function stopSnow() {
    // Placeholder as required by spec
}

// ========== Event Listeners ==========
(function init() {
    var dom = Nova.dom;

    // Search button click
    dom.searchBtn.addEventListener('click', function() {
        handleSearch(dom.urlInput.value);
    });

    // Enter key in search input
    dom.urlInput.addEventListener('keydown', function(e) {
        var items = dom.autocompleteDropdown.querySelectorAll('.ac-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (items.length > 0) {
                acIndex = Math.min(acIndex + 1, items.length - 1);
                updateAcHighlight(items);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (items.length > 0) {
                acIndex = Math.max(acIndex - 1, -1);
                updateAcHighlight(items);
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (acIndex >= 0 && items.length > 0 && items[acIndex]) {
                dom.urlInput.value = items[acIndex].dataset.value;
                closeAutocomplete();
            }
            handleSearch(dom.urlInput.value);
        } else if (e.key === 'Escape') {
            closeAutocomplete();
        }
    });

    // Autocomplete with debounce
    dom.urlInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
            fetchAutocomplete(dom.urlInput.value.trim());
        }, 250);
    });

    // Autocomplete click
    dom.autocompleteDropdown.addEventListener('click', function(e) {
        var item = e.target.closest('.ac-item');
        if (item) {
            dom.urlInput.value = item.dataset.value;
            closeAutocomplete();
            handleSearch(dom.urlInput.value);
        }
    });

    // Close autocomplete on outside click
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#searchContainer')) {
            closeAutocomplete();
        }
    });

    // Back button
    dom.backBtn.addEventListener('click', function() {
        stopMatrix();
        closeEasterEgg();
        showScreen('search');
        dom.urlInput.value = '';
        dom.urlInput.focus();
    });

    // Map back button
    dom.mapBackBtn.addEventListener('click', function() {
        if (window.Nova && Nova.Map && Nova.Map.destroy) {
            Nova.Map.destroy();
        }
        showScreen('search');
        dom.urlInput.value = '';
        dom.urlInput.focus();
    });

    // Lightbox controls
    dom.lightboxClose.addEventListener('click', closeLightbox);
    dom.lightboxPrev.addEventListener('click', function() { navigateLightbox(-1); });
    dom.lightboxNext.addEventListener('click', function() { navigateLightbox(1); });

    dom.lightbox.addEventListener('click', function(e) {
        if (e.target === dom.lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function(e) {
        if (dom.lightbox.classList.contains('hidden')) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); navigateLightbox(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); navigateLightbox(1); }
        if (e.key === 'Escape') closeLightbox();
    });

    // Easter egg dismiss
    dom.easterEggImg.addEventListener('click', closeEasterEgg);

    // Matrix dismiss on click (canvas has pointer-events: none, so listen on body)
    document.addEventListener('click', function(e) {
        if (Nova.state.matrixActive && e.target !== dom.urlInput && e.target !== dom.searchBtn && !e.target.closest('#appDock') && !e.target.closest('.fw-window')) {
            stopMatrix();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && Nova.state.matrixActive) {
            stopMatrix();
        }
    });

    // Setup infinite scroll for media
    setupMediaInfiniteScroll();

    // Focus input on load
    dom.urlInput.focus();
})();
