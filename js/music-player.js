/**
 * 全站音乐播放器
 * 用法：在任意页面引入 <script src="…/js/music-player.js"></script>
 * 播放状态通过 sessionStorage 在子页面间延续（换页会有短暂衔接）
 */
(function () {
    if (window.__CfeatMusicPlayer) return;
    window.__CfeatMusicPlayer = true;

    var STORAGE_KEY = 'cfeat-music-player-v2';
    var scriptEl = document.currentScript;

    var siteRoot = (function () {
        try {
            if (scriptEl && scriptEl.src) {
                // …/js/music-player.js → 站点根目录
                return new URL('../', scriptEl.src).href;
            }
        } catch (e) { /* ignore */ }
        try {
            return new URL('./', window.location.href).href;
        } catch (e2) {
            return window.location.origin + '/';
        }
    })();

    function absUrl(rel) {
        if (!rel) return '';
        try {
            return new URL(rel, siteRoot).href;
        } catch (e) {
            return rel;
        }
    }

    var STYLE = [
        '.cfeat-music-player{',
        'position:fixed;bottom:20px;right:20px;z-index:9999;',
        'background:rgba(255,255,255,.92);backdrop-filter:blur(8px);',
        'border:1px dashed #c4a574;border-radius:10px;',
        'box-shadow:0 4px 15px rgba(0,0,0,.1);',
        'padding:.75rem .9rem;width:300px;max-width:calc(100vw - 40px);',
        'font-family:"Iowan Old Style","Palatino Linotype","Book Antiqua","Songti SC","SimSun",serif;',
        'color:#2c2416;transition:box-shadow .25s ease;',
        '}',
        '.cfeat-music-player:hover{box-shadow:0 8px 25px rgba(0,0,0,.15);}',
        '.cfeat-music-player.is-collapsed{',
        'width:auto;padding:0;border-radius:999px;',
        '}',
        '.cfeat-music-player.is-collapsed .cfeat-music-body{display:none;}',
        '.cfeat-music-player.is-collapsed .cfeat-music-fab{display:flex;}',
        '.cfeat-music-fab{',
        'display:none;align-items:center;justify-content:center;',
        'width:48px;height:48px;border:none;background:transparent;',
        'font-size:1.35rem;cursor:pointer;line-height:1;color:#2c2416;',
        '}',
        '.cfeat-music-head{',
        'display:flex;align-items:center;justify-content:space-between;',
        'gap:.5rem;margin-bottom:.45rem;',
        '}',
        '.cfeat-music-head-label{',
        'font-size:.72rem;letter-spacing:.12em;color:#8a7a62;text-transform:uppercase;',
        '}',
        '.cfeat-music-collapse{',
        'border:none;background:none;cursor:pointer;font-size:.95rem;',
        'color:#8a7a62;padding:.1rem .25rem;line-height:1;',
        '}',
        '.cfeat-music-collapse:hover{color:#2c2416;}',
        '.cfeat-music-controls{',
        'display:flex;align-items:center;justify-content:center;gap:1rem;margin-bottom:.45rem;',
        '}',
        '.cfeat-music-btn{',
        'background:none;border:none;cursor:pointer;font-size:1.45rem;',
        'color:#2c2416;transition:color .2s,transform .1s;padding:.15rem;line-height:1;',
        '}',
        '.cfeat-music-btn:hover{color:#b08d57;transform:scale(1.08);}',
        '.cfeat-music-btn:active{transform:scale(.92);}',
        '.cfeat-music-title{',
        'font-size:.92rem;font-weight:600;white-space:nowrap;overflow:hidden;',
        'text-overflow:ellipsis;letter-spacing:.04em;margin-bottom:.35rem;text-align:center;',
        '}',
        '.cfeat-music-progress,.cfeat-music-volume-slider{',
        '-webkit-appearance:none;appearance:none;height:5px;',
        'background:#e6dcc8;border-radius:3px;outline:none;cursor:pointer;',
        '}',
        '.cfeat-music-progress{width:100%;}',
        '.cfeat-music-volume-slider{flex:1;min-width:0;}',
        '.cfeat-music-progress::-webkit-slider-thumb,.cfeat-music-volume-slider::-webkit-slider-thumb{',
        '-webkit-appearance:none;appearance:none;width:13px;height:13px;border-radius:50%;',
        'background:#b08d57;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.2);cursor:pointer;',
        '}',
        '.cfeat-music-progress::-moz-range-thumb,.cfeat-music-volume-slider::-moz-range-thumb{',
        'width:13px;height:13px;border-radius:50%;background:#b08d57;',
        'border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.2);cursor:pointer;',
        '}',
        '.cfeat-music-time{',
        'display:flex;justify-content:space-between;font-size:.7rem;color:#8a7a62;',
        'font-family:"Courier New",monospace;margin-top:.15rem;',
        '}',
        '.cfeat-music-volume{',
        'display:flex;align-items:center;gap:.45rem;margin-top:.55rem;',
        '}',
        '.cfeat-music-vol-icon{font-size:1.1rem;cursor:pointer;user-select:none;flex-shrink:0;}',
        '.cfeat-music-vol-pct{',
        'font-size:.7rem;color:#8a7a62;font-family:"Courier New",monospace;',
        'min-width:36px;text-align:right;',
        '}',
        '.cfeat-music-modes{',
        'display:flex;justify-content:center;gap:.9rem;margin-top:.65rem;',
        'font-size:.78rem;color:#5c4f3a;flex-wrap:wrap;',
        '}',
        '.cfeat-music-modes label{',
        'display:inline-flex;align-items:center;gap:.28rem;cursor:pointer;user-select:none;',
        '}',
        '.cfeat-music-modes input{accent-color:#b08d57;cursor:pointer;}',
        '@media (max-width:480px){',
        '.cfeat-music-player{bottom:10px;right:10px;left:10px;width:auto;}',
        '.cfeat-music-player.is-collapsed{left:auto;width:auto;}',
        '}'
    ].join('');

    function loadState() {
        try {
            var raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveState(state) {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) { /* ignore */ }
    }

    function formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '0:00';
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function mount() {
        var style = document.createElement('style');
        style.textContent = STYLE;
        document.head.appendChild(style);

        var root = document.createElement('div');
        root.className = 'cfeat-music-player';
        root.id = 'cfeatMusicPlayer';
        // audio 必须放在可收起区域之外，避免 display:none 导致浏览器不加载媒体
        root.innerHTML = [
            '<audio id="cfeatAudio" preload="metadata" playsinline></audio>',
            '<button type="button" class="cfeat-music-fab" id="cfeatMusicFab" title="展开播放器" aria-label="展开播放器">♪</button>',
            '<div class="cfeat-music-body">',
            '  <div class="cfeat-music-head">',
            '    <span class="cfeat-music-head-label">Now Playing</span>',
            '    <button type="button" class="cfeat-music-collapse" id="cfeatMusicCollapse" title="收起">▾</button>',
            '  </div>',
            '  <div class="cfeat-music-controls">',
            '    <button type="button" class="cfeat-music-btn" id="cfeatPrev" title="上一首">⏮</button>',
            '    <button type="button" class="cfeat-music-btn" id="cfeatPlay" title="播放/暂停">▶</button>',
            '    <button type="button" class="cfeat-music-btn" id="cfeatNext" title="下一首">⏭</button>',
            '  </div>',
            '  <div class="cfeat-music-title" id="cfeatTitle">加载中...</div>',
            '  <input type="range" class="cfeat-music-progress" id="cfeatProgress" min="0" max="100" value="0" step="0.1">',
            '  <div class="cfeat-music-time"><span id="cfeatCurrent">0:00</span><span id="cfeatDuration">0:00</span></div>',
            '  <div class="cfeat-music-volume">',
            '    <span class="cfeat-music-vol-icon" id="cfeatVolIcon" title="静音/恢复">🔊</span>',
            '    <input type="range" class="cfeat-music-volume-slider" id="cfeatVolume" min="0" max="1" step="0.01" value="1">',
            '    <span class="cfeat-music-vol-pct" id="cfeatVolPct">100%</span>',
            '  </div>',
            '  <div class="cfeat-music-modes">',
            '    <label><input type="checkbox" id="cfeatModeSequence" checked> 自动连播</label>',
            '    <label><input type="checkbox" id="cfeatModeLoop"> 单曲循环</label>',
            '  </div>',
            '</div>'
        ].join('');
        document.body.appendChild(root);

        var audio = root.querySelector('#cfeatAudio');
        var playBtn = root.querySelector('#cfeatPlay');
        var prevBtn = root.querySelector('#cfeatPrev');
        var nextBtn = root.querySelector('#cfeatNext');
        var progress = root.querySelector('#cfeatProgress');
        var currentEl = root.querySelector('#cfeatCurrent');
        var durationEl = root.querySelector('#cfeatDuration');
        var titleEl = root.querySelector('#cfeatTitle');
        var volumeSlider = root.querySelector('#cfeatVolume');
        var volIcon = root.querySelector('#cfeatVolIcon');
        var volPct = root.querySelector('#cfeatVolPct');
        var modeSequence = root.querySelector('#cfeatModeSequence');
        var modeLoop = root.querySelector('#cfeatModeLoop');
        var collapseBtn = root.querySelector('#cfeatMusicCollapse');
        var fabBtn = root.querySelector('#cfeatMusicFab');

        var playlist = [];
        var currentIndex = 0;
        var isPlaying = false;
        var lastVolume = 1;
        var playToken = 0;
        var playMode = 'sequence';
        var collapsed = false;
        var saveTimer = null;
        var pendingSeek = null;
        var suppressPauseUI = false;
        var lastTitle = '暂无歌曲';

        function persist() {
            saveState({
                index: currentIndex,
                time: audio.currentTime || 0,
                playing: isPlaying && !audio.paused,
                volume: audio.volume,
                lastVolume: lastVolume,
                mode: playMode,
                collapsed: collapsed
            });
        }

        function schedulePersist() {
            if (saveTimer) return;
            saveTimer = setTimeout(function () {
                saveTimer = null;
                persist();
            }, 400);
        }

        function syncPlayButton() {
            var playing = !audio.paused && !audio.ended;
            isPlaying = playing;
            playBtn.textContent = playing ? '⏸' : '▶';
            if (collapsed) fabBtn.textContent = playing ? '⏸' : '♪';
        }

        function setCollapsed(next) {
            collapsed = !!next;
            root.classList.toggle('is-collapsed', collapsed);
            syncPlayButton();
            persist();
        }

        function setPlayMode(mode) {
            if (mode === 'sequence') playMode = 'sequence';
            else if (mode === 'loop') playMode = 'loop';
            else playMode = 'none';
            modeSequence.checked = playMode === 'sequence';
            modeLoop.checked = playMode === 'loop';
            persist();
        }

        function trackTitle(track) {
            if (!track) return '暂无歌曲';
            return track.title || '未知歌曲';
        }

        function trackSrc(track) {
            return track ? absUrl(track.src) : '';
        }

        function updateDurationUI() {
            if (isFinite(audio.duration) && audio.duration > 0) {
                durationEl.textContent = formatTime(audio.duration);
            }
        }

        function applyPendingSeek() {
            if (pendingSeek == null) return;
            if (!isFinite(audio.duration) || audio.duration <= 0) return;
            var t = Math.min(Math.max(pendingSeek, 0), Math.max(audio.duration - 0.25, 0));
            try {
                audio.currentTime = t;
            } catch (e) { /* ignore */ }
            pendingSeek = null;
            currentEl.textContent = formatTime(audio.currentTime || t);
            if (audio.duration) {
                progress.value = (audio.currentTime / audio.duration) * 100;
            }
        }

        function playCurrent() {
            var token = ++playToken;
            suppressPauseUI = false;
            var p = audio.play();
            if (p && typeof p.then === 'function') {
                p.then(function () {
                    if (token !== playToken) return;
                    syncPlayButton();
                    titleEl.textContent = lastTitle;
                    persist();
                }).catch(function (err) {
                    if (token !== playToken) return;
                    syncPlayButton();
                    console.error('Audio play failed:', err, audio.currentSrc);
                    if (err && err.name !== 'AbortError') {
                        titleEl.textContent = '播放失败，请再点一次';
                    }
                    persist();
                });
            } else {
                syncPlayButton();
            }
        }

        function loadSong(index, autoPlay, seekTime) {
            if (!playlist.length) return;
            currentIndex = (index + playlist.length) % playlist.length;
            var track = playlist[currentIndex];
            var src = trackSrc(track);
            if (!src) {
                titleEl.textContent = '无效曲目';
                return;
            }

            playToken += 1;
            suppressPauseUI = true;
            lastTitle = trackTitle(track);
            titleEl.textContent = lastTitle;
            pendingSeek = typeof seekTime === 'number' && isFinite(seekTime) && seekTime > 0
                ? seekTime
                : null;

            progress.value = 0;
            currentEl.textContent = '0:00';
            durationEl.textContent = '0:00';

            audio.src = src;
            audio.load();

            if (autoPlay) {
                playCurrent();
            } else {
                suppressPauseUI = false;
                audio.pause();
                syncPlayButton();
            }
            persist();
        }

        function togglePlay() {
            if (!playlist.length) return;
            if (audio.paused || audio.ended) {
                if (!audio.currentSrc && playlist.length) {
                    loadSong(currentIndex, true, audio.currentTime || pendingSeek);
                    return;
                }
                playCurrent();
            } else {
                playToken += 1;
                suppressPauseUI = false;
                audio.pause();
                syncPlayButton();
                persist();
            }
        }

        function prevSong() {
            if (!playlist.length) return;
            loadSong(currentIndex - 1, isPlaying || !audio.paused);
        }

        function nextSong(forcePlay) {
            if (!playlist.length) return;
            var shouldPlay = forcePlay === true || isPlaying || !audio.paused;
            loadSong(currentIndex + 1, shouldPlay);
        }

        function onEnded() {
            if (playMode === 'loop') {
                audio.currentTime = 0;
                playCurrent();
                return;
            }
            if (playMode === 'sequence') {
                nextSong(true);
                return;
            }
            syncPlayButton();
            persist();
        }

        modeSequence.addEventListener('change', function () {
            if (modeSequence.checked) setPlayMode('sequence');
            else setPlayMode(modeLoop.checked ? 'loop' : 'none');
        });
        modeLoop.addEventListener('change', function () {
            if (modeLoop.checked) setPlayMode('loop');
            else setPlayMode(modeSequence.checked ? 'sequence' : 'none');
        });

        collapseBtn.addEventListener('click', function () { setCollapsed(true); });
        fabBtn.addEventListener('click', function () { setCollapsed(false); });
        playBtn.addEventListener('click', togglePlay);
        prevBtn.addEventListener('click', prevSong);
        nextBtn.addEventListener('click', function () { nextSong(false); });

        progress.addEventListener('input', function () {
            if (!isFinite(audio.duration) || audio.duration <= 0) return;
            var seekTime = (progress.value / 100) * audio.duration;
            audio.currentTime = seekTime;
            currentEl.textContent = formatTime(seekTime);
            schedulePersist();
        });

        volumeSlider.addEventListener('input', function () {
            var vol = parseFloat(volumeSlider.value);
            audio.volume = vol;
            volIcon.textContent = vol === 0 ? '🔇' : '🔊';
            if (vol > 0) lastVolume = vol;
            volPct.textContent = Math.round(vol * 100) + '%';
            persist();
        });

        volIcon.addEventListener('click', function () {
            if (audio.volume > 0) {
                lastVolume = audio.volume;
                audio.volume = 0;
                volumeSlider.value = 0;
                volPct.textContent = '0%';
                volIcon.textContent = '🔇';
            } else {
                audio.volume = lastVolume || 1;
                volumeSlider.value = audio.volume;
                volPct.textContent = Math.round(audio.volume * 100) + '%';
                volIcon.textContent = '🔊';
            }
            persist();
        });

        audio.addEventListener('timeupdate', function () {
            if (isFinite(audio.duration) && audio.duration > 0) {
                progress.value = (audio.currentTime / audio.duration) * 100;
                currentEl.textContent = formatTime(audio.currentTime);
                durationEl.textContent = formatTime(audio.duration);
            }
            schedulePersist();
        });

        audio.addEventListener('loadedmetadata', function () {
            updateDurationUI();
            applyPendingSeek();
        });
        audio.addEventListener('durationchange', updateDurationUI);
        audio.addEventListener('canplay', function () {
            updateDurationUI();
            applyPendingSeek();
        });

        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', function () {
            syncPlayButton();
            var code = audio.error ? audio.error.code : 0;
            titleEl.textContent = '音频加载失败 (' + code + ')';
            console.error('Audio error:', audio.error, 'src=', audio.currentSrc, 'root=', siteRoot);
            persist();
        });
        audio.addEventListener('play', function () {
            suppressPauseUI = false;
            syncPlayButton();
            titleEl.textContent = lastTitle;
            persist();
        });
        audio.addEventListener('pause', function () {
            if (suppressPauseUI || audio.ended) return;
            syncPlayButton();
            persist();
        });

        window.addEventListener('pagehide', persist);
        window.addEventListener('beforeunload', persist);

        var saved = loadState() || {};
        currentIndex = typeof saved.index === 'number' ? saved.index : 0;
        lastVolume = typeof saved.lastVolume === 'number' ? saved.lastVolume : 1;
        playMode = saved.mode === 'loop' || saved.mode === 'none' || saved.mode === 'sequence'
            ? saved.mode
            : 'sequence';
        collapsed = !!saved.collapsed;
        pendingSeek = typeof saved.time === 'number' && isFinite(saved.time) ? saved.time : null;
        // 换页自动续播常被浏览器拦截，这里只恢复进度，由用户点击播放
        var wantResume = !!saved.playing;

        setPlayMode(playMode);
        setCollapsed(collapsed);

        if (typeof saved.volume === 'number' && isFinite(saved.volume)) {
            audio.volume = Math.min(Math.max(saved.volume, 0), 1);
            volumeSlider.value = audio.volume;
            volPct.textContent = Math.round(audio.volume * 100) + '%';
            volIcon.textContent = audio.volume === 0 ? '🔇' : '🔊';
        }

        fetch(absUrl('music/playlist.json'), { cache: 'no-cache' })
            .then(function (res) {
                if (!res.ok) throw new Error('playlist fetch failed: ' + res.status);
                return res.json();
            })
            .then(function (data) {
                if (!Array.isArray(data)) {
                    playlist = [];
                } else {
                    playlist = data.map(function (item) {
                        if (typeof item === 'string') {
                            return {
                                title: item.replace(/\.[^/.]+$/, ''),
                                src: 'music/' + item
                            };
                        }
                        return {
                            title: item.title || '未知歌曲',
                            src: item.src || ''
                        };
                    }).filter(function (item) {
                        return !!item.src;
                    });
                }

                if (!playlist.length) {
                    titleEl.textContent = '暂无歌曲';
                    return;
                }
                if (currentIndex >= playlist.length) currentIndex = 0;
                loadSong(currentIndex, false, pendingSeek);
                // 若之前在播放，尝试续播（失败则保持暂停，进度已恢复）
                if (wantResume) {
                    playCurrent();
                }
            })
            .catch(function (err) {
                titleEl.textContent = '播放列表加载失败';
                console.error('Failed to load playlist:', err, absUrl('music/playlist.json'));
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
