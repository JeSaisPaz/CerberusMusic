import React, { useEffect, useState } from 'react';
import { subsonic } from '../subsonic';
import { X, Music } from 'lucide-react';

interface LyricsPanelProps {
  currentTrack: any;
  onClose: () => void;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({ currentTrack, onClose }) => {
  const [lyrics, setLyrics] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!currentTrack) return;
      setLoading(true);
      setLyrics('');
      try {
        const text = await subsonic.getLyrics(currentTrack.artist, currentTrack.title);
        setLyrics(text);
      } catch (err) {
        console.error('Failed to get lyrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLyrics();
  }, [currentTrack]);

  // Generate cover art URL for background
  const getCoverArt = () => {
    if (!currentTrack) return '';
    return subsonic.getCoverArtUrl(currentTrack.coverArt || currentTrack.albumId, 600);
  };

  return (
    <div style={styles.overlay}>
      {/* Blurred Album Art Background */}
      <div
        style={{
          ...styles.bgImage,
          backgroundImage: `url(${getCoverArt()})`
        }}
      />
      <div style={styles.bgOverlay} />

      {/* Main Container */}
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.trackInfo}>
            <span style={styles.lyricsTitle}>Lyrics</span>
            <h2 style={styles.songName} className="truncate">{currentTrack?.title}</h2>
            <p style={styles.artistName} className="truncate">{currentTrack?.artist}</p>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="Close Lyrics">
            <X size={24} />
          </button>
        </header>

        {/* Content */}
        <div style={styles.content}>
          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner} className="spin" />
              <span>Fetching lyrics...</span>
            </div>
          ) : lyrics ? (
            <div style={styles.lyricsScroll}>
              {lyrics.split('\n').map((line, i) => (
                <p key={i} style={styles.lyricsLine}>
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <div style={styles.emptyContainer}>
              <Music size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
              <h3>Lyrics aren't available right now</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                We couldn't find any lyrics for this track in your Navidrome server.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 90,
    backgroundColor: '#000',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  bgImage: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 'calc(100% + 100px)',
    height: 'calc(100% + 100px)',
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    filter: 'blur(40px) brightness(0.25)',
    zIndex: 1,
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to bottom, transparent 0%, rgba(14, 13, 12, 0.95) 100%)',
    zIndex: 2,
  },
  container: {
    position: 'relative',
    zIndex: 3,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px',
  },
  trackInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  lyricsTitle: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: 'var(--color-orange)',
    fontWeight: 700,
    marginBottom: '8px',
  },
  songName: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  artistName: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    marginTop: '4px',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '16px',
    fontSize: '1rem',
    color: 'var(--text-secondary)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '4px solid var(--border-color)',
    borderTopColor: 'var(--color-orange)',
  },
  lyricsScroll: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  lyricsLine: {
    fontSize: '1.4rem',
    fontWeight: 700,
    lineHeight: '1.6',
    color: 'var(--text-primary)',
    opacity: 0.8,
    transition: 'all 0.2s ease',
    cursor: 'default',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
    padding: '24px',
  },
};
