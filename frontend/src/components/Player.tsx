import React from 'react';
import { subsonic } from '../subsonic';
import { metadataScraper } from '../metadata';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Mic2, ListMusic, Heart
} from 'lucide-react';

interface PlayerProps {
  currentTrack: any | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  currentTime: number;
  onSeek: (time: number) => void;
  duration: number;
  shuffle: boolean;
  onToggleShuffle: () => void;
  repeat: 'none' | 'all' | 'one';
  onToggleRepeat: () => void;
  isStarred: boolean;
  onToggleStar: () => void;
  showLyrics: boolean;
  setShowLyrics: (show: boolean) => void;
  showQueue: boolean;
  setShowQueue: (show: boolean) => void;
  onArtistClick: (artistId: string, artistName: string) => void;
}

export const Player: React.FC<PlayerProps> = ({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  volume,
  onVolumeChange,
  currentTime,
  onSeek,
  duration,
  shuffle,
  onToggleShuffle,
  repeat,
  onToggleRepeat,
  isStarred,
  onToggleStar,
  showLyrics,
  setShowLyrics,
  showQueue,
  setShowQueue,
  onArtistClick
}) => {
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseFloat(e.target.value));
  };

  const [muted, setMuted] = React.useState(false);
  const [prevVolume, setPrevVolume] = React.useState(volume);

  const toggleMute = () => {
    if (muted) {
      onVolumeChange(prevVolume);
      setMuted(false);
    } else {
      setPrevVolume(volume);
      onVolumeChange(0);
      setMuted(true);
    }
  };

  // Get cover art or fallback
  const getCoverArt = () => {
    if (!currentTrack) return '';
    return subsonic.getCoverArtUrl(currentTrack.coverArt || currentTrack.albumId);
  };

  // Render artists with clickable links
  const renderArtistLinks = () => {
    if (!currentTrack) return null;
    const { primary, featured } = metadataScraper.parseArtists(currentTrack.artist);

    return (
      <div style={styles.artistList} className="truncate">
        <span
          onClick={() => currentTrack.artistId && onArtistClick(currentTrack.artistId, primary)}
          style={styles.artistLink}
        >
          {primary}
        </span>
        {featured.map((featArtist) => (
          <span key={featArtist}>
            <span style={styles.artistSeparator}>, </span>
            <span
              onClick={() => onArtistClick('', featArtist)} // Empty artistId triggers a search-based navigation
              style={styles.artistLink}
            >
              {featArtist}
            </span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <footer style={styles.playerBar}>
      {/* Now Playing Info */}
      <div style={styles.leftSection}>
        {currentTrack ? (
          <>
            <img
              src={getCoverArt()}
              alt={currentTrack.title}
              onError={(e) => {
                // If standard Navidrome cover fails, fallback to simple styling or music icon
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=120&auto=format&fit=crop';
              }}
              style={styles.albumArt}
            />
            <div style={styles.trackDetails}>
              <div style={styles.trackTitle} className="truncate" title={currentTrack.title}>
                {currentTrack.title}
              </div>
              {renderArtistLinks()}
            </div>
            <button onClick={onToggleStar} style={styles.starBtn} title={isStarred ? "Remove from Library" : "Save to Library"}>
              <Heart
                size={18}
                fill={isStarred ? "var(--color-orange)" : "none"}
                color={isStarred ? "var(--color-orange)" : "var(--text-secondary)"}
              />
            </button>
          </>
        ) : (
          <div style={styles.noTrack}>No track playing</div>
        )}
      </div>

      {/* Playback Controls (Middle) */}
      <div style={styles.middleSection}>
        <div style={styles.controlButtons}>
          <button
            onClick={onToggleShuffle}
            style={{
              ...styles.controlBtn,
              color: shuffle ? 'var(--color-orange)' : 'var(--text-secondary)'
            }}
            title="Shuffle"
          >
            <Shuffle size={18} />
          </button>

          <button onClick={onPrevious} style={styles.controlBtn} disabled={!currentTrack} title="Previous">
            <SkipBack size={20} />
          </button>

          <button
            onClick={onPlayPause}
            style={styles.playPauseBtn}
            disabled={!currentTrack}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} fill="#fff" color="#fff" /> : <Play size={20} fill="#fff" color="#fff" style={{ marginLeft: 3 }} />}
          </button>

          <button onClick={onNext} style={styles.controlBtn} disabled={!currentTrack} title="Next">
            <SkipForward size={20} />
          </button>

          <button
            onClick={onToggleRepeat}
            style={{
              ...styles.controlBtn,
              color: repeat !== 'none' ? 'var(--color-orange)' : 'var(--text-secondary)'
            }}
            title="Repeat"
          >
            {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <span style={styles.timeLabel}>{formatTime(currentTime)}</span>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSliderChange}
              disabled={!currentTrack}
              className="custom-slider"
            />
          </div>
          <span style={styles.timeLabel}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Extra Controls (Right) */}
      <div style={styles.rightSection}>
        <button
          onClick={() => setShowLyrics(!showLyrics)}
          style={{
            ...styles.utilityBtn,
            color: showLyrics ? 'var(--color-orange)' : 'var(--text-secondary)'
          }}
          disabled={!currentTrack}
          title="Lyrics"
        >
          <Mic2 size={18} />
        </button>

        <button
          onClick={() => setShowQueue(!showQueue)}
          style={{
            ...styles.utilityBtn,
            color: showQueue ? 'var(--color-orange)' : 'var(--text-secondary)'
          }}
          title="Play Queue"
        >
          <ListMusic size={18} />
        </button>

        {/* Volume controls */}
        <div style={styles.volumeContainer}>
          <button onClick={toggleMute} style={styles.utilityBtn} title={muted || volume === 0 ? "Unmute" : "Mute"}>
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div className="slider-container" style={{ width: '80px' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                onVolumeChange(vol);
                if (vol > 0 && muted) setMuted(false);
              }}
              className="custom-slider"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

const styles: Record<string, React.CSSProperties> = {
  playerBar: {
    height: 'var(--player-height)',
    width: '100vw',
    backgroundColor: 'var(--bg-deep)',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'fixed',
    bottom: 0,
    left: 0,
    zIndex: 100,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    width: '30%',
    minWidth: '180px',
  },
  albumArt: {
    width: '56px',
    height: '56px',
    borderRadius: '4px',
    objectFit: 'cover',
    boxShadow: 'var(--shadow-sm)',
  },
  trackDetails: {
    marginLeft: '14px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    marginRight: '12px',
  },
  trackTitle: {
    fontSize: '0.92rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '3px',
  },
  artistList: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  artistLink: {
    cursor: 'pointer',
    transition: 'color 0.15s ease',
  },
  artistSeparator: {
    color: 'var(--text-muted)',
  },
  starBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  noTrack: {
    color: 'var(--text-muted)',
    fontSize: '0.88rem',
    fontStyle: 'italic',
  },
  middleSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '40%',
    maxWidth: '580px',
  },
  controlButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '8px',
  },
  controlBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '50%',
    transition: 'all 0.15s ease',
  },
  playPauseBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s ease',
    boxShadow: 'var(--shadow-sm)',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  timeLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    minWidth: '32px',
    textAlign: 'center',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '14px',
    width: '30%',
  },
  utilityBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    borderRadius: '4px',
    transition: 'all 0.15s ease',
  },
  volumeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
};
// Hover states are styled in App/CSS or using hover utility classes
