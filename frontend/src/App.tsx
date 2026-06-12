import React, { useState, useEffect, useRef } from 'react';
import { subsonic } from './subsonic';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { MainContent } from './components/MainContent';
import { LyricsPanel } from './components/LyricsPanel';
import { X, Trash2, ListMusic, Music } from 'lucide-react';

export const App: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(subsonic.isAuthenticated());

  // Global Playback State
  const [currentTrack, setCurrentTrack] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  
  // Play Queue State
  const [playlistQueue, setPlaylistQueue] = useState<any[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<'none' | 'all' | 'one'>('none');
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);

  // Starred / Library State
  const [starredSongs, setStarredSongs] = useState<any[]>([]);
  const [playlistTrigger, setPlaylistTrigger] = useState<number>(0);

  // App Panels state
  const [showLyrics, setShowLyrics] = useState<boolean>(false);
  const [showQueue, setShowQueue] = useState<boolean>(false);

  // Navigations Stack State
  const [activeView, setActiveView] = useState<string>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [currentArtistId, setCurrentArtistId] = useState<string | null>(null);
  const [currentArtistName, setCurrentArtistName] = useState<string | null>(null);
  const [currentAlbumId, setCurrentAlbumId] = useState<string | null>(null);

  // Audio elements references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasScrobbledRef = useRef<boolean>(false);

  // Check connection on start
  useEffect(() => {
    if (authenticated) {
      subsonic.ping().then(ok => {
        if (!ok) {
          subsonic.clearCredentials();
          setAuthenticated(false);
        } else {
          fetchStarredSongs();
        }
      });
    }
  }, [authenticated]);

  // Sync Library Favorite Tracks
  const fetchStarredSongs = async () => {
    try {
      const data = await subsonic.getStarred();
      setStarredSongs(data.songs || []);
    } catch (err) {
      console.error('Failed to sync favorites', err);
    }
  };

  const handleLoginSuccess = () => {
    setAuthenticated(true);
    setActiveView('home');
  };

  const handleLogout = () => {
    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTrack(null);
    setPlaylistQueue([]);
    setCurrentQueueIndex(-1);

    // Clear authentication
    subsonic.clearCredentials();
    setAuthenticated(false);
  };

  // Audio Playback Triggers
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
        handleScrobbleCheck(audio.currentTime, audio.duration);
      });

      audio.addEventListener('durationchange', () => {
        setDuration(audio.duration);
      });

      audio.addEventListener('ended', () => {
        handleTrackEnded();
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [playlistQueue, currentQueueIndex, shuffle, repeat, shuffleOrder]);

  // Sync Volume to Audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Load new song when currentTrack changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const streamUrl = subsonic.getStreamUrl(currentTrack.id);
    audioRef.current.src = streamUrl;
    hasScrobbledRef.current = false;
    
    // Scrobble: mark "now playing" immediately
    subsonic.scrobble(currentTrack.id, false).catch(() => {});

    if (isPlaying) {
      audioRef.current.play().catch(e => {
        console.warn('Playback block', e);
        setIsPlaying(false);
      });
    }
  }, [currentTrack]);

  // Watch play/pause state
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Scrobble checks (Standard Last.fm rule: 50% or 4 minutes)
  const handleScrobbleCheck = (currentSecs: number, totalSecs: number) => {
    if (!currentTrack || hasScrobbledRef.current || !totalSecs || isNaN(totalSecs)) return;

    const minScrobbleTime = Math.min(totalSecs / 2, 240); // 50% or 4 minutes (240s)
    if (currentSecs >= minScrobbleTime) {
      hasScrobbledRef.current = true;
      subsonic.scrobble(currentTrack.id, true).catch(() => {});
    }
  };

  // Track Ended Router
  const handleTrackEnded = () => {
    if (repeat === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else {
      handleNextTrack();
    }
  };

  // Queue Navigation Actions
  const handlePlaySong = (track: any) => {
    setPlaylistQueue([track]);
    setCurrentQueueIndex(0);
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handlePlaySongs = (tracks: any[], startIndex: number = 0) => {
    setPlaylistQueue(tracks);
    setCurrentQueueIndex(startIndex);
    setCurrentTrack(tracks[startIndex]);
    setIsPlaying(true);

    if (shuffle) {
      generateShuffleOrder(tracks.length, startIndex);
    }
  };

  const handleAddSongsToQueue = (tracks: any[]) => {
    setPlaylistQueue(prev => {
      const nextQueue = [...prev, ...tracks];
      if (currentQueueIndex === -1 && nextQueue.length > 0) {
        setCurrentQueueIndex(0);
        setCurrentTrack(nextQueue[0]);
        setIsPlaying(true);
      }
      return nextQueue;
    });
  };

  const generateShuffleOrder = (length: number, currentIndex: number) => {
    const indices = Array.from({ length }, (_, i) => i).filter(i => i !== currentIndex);
    // Shuffle indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // Set current playing index at the front of shuffle queue
    setShuffleOrder([currentIndex, ...indices]);
  };

  const handleNextTrack = () => {
    if (playlistQueue.length === 0) return;

    if (shuffle && shuffleOrder.length > 0) {
      const currentShufflePos = shuffleOrder.indexOf(currentQueueIndex);
      if (currentShufflePos !== -1 && currentShufflePos < shuffleOrder.length - 1) {
        const nextIdx = shuffleOrder[currentShufflePos + 1];
        setCurrentQueueIndex(nextIdx);
        setCurrentTrack(playlistQueue[nextIdx]);
      } else if (repeat === 'all') {
        const firstIdx = shuffleOrder[0];
        setCurrentQueueIndex(firstIdx);
        setCurrentTrack(playlistQueue[firstIdx]);
      } else {
        setIsPlaying(false);
      }
      return;
    }

    if (currentQueueIndex < playlistQueue.length - 1) {
      const nextIdx = currentQueueIndex + 1;
      setCurrentQueueIndex(nextIdx);
      setCurrentTrack(playlistQueue[nextIdx]);
    } else if (repeat === 'all') {
      setCurrentQueueIndex(0);
      setCurrentTrack(playlistQueue[0]);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePreviousTrack = () => {
    if (playlistQueue.length === 0) return;

    // Restart track if > 3s
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (shuffle && shuffleOrder.length > 0) {
      const currentShufflePos = shuffleOrder.indexOf(currentQueueIndex);
      if (currentShufflePos > 0) {
        const prevIdx = shuffleOrder[currentShufflePos - 1];
        setCurrentQueueIndex(prevIdx);
        setCurrentTrack(playlistQueue[prevIdx]);
      }
      return;
    }

    if (currentQueueIndex > 0) {
      const prevIdx = currentQueueIndex - 1;
      setCurrentQueueIndex(prevIdx);
      setCurrentTrack(playlistQueue[prevIdx]);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleToggleShuffle = () => {
    const nextShuffle = !shuffle;
    setShuffle(nextShuffle);
    if (nextShuffle && playlistQueue.length > 0) {
      generateShuffleOrder(playlistQueue.length, currentQueueIndex);
    }
  };

  const handleToggleRepeat = () => {
    setRepeat(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  const handleToggleStarSong = async (track: any) => {
    const isStarred = starredSongs.some(s => s.id === track.id);
    try {
      if (isStarred) {
        await subsonic.unstar(track.id, true, false);
        setStarredSongs(prev => prev.filter(s => s.id !== track.id));
      } else {
        await subsonic.star(track.id, true, false);
        setStarredSongs(prev => [...prev, track]);
      }
      setPlaylistTrigger(prev => prev + 1); // trigger sidebar updates if needed
    } catch (err) {
      console.error(err);
    }
  };

  const handleArtistClick = (artistId: string, artistName: string) => {
    setCurrentArtistId(artistId);
    setCurrentArtistName(artistName);
    setSelectedPlaylistId(null);
    setActiveView('artist');
  };

  const handlePlayFromQueue = (index: number) => {
    setCurrentQueueIndex(index);
    setCurrentTrack(playlistQueue[index]);
    setIsPlaying(true);
  };

  const handleClearQueue = () => {
    setPlaylistQueue([]);
    setCurrentQueueIndex(-1);
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  // Render Authentication/Login or dashboard layout
  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isCurrentTrackStarred = currentTrack && starredSongs.some(s => s.id === currentTrack.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <div className="app-container">
        {/* Sidebar Nav */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          selectedPlaylistId={selectedPlaylistId}
          setSelectedPlaylistId={setSelectedPlaylistId}
          onLogout={handleLogout}
          playlistTrigger={playlistTrigger}
          setPlaylistTrigger={setPlaylistTrigger}
        />

        {/* Main Content scroll window */}
        <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden', position: 'relative', gap: showQueue ? '8px' : '0' }}>
          
          <MainContent
            activeView={activeView}
            setActiveView={setActiveView}
            selectedPlaylistId={selectedPlaylistId}
            setSelectedPlaylistId={setSelectedPlaylistId}
            onPlaySong={handlePlaySong}
            onPlaySongs={handlePlaySongs}
            onAddSongsToQueue={handleAddSongsToQueue}
            starredSongs={starredSongs}
            toggleStarSong={handleToggleStarSong}
            playlistTrigger={playlistTrigger}
            setPlaylistTrigger={setPlaylistTrigger}
            currentArtistId={currentArtistId}
            setCurrentArtistId={setCurrentArtistId}
            currentArtistName={currentArtistName}
            setCurrentArtistName={setCurrentArtistName}
            currentAlbumId={currentAlbumId}
            setCurrentAlbumId={setCurrentAlbumId}
          />

          {/* Slide-out Queue Panel (Spotify-style) */}
          {showQueue && (
            <div style={styles.queuePanel}>
              <div style={styles.queueHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ListMusic size={20} color="var(--color-orange)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Play Queue</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleClearQueue} style={styles.queueActionBtn} title="Clear Queue">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => setShowQueue(false)} style={styles.queueActionBtn}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div style={styles.queueContent}>
                {playlistQueue.length === 0 ? (
                  <div style={styles.queueEmpty}>
                    <Music size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                    <span>Queue is empty</span>
                  </div>
                ) : (
                  playlistQueue.map((track, i) => (
                    <div
                      key={`${track.id}-${i}`}
                      onClick={() => handlePlayFromQueue(i)}
                      style={{
                        ...styles.queueItem,
                        ...(i === currentQueueIndex ? styles.queueItemActive : {})
                      }}
                      className="clickable"
                    >
                      <img
                        src={subsonic.getCoverArtUrl(track.coverArt || track.albumId, 80)}
                        alt={track.title}
                        style={styles.queueItemArt}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=120&auto=format&fit=crop';
                        }}
                      />
                      <div style={styles.queueItemText} className="truncate">
                        <div style={styles.queueItemTitle} className="truncate">{track.title}</div>
                        <div style={styles.queueItemArtist} className="truncate">{track.artist}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Lyrics Full Panel Overlay */}
          {showLyrics && currentTrack && (
            <LyricsPanel
              currentTrack={currentTrack}
              onClose={() => setShowLyrics(false)}
            />
          )}
        </div>
      </div>

      {/* Bottom Music Player Bar */}
      <Player
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={handleNextTrack}
        onPrevious={handlePreviousTrack}
        volume={volume}
        onVolumeChange={setVolume}
        currentTime={currentTime}
        onSeek={handleSeek}
        duration={duration}
        shuffle={shuffle}
        onToggleShuffle={handleToggleShuffle}
        repeat={repeat}
        onToggleRepeat={handleToggleRepeat}
        isStarred={!!isCurrentTrackStarred}
        onToggleStar={() => currentTrack && handleToggleStarSong(currentTrack)}
        showLyrics={showLyrics}
        setShowLyrics={setShowLyrics}
        showQueue={showQueue}
        setShowQueue={setShowQueue}
        onArtistClick={handleArtistClick}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  queuePanel: {
    width: '320px',
    height: '100%',
    backgroundColor: 'var(--bg-sidebar)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    animation: 'slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  queueHeader: {
    padding: '16px',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueActionBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s ease',
  },
  queueContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  queueEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    fontSize: '0.88rem',
  },
  queueItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    borderRadius: '6px',
    transition: 'background 0.15s ease',
  },
  queueItemActive: {
    backgroundColor: 'var(--bg-hover)',
    borderLeft: '3px solid var(--color-orange)',
    paddingLeft: '5px',
  },
  queueItemArt: {
    width: '40px',
    height: '40px',
    borderRadius: '4px',
    objectFit: 'cover',
  },
  queueItemText: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  queueItemTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  queueItemArtist: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
};
