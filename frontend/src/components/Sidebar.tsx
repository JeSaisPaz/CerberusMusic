import React, { useEffect, useState } from 'react';
import { subsonic } from '../subsonic';
import { Home, Search, Heart, Sparkles, FolderPlus, LogOut, Disc, Settings } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  onLogout: () => void;
  playlistTrigger: number; // Trigger reload when playlist is updated/created
  setPlaylistTrigger: React.Dispatch<React.SetStateAction<number>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  selectedPlaylistId,
  setSelectedPlaylistId,
  onLogout,
  playlistTrigger,
  setPlaylistTrigger
}) => {
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!subsonic.isAuthenticated()) return;
      try {
        const list = await subsonic.getPlaylists();
        setPlaylists(list);
      } catch (err) {
        console.error('Error fetching playlists', err);
      }
    };
    fetchPlaylists();
  }, [playlistTrigger]);

  const handleCreatePlaylist = async () => {
    const name = prompt('Enter a name for your new playlist:');
    if (!name || name.trim() === '') return;

    try {
      const newPlaylist = await subsonic.createPlaylist(name.trim(), []);
      if (newPlaylist) {
        setPlaylistTrigger(prev => prev + 1);
        setSelectedPlaylistId(newPlaylist.id);
        setActiveView('playlist');
      }
    } catch (err) {
      alert('Failed to create playlist');
    }
  };

  const navigateTo = (view: string) => {
    setSelectedPlaylistId(null);
    setActiveView(view);
  };

  const handlePlaylistClick = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setActiveView('playlist');
  };

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.logoSection}>
        <div style={styles.logoIcon}>
          <Disc size={20} color="#fff" />
        </div>
        <span style={styles.logoText}>Cerberus Music</span>
      </div>

      {/* Navigation list */}
      <nav style={styles.navSection}>
        <ul style={styles.navList}>
          <li
            onClick={() => navigateTo('home')}
            style={{
              ...styles.navItem,
              ...(activeView === 'home' ? styles.activeNavItem : {})
            }}
          >
            <Home size={20} />
            <span>Home</span>
          </li>
          <li
            onClick={() => navigateTo('search')}
            style={{
              ...styles.navItem,
              ...(activeView === 'search' ? styles.activeNavItem : {})
            }}
          >
            <Search size={20} />
            <span>Search</span>
          </li>
          <li
            onClick={() => navigateTo('starred')}
            style={{
              ...styles.navItem,
              ...(activeView === 'starred' ? styles.activeNavItem : {})
            }}
          >
            <Heart size={20} />
            <span>Library</span>
          </li>
          <li
            onClick={() => navigateTo('discover')}
            style={{
              ...styles.navItem,
              ...(activeView === 'discover' ? styles.activeNavItem : {})
            }}
          >
            <Sparkles size={20} />
            <span>Discover Mixes</span>
          </li>
        </ul>
      </nav>

      {/* Playlists Header */}
      <div style={styles.playlistsHeader}>
        <span style={styles.sectionTitle}>Playlists</span>
        <button onClick={handleCreatePlaylist} style={styles.iconBtn} title="Create Playlist">
          <FolderPlus size={18} />
        </button>
      </div>

      {/* Playlists Scroll Area */}
      <div style={styles.playlistsList}>
        {playlists.length === 0 ? (
          <div style={styles.emptyPlaylists}>No playlists. Create one above!</div>
        ) : (
          playlists.map(playlist => (
            <div
              key={playlist.id}
              onClick={() => handlePlaylistClick(playlist.id)}
              style={{
                ...styles.playlistItem,
                ...(activeView === 'playlist' && selectedPlaylistId === playlist.id
                  ? styles.activePlaylistItem
                  : {})
              }}
            >
              <span className="truncate">{playlist.name}</span>
            </div>
          ))
        )}
      </div>

      {/* Footer Area with Logout & Admin */}
      <div style={styles.footer}>
        <a href={`http://${window.location.hostname}:4534/app/`} target="_blank" rel="noopener noreferrer" style={styles.adminBtn}>
          <Settings size={16} />
          <span>Admin Panel</span>
        </a>
        <button onClick={onLogout} style={styles.logoutBtn}>
          <LogOut size={16} />
          <span>Disconnect</span>
        </button>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100%',
    backgroundColor: 'var(--bg-sidebar)',
    borderRadius: '8px',
    padding: '24px 16px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '28px',
    paddingLeft: '4px',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-orange)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 8px rgba(224, 94, 54, 0.2)',
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
  },
  navSection: {
    marginBottom: '24px',
  },
  navList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '10px 14px',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '0.92rem',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  activeNavItem: {
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--color-orange)',
  },
  playlistsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 4px 12px 4px',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '10px',
  },
  sectionTitle: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.15s ease',
  },
  playlistsList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingRight: '2px',
  },
  playlistItem: {
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontWeight: 500,
  },
  activePlaylistItem: {
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  emptyPlaylists: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    padding: '12px 12px',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: '1.4',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-color)',
  },
  adminBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    color: 'var(--text-secondary)',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    marginBottom: '4px',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
};
// Add custom hover css logic in stylesheet
// But this style setup inline handles most states cleanly
