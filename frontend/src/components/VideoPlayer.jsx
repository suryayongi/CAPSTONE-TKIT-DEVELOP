import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useId
} from 'react';
import { MaterialIcon } from '../utils/icons';
import { Button } from './Button';
import { formatSecondsToMMSS } from '../utils/formatters';

/**
 * 100% Custom Classroom & Studio Video Player
 * - Kontrol ramping: Timeline kuis menjadi fokus utama di bawah
 * - Navigasi kompak 1 baris untuk mode siswa maupun studio guru (Play/Pause, Replay 10s, Forward 10s, Volume, Fullscreen)
 * - Mode Studio Guru: Tombol aksi utama "+ Tandai Kuis" tidak auto-hide dan mendukung Slide-Over Drawer Kanan saat Fullscreen
 */
export const VideoPlayer = forwardRef(({
  videoId,
  duration = 180,
  cuePoints = [],
  completedCuePointIds = new Set(),
  activeCuePoint = null,
  editingCuePointId = null,
  isStudioMode = false,
  onCuePointTrigger,
  onSelectCuePoint,
  onCaptureTimestamp,
  onVideoEnded,
  onError,
  overlayChildren = null,
  studioDrawerContent = null,
  isStudioDrawerOpen = false,
  onToggleStudioDrawer = null,
  onFullscreenChange = null
}, ref) => {
  const reactId = useId();
  const mountIdRef = useRef(`yt-player-mount-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`);
  const playerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const containerRef = useRef(null);
  const mountWrapperRef = useRef(null);
  const hideControlsTimerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [hasError, setHasError] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(true);

  // Auto-hide controls timer di mode Fullscreen (Hanya untuk Mode Siswa; Mode Studio selalu tampil agar tombol aksi utama tidak pernah hilang)
  const resetControlsTimeout = useCallback(() => {
    setAreControlsVisible(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying && isFullscreen && !isStudioMode) {
      hideControlsTimerRef.current = setTimeout(() => {
        setAreControlsVisible(false);
      }, 3000);
    }
  }, [isPlaying, isFullscreen, isStudioMode]);

  // Pantau perubahan status Fullscreen browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsActive = Boolean(document.fullscreenElement);
      setIsFullscreen(fsActive);
      setAreControlsVisible(true);
      if (onFullscreenChange) {
        onFullscreenChange(fsActive);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onFullscreenChange]);

  // Update visibilitas kontrol saat pause / play
  useEffect(() => {
    if (!isPlaying || isStudioMode) {
      setAreControlsVisible(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    } else if (isFullscreen) {
      resetControlsTimeout();
    }
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [isPlaying, isFullscreen, isStudioMode, resetControlsTimeout]);

  // Expose player instance to parent
  useImperativeHandle(ref, () => ({
    getCurrentTime: () => (playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : currentTime),
    seekTo: (sec) => {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(sec, true);
        setCurrentTime(sec);
      }
    },
    pauseVideo: () => {
      if (playerRef.current?.pauseVideo) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      }
    },
    playVideo: () => {
      if (playerRef.current?.playVideo) {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    }
  }));

  // Inisialisasi YouTube Player
  useEffect(() => {
    let isMounted = true;
    setIsPlayerReady(false);

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 200);
        return;
      }

      if (mountWrapperRef.current) {
        mountWrapperRef.current.innerHTML = `<div id="${mountIdRef.current}" class="w-full h-full"></div>`;
      }

      try {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }

        playerRef.current = new window.YT.Player(mountIdRef.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              setIsPlayerReady(true);
              const dur = event.target.getDuration();
              if (dur && dur > 0) {
                setTotalDuration(Math.floor(dur));
              }
              setIsMuted(Boolean(event.target.isMuted && event.target.isMuted()));
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                if (onVideoEnded) onVideoEnded();
              }
            },
            onError: () => {
              if (!isMounted) return;
              setHasError(true);
              if (onError) onError();
            }
          }
        });
      } catch (e) {
        console.error('[VideoPlayer] Error init YT Player:', e);
      }
    };

    initPlayer();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {}
      }
      playerRef.current = null;
    };
  }, [videoId]);

  // Polling deteksi cue point dan update slider
  useEffect(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      try {
        const state = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
        const cur = playerRef.current.getCurrentTime() || 0;
        setCurrentTime(cur);

        // Trigger kuis otomatis saat waktu video menyentuh titik kuis (Hanya di Mode Siswa)
        if (!isStudioMode && state === 1 && !activeCuePoint && Array.isArray(cuePoints)) {
          for (const cp of cuePoints) {
            if (!completedCuePointIds.has(cp.id)) {
              if (cur >= cp.detik_muncul && cur <= cp.detik_muncul + 2.0) {
                if (playerRef.current.pauseVideo) {
                  playerRef.current.pauseVideo();
                }
                setIsPlaying(false);
                if (onCuePointTrigger) {
                  onCuePointTrigger(cp);
                }
                break;
              }
            }
          }
        }
      } catch {}
    }, 250);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeCuePoint, cuePoints, completedCuePointIds, isStudioMode, onCuePointTrigger]);

  const togglePlayPause = useCallback(() => {
    if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') return;
    try {
      const state = playerRef.current.getPlayerState();
      if (state === 1) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch {}
  }, []);

  const stepSeconds = useCallback((offset) => {
    if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
    try {
      const cur = playerRef.current.getCurrentTime() || 0;
      const target = Math.max(0, Math.min(totalDuration, cur + offset));
      playerRef.current.seekTo(target, true);
      setCurrentTime(target);
    } catch {}
  }, [totalDuration]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    try {
      if (playerRef.current.isMuted()) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch {}
  }, []);

  const handleTimelineClick = useCallback(
    (e) => {
      if (!playerRef.current || typeof playerRef.current.seekTo !== 'function') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.min(1, Math.max(0, clickX / rect.width));
      const targetTime = ratio * totalDuration;
      try {
        playerRef.current.seekTo(targetTime, true);
        setCurrentTime(targetTime);
      } catch {}
    },
    [totalDuration]
  );

  const handleMarkerClick = useCallback(
    (e, cp) => {
      e.stopPropagation();
      if (!playerRef.current || typeof playerRef.current.seekTo !== 'function') return;
      try {
        playerRef.current.seekTo(cp.detik_muncul, true);
        playerRef.current.pauseVideo();
        setCurrentTime(cp.detik_muncul);
        setIsPlaying(false);
        if (onSelectCuePoint) {
          onSelectCuePoint(cp);
        } else if (onCuePointTrigger) {
          onCuePointTrigger(cp);
        }
        // Di mode Fullscreen Studio, klik titik kuis otomatis membuka drawer samping kanan
        if (isFullscreen && isStudioMode && onToggleStudioDrawer) {
          onToggleStudioDrawer(true);
        }
      } catch {}
    },
    [onSelectCuePoint, onCuePointTrigger, isFullscreen, isStudioMode, onToggleStudioDrawer]
  );

  const handleCaptureClick = useCallback(() => {
    if (playerRef.current?.pauseVideo) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
    if (onCaptureTimestamp) {
      onCaptureTimestamp(Math.floor(currentTime));
    }
    if (isFullscreen && isStudioMode && onToggleStudioDrawer) {
      onToggleStudioDrawer(true);
    }
  }, [currentTime, isFullscreen, isStudioMode, onCaptureTimestamp, onToggleStudioDrawer]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  const progressPercent = Math.min(100, Math.max(0, (currentTime / (totalDuration || 1)) * 100));
  const showControls = isStudioMode ? true : areControlsVisible;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      className={`relative overflow-hidden bg-black select-none ${
        isFullscreen
          ? 'fixed inset-0 w-screen h-screen z-50 !rounded-none !border-0'
          : 'duo-card flex flex-col border-2 border-[#E5E5E5] isolate z-10'
      }`}
    >
      {/* Area Layar Video Player */}
      <div
        className={`relative w-full bg-black flex items-center justify-center overflow-hidden group ${
          isFullscreen ? 'w-full h-full' : 'aspect-video'
        }`}
      >
        <div ref={mountWrapperRef} className="w-full h-full pointer-events-none" />

        {/* Klik layar video untuk Play/Pause */}
        <div
          onClick={togglePlayPause}
          className="absolute inset-0 cursor-pointer z-10"
          title={isPlaying ? 'Klik untuk jeda video' : 'Klik untuk putar video'}
        />

        {/* Big Play Overlay Button saat video dijeda / belum diputar */}
        {!isPlaying && isPlayerReady && !overlayChildren && !activeCuePoint && (
          <div
            onClick={togglePlayPause}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity cursor-pointer"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FFC800] border-4 border-white shadow-xl flex items-center justify-center text-[#1E293B] transition-transform hover:scale-105 active:scale-95">
              <MaterialIcon name="play_arrow" className="text-4xl sm:text-5xl translate-x-0.5" />
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 bg-slate-900/90 text-white p-6 flex flex-col items-center justify-center text-center z-40">
            <MaterialIcon name="error" className="text-5xl text-rose-500 mb-2" />
            <h4 className="font-duo-display text-xl font-bold">Video Tidak Dapat Dimuat</h4>
            <p className="text-sm text-slate-300 max-w-md mt-1">
              Periksa koneksi internet Anda atau pastikan tautan video YouTube sudah tepat.
            </p>
          </div>
        )}

        {/* Overlay Kuis & Pratinjau dirender di atas area video */}
        {overlayChildren}
      </div>

      {/* Control Bar: Floating YouTube-Style Vignette saat Fullscreen / Clean Card Bar saat Standar */}
      <div
        className={`z-30 transition-all duration-300 ${
          isFullscreen
            ? `absolute bottom-0 inset-x-0 px-4 sm:px-8 pb-3 sm:pb-5 pt-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white ${
                showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
              }`
            : 'p-3 sm:p-4 bg-white border-t-2 border-[#E5E5E5] text-[#1E293B]'
        }`}
      >
        {/* Timeline Track with Numbered Cue Point Markers */}
        {isFullscreen ? (
          <div
            className="relative mb-2.5 pt-2 group/timeline cursor-pointer"
            onClick={handleTimelineClick}
            title="Klik untuk melompat ke waktu video"
          >
            {/* Clickable hit area (taller target for easy touch/mouse scrubbing) */}
            <div className="relative flex items-center h-5">
              {/* Background Rail */}
              <div className="w-full h-1 group-hover/timeline:h-1.5 bg-white/25 backdrop-blur-xs rounded-full overflow-hidden transition-all duration-150">
                {/* Progress Fill */}
                <div
                  className="h-full bg-[#FFC800] rounded-full transition-all duration-75"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Scrubber Thumb (YouTube Style) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#FFC800] rounded-full border-2 border-white shadow-md scale-0 group-hover/timeline:scale-100 transition-transform pointer-events-none"
                style={{ left: `${progressPercent}%` }}
              />

              {/* Cue Point Stamps (Kuis Stamps) */}
              {cuePoints.map((cp, idx) => {
                const markerPct = Math.min(100, Math.max(0, (cp.detik_muncul / (totalDuration || 1)) * 100));
                const isAnswered = completedCuePointIds.has(cp.id);
                const isEditing = editingCuePointId === cp.id;

                return (
                  <div
                    key={cp.id}
                    style={{ left: `${markerPct}%` }}
                    onClick={(e) => handleMarkerClick(e, cp)}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group/stamp cursor-pointer"
                  >
                    {/* Stamp Circle */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] border-2 border-white shadow-md transition-all duration-200 group-hover/stamp:scale-125 ${
                        isEditing
                          ? 'bg-[#8B5CF6] text-white ring-2 ring-[#8B5CF6]/60 scale-110'
                          : isAnswered
                          ? 'bg-[#10B981] text-white'
                          : 'bg-[#FFC800] text-slate-900'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Elegant Floating Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/stamp:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-white text-xs font-medium whitespace-nowrap shadow-xl border border-white/10 pointer-events-none z-30">
                      <span className="font-bold text-[#FFC800]">Kuis #{idx + 1}</span>
                      <span className="text-white/60">({formatSecondsToMMSS(cp.detik_muncul)})</span>
                      <span className="max-w-[160px] truncate">{cp.judul_pertanyaan}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-2.5 pt-2">
            <div
              onClick={handleTimelineClick}
              className="timeline-track relative bg-[#E5E5E5] border-[#D4D4D8]"
              title="Klik untuk melompat ke waktu video"
            >
              <div className="timeline-fill" style={{ width: `${progressPercent}%` }} />

              {/* Cue Point Markers */}
              {cuePoints.map((cp, idx) => {
                const markerPct = Math.min(100, Math.max(0, (cp.detik_muncul / (totalDuration || 1)) * 100));
                const isAnswered = completedCuePointIds.has(cp.id);
                const isEditing = editingCuePointId === cp.id;

                let markerClass = 'timeline-marker ';
                if (isEditing) {
                  markerClass += 'active-editing';
                } else if (isAnswered) {
                  markerClass += 'timeline-marker-answered';
                } else {
                  markerClass += 'timeline-marker-pending';
                }

                return (
                  <div
                    key={cp.id}
                    style={{ left: `${markerPct}%` }}
                    onClick={(e) => handleMarkerClick(e, cp)}
                    className={markerClass}
                    title={`Kuis #${idx + 1} (${formatSecondsToMMSS(cp.detik_muncul)}): ${cp.judul_pertanyaan}${
                      isEditing ? ' — Sedang Dipilih & Diedit' : ''
                    }`}
                  >
                    <span>{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 1-Row Streamlined Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Navigasi Kiri: Play/Pause, Mundur 10s, Maju 10s, Suara & Indikator Waktu */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={togglePlayPause}
              className={`flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                isFullscreen
                  ? 'w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-white hover:text-[#FFC800] hover:bg-white/10'
                  : isPlaying
                  ? 'w-9 h-9 rounded-xl bg-[#F7F7F7] border-2 border-[#E5E5E5] text-[#1E293B] hover:border-[#CBD5E1]'
                  : 'w-9 h-9 rounded-xl bg-[#FFC800] border-2 border-[#FFC800] text-[#1E293B] hover:bg-[#FFD324]'
              }`}
              title={isPlaying ? 'Jeda Video' : 'Putar Video'}
            >
              <MaterialIcon name={isPlaying ? 'pause' : 'play_arrow'} className="text-xl sm:text-2xl" />
            </button>

            <button
              type="button"
              onClick={() => stepSeconds(-10)}
              className={`flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                isFullscreen
                  ? 'w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10'
                  : 'w-9 h-9 rounded-xl bg-[#F7F7F7] border-2 border-[#E5E5E5] text-[#4B4B4B] hover:border-[#CBD5E1]'
              }`}
              title="Mundur 10 Detik"
            >
              <MaterialIcon name="replay_10" className="text-lg sm:text-xl" />
            </button>

            <button
              type="button"
              onClick={() => stepSeconds(10)}
              className={`flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                isFullscreen
                  ? 'w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10'
                  : 'w-9 h-9 rounded-xl bg-[#F7F7F7] border-2 border-[#E5E5E5] text-[#4B4B4B] hover:border-[#CBD5E1]'
              }`}
              title="Maju 10 Detik"
            >
              <MaterialIcon name="forward_10" className="text-lg sm:text-xl" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className={`flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                isFullscreen
                  ? 'w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10'
                  : 'w-9 h-9 rounded-xl bg-[#F7F7F7] border-2 border-[#E5E5E5] text-[#4B4B4B] hover:border-[#CBD5E1]'
              }`}
              title={isMuted ? 'Suara Senyap (Klik untuk Nyalakan)' : 'Matikan Suara'}
            >
              <MaterialIcon name={isMuted ? 'volume_off' : 'volume_up'} className="text-lg sm:text-xl" />
            </button>

            {/* Durasi Waktu Video (Transparent & Elegant like YouTube) */}
            <div
              className={`flex items-center select-none ${
                isFullscreen
                  ? 'text-xs sm:text-sm font-medium tracking-wide text-white/90 ml-1.5'
                  : 'gap-1.5 text-xs sm:text-sm font-mono font-bold ml-1 text-[#64748B]'
              }`}
            >
              {isFullscreen ? (
                <>
                  <span className="tabular-nums font-semibold text-white">{formatSecondsToMMSS(currentTime)}</span>
                  <span className="text-white/40 mx-1">/</span>
                  <span className="tabular-nums text-white/70">{formatSecondsToMMSS(totalDuration)}</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="tabular-nums">{formatSecondsToMMSS(currentTime)}</span>
                  <span className="opacity-60">/</span>
                  <span className="tabular-nums">{formatSecondsToMMSS(totalDuration)}</span>
                </>
              )}
            </div>
          </div>

          {/* Navigasi Kanan: Tombol Studio & Fullscreen */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {isStudioMode && (
              <>
                {isFullscreen ? (
                  <button
                    type="button"
                    onClick={handleCaptureClick}
                    className="h-8 sm:h-9 px-3 rounded-lg bg-[#FFC800] hover:bg-[#FFD324] text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                    title="Jeda video dan tandai detik ini untuk membuat kuis"
                  >
                    <MaterialIcon name="add_location_alt" className="text-base" />
                    <span>+ Tandai Kuis ({formatSecondsToMMSS(currentTime)})</span>
                  </button>
                ) : (
                  <Button
                    size="sm"
                    variant="yellow"
                    onClick={handleCaptureClick}
                    icon={<MaterialIcon name="add_location_alt" className="text-base" />}
                    title="Jeda video dan tandai detik ini untuk membuat kuis"
                  >
                    <span>+ Tandai Kuis ({formatSecondsToMMSS(currentTime)})</span>
                  </Button>
                )}

                {isFullscreen && onToggleStudioDrawer && (
                  <button
                    type="button"
                    onClick={() => onToggleStudioDrawer(!isStudioDrawerOpen)}
                    className={`h-8 sm:h-9 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      isStudioDrawerOpen
                        ? 'bg-[#8B5CF6] text-white border border-[#7C3AED]'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                    }`}
                    title="Buka atau tutup panel formulir kuis di samping kanan"
                  >
                    <MaterialIcon name="dock_to_left" className="text-base" />
                    <span className="hidden sm:inline">
                      {isStudioDrawerOpen ? 'Tutup Form' : `Form Kuis (${cuePoints.length})`}
                    </span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                isFullscreen
                  ? 'h-8 sm:h-9 px-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10'
                  : 'h-9 px-3 rounded-xl bg-[#F7F7F7] border-2 border-[#E5E5E5] text-[#4B4B4B] hover:border-[#CBD5E1] font-extrabold'
              }`}
              title={isFullscreen ? 'Keluar dari Layar Penuh' : 'Layar Penuh'}
            >
              <MaterialIcon name={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} className="text-xl" />
              <span className="hidden sm:inline">
                {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up Melayang (Floating Sticky Kanan) di Atas Preview Video (Khusus Mode Fullscreen Studio Guru) */}
      {isFullscreen && isStudioMode && isStudioDrawerOpen && studioDrawerContent && (
        <aside
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-4 bottom-24 sm:top-5 sm:right-5 sm:bottom-28 w-[calc(100vw-2rem)] sm:w-[420px] lg:w-[450px] max-h-[calc(100vh-8rem)] bg-white text-[#1E293B] rounded-3xl border-2 border-[#E5E5E5] shadow-[0_20px_50px_rgba(0,0,0,0.55)] z-40 flex flex-col overflow-hidden animate-pop-in"
        >
          {/* Header Pop-up Melayang Kanan */}
          <div className="px-4 py-3 bg-[#F7F7F7] border-b-2 border-[#E5E5E5] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#EDE9FE] border border-[#C4B5FD] text-[#6D28D9] flex items-center justify-center shrink-0">
                <MaterialIcon name="quiz" className="text-lg" />
              </div>
              <div className="min-w-0">
                <h3 className="font-duo-display text-sm sm:text-base font-bold text-[#1E293B] truncate">
                  Pop-up Kuis Layar Penuh
                </h3>
                <p className="text-[11px] font-bold text-[#64748B] truncate">
                  Susun kuis langsung di atas pratinjau video
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggleStudioDrawer && onToggleStudioDrawer(false)}
              className="h-8 px-2.5 rounded-xl bg-white border-2 border-[#E5E5E5] hover:border-[#CBD5E1] text-xs font-extrabold text-[#4B4B4B] flex items-center gap-1 shrink-0 cursor-pointer"
              title="Sembunyikan pop-up kuis"
            >
              <MaterialIcon name="close" className="text-base" />
              <span>Tutup</span>
            </button>
          </div>

          {/* Isi Formulir & Daftar Kuis di Dalam Pop-up (Scroll Internal Rapi Tanpa Terpotong) */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-5">
            {studioDrawerContent}
          </div>
        </aside>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
