import React, { useEffect, useState } from 'react';
import { subsonic } from '../subsonic';
import { metadataScraper } from '../metadata';
import {
  Play, Shuffle, Heart, Music, Clock, User, Disc, Search as SearchIcon,
  Sparkles, Plus, Trash2, ArrowLeft, RefreshCw, ListMusic, Wand2
} from 'lucide-react';

interface MainContentProps {
  activeView: string;
  setActiveView: (view: string) => void;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  onPlaySong: (track: any) => void;
  onPlaySongs: (tracks: any[], startIndex?: number) => void;
  onAddSongsToQueue: (tracks: any[]) => void;
  starredSongs: any[];
  toggleStarSong: (track: any) => void;
  playlistTrigger: number;
  setPlaylistTrigger: React.Dispatch<React.SetStateAction<number>>;
  
  // Navigation stack state
  currentArtistId: string | null;
  setCurrentArtistId: (id: string | null) => void;
  currentArtistName: string | null;
  setCurrentArtistName: (name: string | null) => void;
  currentAlbumId: string | null;
  setCurrentAlbumId: (id: string | null) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  activeView,
  setActiveView,
  selectedPlaylistId,
  setSelectedPlaylistId,
  onPlaySongs,
  starredSongs,
  toggleStarSong,
  playlistTrigger,
  setPlaylistTrigger,
  currentArtistId,
  setCurrentArtistId,
  currentArtistName,
  setCurrentArtistName,
  currentAlbumId,
  setCurrentAlbumId
}) => {
  // Page states
  const [frequentAlbums, setFrequentAlbums] = useState<any[]>([]);
  const [newestAlbums, setNewestAlbums] = useState<any[]>([]);
  const [randomAlbums, setRandomAlbums] = useState<any[]>([]);
  const [allAlbums, setAllAlbums] = useState<any[]>([]);
  const [loadingHome, setLoadingHome] = useState<boolean>(true);
  const [loadingAll, setLoadingAll] = useState<boolean>(false);
  const [recommendedAlbums, setRecommendedAlbums] = useState<any[]>([]);

  // Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ songs: any[], albums: any[], artists: any[] }>({ songs: [], albums: [], artists: [] });
  const [searching, setSearching] = useState<boolean>(false);

  // Album detail states
  const [albumDetails, setAlbumDetails] = useState<any>(null);
  const [albumTracks, setAlbumTracks] = useState<any[]>([]);
  const [albumCoverUrl, setAlbumCoverUrl] = useState<string>('');
  const [albumColor, setAlbumColor] = useState<string>('#1b1917');
  const [loadingAlbum, setLoadingAlbum] = useState<boolean>(false);

  // Artist detail states
  const [artistDetails, setArtistDetails] = useState<any>(null);
  const [artistAlbums, setArtistAlbums] = useState<any[]>([]);
  const [artistFeaturedTracks, setArtistFeaturedTracks] = useState<any[]>([]);
  const [loadingArtist, setLoadingArtist] = useState<boolean>(false);

  // Playlist detail states
  const [playlistDetails, setPlaylistDetails] = useState<any>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [loadingPlaylist, setLoadingPlaylist] = useState<boolean>(false);
  const [playlistsList, setPlaylistsList] = useState<any[]>([]);
  const [showAddToPlaylistMenu, setShowAddToPlaylistMenu] = useState<string | null>(null);

  // Identify Wizard State
  const [showIdentifyWizard, setShowIdentifyWizard] = useState<boolean>(false);
  const [wizardAlbumName, setWizardAlbumName] = useState<string>('');
  const [wizardArtistName, setWizardArtistName] = useState<string>('');
  const [wizardCoverUrl, setWizardCoverUrl] = useState<string>('');
  const [wizardSubmitting, setWizardSubmitting] = useState<boolean>(false);

  // Custom Recommendations state
  const [discoverTracks, setDiscoverTracks] = useState<any[]>([]);
  const [forgottenTracks, setForgottenTracks] = useState<any[]>([]);
  const [dailyMixes, setDailyMixes] = useState<{ name: string; genre: string; tracks: any[] }[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState<boolean>(false);
  const [activeDiscoverType, setActiveDiscoverType] = useState<'discover' | 'forgotten' | 'mix0' | 'mix1' | null>(null);

  // Fetch Home content
  useEffect(() => {
    const fetchHome = async () => {
      if (!subsonic.isAuthenticated() || activeView !== 'home') return;
      setLoadingHome(true);
      try {
        const freq = await subsonic.getAlbumList('frequent', 8);
        const news = await subsonic.getAlbumList('newest', 8);
        const rand = await subsonic.getAlbumList('random', 8);
        setFrequentAlbums(freq);
        setNewestAlbums(news);
        setRandomAlbums(rand);

        // Generate Home Recommendations based on frequent listening
        if (freq.length > 0) {
          const randomSeedAlbum = freq[Math.floor(Math.random() * freq.length)];
          const seedArtist = randomSeedAlbum.artist;
          const searchRes = await subsonic.search(seedArtist);
          const similarAlbums = searchRes.albums.filter((a: any) => a.id !== randomSeedAlbum.id).slice(0, 8);
          if (similarAlbums.length < 4) {
             const fallback = await subsonic.getAlbumList('random', 8);
             setRecommendedAlbums(fallback);
          } else {
             setRecommendedAlbums(similarAlbums);
          }
        } else {
          setRecommendedAlbums(rand);
        }
      } catch (err) {
        console.error('Home load error', err);
      } finally {
        setLoadingHome(false);
      }
    };
    fetchHome();
  }, [activeView]);

  // Fetch All Albums
  useEffect(() => {
    const fetchAllAlbums = async () => {
      if (!subsonic.isAuthenticated() || activeView !== 'all') return;
      if (allAlbums.length > 0) return; // cache
      setLoadingAll(true);
      try {
        const list = await subsonic.getAlbumList('alphabeticalByName', 500);
        setAllAlbums(list);
      } catch (err) {
        console.error('All albums load error', err);
      } finally {
        setLoadingAll(false);
      }
    };
    fetchAllAlbums();
  }, [activeView]);

  // Fetch playlists list (for adding tracks)
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!subsonic.isAuthenticated()) return;
      try {
        const list = await subsonic.getPlaylists();
        setPlaylistsList(list);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlaylists();
  }, [playlistTrigger]);

  // Build recommendation mixes dynamically
  const buildRecommendations = async (force: boolean = false) => {
    if (!subsonic.isAuthenticated()) return;
    if (discoverTracks.length > 0 && !force) return; // Already built

    setLoadingDiscover(true);
    try {
      // 1. Fetch seed pools
      const starred = await subsonic.getStarred();
      const frequent = await subsonic.getAlbumList('frequent', 10);
      
      const seedSongs = [...(starred.songs || [])];
      
      // Load some tracks from frequent albums to use as seeds if starred is empty
      if (seedSongs.length < 5 && frequent.length > 0) {
        for (const album of frequent.slice(0, 3)) {
          const detail = await subsonic.getAlbum(album.id);
          if (detail && detail.song) {
            seedSongs.push(...(Array.isArray(detail.song) ? detail.song : [detail.song]));
          }
        }
      }

      // 2. Build Discover (similar songs from seeds)
      const discoverPool: any[] = [];
      if (seedSongs.length > 0) {
        // Take up to 3 random seeds
        const shuffledSeeds = [...seedSongs].sort(() => 0.5 - Math.random()).slice(0, 3);
        for (const seed of shuffledSeeds) {
          const similar = await subsonic.getSimilarSongs(seed.id, 10);
          discoverPool.push(...similar);
        }
      } else {
        // Fallback if library is brand new: just fetch random tracks
        try {
          const res = await subsonic.getAlbumList('random', 4);
          for (const alb of res) {
            const detail = await subsonic.getAlbum(alb.id);
            if (detail && detail.song) {
              discoverPool.push(...(Array.isArray(detail.song) ? detail.song : [detail.song]));
            }
          }
        } catch {}
      }

      // Filter duplicates in discover pool
      const uniqueDiscover = Array.from(new Map(discoverPool.map(s => [s.id, s])).values())
        .filter(s => !starredSongs.some(starred => starred.id === s.id)) // Recommend things not already starred
        .slice(0, 25);
      setDiscoverTracks(uniqueDiscover);

      // 3. Build Forgotten Favorites (starred songs shuffled)
      const uniqueForgotten = [...starredSongs]
        .sort(() => 0.5 - Math.random())
        .slice(0, 20);
      setForgottenTracks(uniqueForgotten);

      // 4. Build Daily Mixes based on predefined styles
      const curatedStyles = ['Hip-Hop', 'Rap', 'Gaming', 'Pop', 'Rock', 'Electronic'];
      const targetStyles = curatedStyles.sort(() => 0.5 - Math.random()).slice(0, 3); // Pick 3 random styles

      const mixes: typeof dailyMixes = [];
      for (const style of targetStyles) {
        try {
          // Search for the style as a keyword/genre
          const res = await subsonic.search(style);
          const styleTracks = (res.songs || [])
            .sort(() => 0.5 - Math.random())
            .slice(0, 20);
          
          if (styleTracks.length > 0) {
            mixes.push({
              name: `${style} Mix`,
              genre: style,
              tracks: styleTracks
            });
          }
        } catch {}
      }
      setDailyMixes(mixes);

    } catch (err) {
      console.error('Error generating mixes:', err);
    } finally {
      setLoadingDiscover(false);
    }
  };

  useEffect(() => {
    if (activeView === 'discover') {
      buildRecommendations();
    }
  }, [activeView, starredSongs]);

  // Load Album details
  useEffect(() => {
    const fetchAlbum = async () => {
      if (!currentAlbumId || activeView !== 'album') return;
      setLoadingAlbum(true);
      setAlbumDetails(null);
      setAlbumTracks([]);
      setAlbumColor('#1b1917');
      
      try {
        const detail = await subsonic.getAlbum(currentAlbumId);
        setAlbumDetails(detail);
        const tracks = detail.song ? (Array.isArray(detail.song) ? detail.song : [detail.song]) : [];
        setAlbumTracks(tracks);

        // Dynamic cover art URL
        const coverArtId = detail.coverArt || currentAlbumId;
        const coverUrl = subsonic.getCoverArtUrl(coverArtId, 400);
        setAlbumCoverUrl(coverUrl);

        // Trigger dynamic color extraction in background
        extractDominantColor(coverUrl).then(color => setAlbumColor(color));

        // Metdata Scraper Fallback if cover looks missing or placeholder
        if (!detail.coverArt) {
          const fallback = await metadataScraper.getFallbackCoverArt(detail.artist, detail.name);
          if (fallback) {
            setAlbumCoverUrl(fallback);
            extractDominantColor(fallback).then(color => setAlbumColor(color));
          }
        }
      } catch (err) {
        console.error('Error loading album details', err);
      } finally {
        setLoadingAlbum(false);
      }
    };
    fetchAlbum();
  }, [currentAlbumId, activeView]);

  // Load Artist details
  useEffect(() => {
    const fetchArtist = async () => {
      if (activeView !== 'artist') return;
      setLoadingArtist(true);
      setArtistDetails(null);
      setArtistAlbums([]);
      setArtistFeaturedTracks([]);

      try {
        let artistId = currentArtistId;
        
        // If artistId is empty, it means we clicked a featured artist and only have a name.
        // We must query Subsonic search to resolve the artist ID.
        if (!artistId && currentArtistName) {
          const results = await subsonic.search(currentArtistName);
          const matchedArtist = results.artists.find(
            a => a.name.toLowerCase() === currentArtistName.toLowerCase()
          ) || results.artists[0];
          
          if (matchedArtist) {
            artistId = matchedArtist.id;
            setCurrentArtistId(artistId);
          } else {
            // No artist profile exists, we will search tracks matching this name as guest appearance
            setArtistDetails({ name: currentArtistName });
            setArtistFeaturedTracks(results.songs);
            setLoadingArtist(false);
            return;
          }
        }

        if (!artistId) throw new Error('No artist identifier found');

        const detail = await subsonic.getArtist(artistId);
        setArtistDetails(detail);
        
        const albums = detail.album ? (Array.isArray(detail.album) ? detail.album : [detail.album]) : [];
        setArtistAlbums(albums);

        // Fetch tracks where artist is featured (Guest Appearances)
        // We query Subsonic search for the artist name, and filter tracks where their name appears in artist tag
        // but they are not the primary artist (or match the full string).
        if (detail.name) {
          const results = await subsonic.search(detail.name);
          const guestTracks = results.songs.filter(song => {
            const parsed = metadataScraper.parseArtists(song.artist);
            // Featured but primary is not this artist
            return parsed.featured.some(f => f.toLowerCase() === detail.name.toLowerCase()) && 
                   parsed.primary.toLowerCase() !== detail.name.toLowerCase();
          });
          setArtistFeaturedTracks(guestTracks);
        }

      } catch (err) {
        console.error('Error loading artist details', err);
      } finally {
        setLoadingArtist(false);
      }
    };
    fetchArtist();
  }, [currentArtistId, currentArtistName, activeView]);

  // Load Playlist details
  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!selectedPlaylistId || activeView !== 'playlist') return;
      setLoadingPlaylist(true);
      setPlaylistDetails(null);
      setPlaylistTracks([]);

      try {
        const detail = await subsonic.getPlaylist(selectedPlaylistId);
        setPlaylistDetails(detail);
        const tracks = detail.entry ? (Array.isArray(detail.entry) ? detail.entry : [detail.entry]) : [];
        setPlaylistTracks(tracks);
      } catch (err) {
        console.error('Playlist load error', err);
      } finally {
        setLoadingPlaylist(false);
      }
    };
    fetchPlaylist();
  }, [selectedPlaylistId, activeView]);

  // Handle Search Input
  useEffect(() => {
    const triggerSearch = async () => {
      const q = searchQuery.trim();
      if (q === '') {
        setSearchResults({ songs: [], albums: [], artists: [] });
        return;
      }
      setSearching(true);
      try {
        const res = await subsonic.search(q);
        setSearchResults(res);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      triggerSearch();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Dynamic Average Color Canvas Extractor
  const extractDominantColor = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 10;
          canvas.height = 10;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve('#1b1917');

          ctx.drawImage(img, 0, 0, 10, 10);
          const data = ctx.getImageData(0, 0, 10, 10).data;

          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            const pixelR = data[i];
            const pixelG = data[i + 1];
            const pixelB = data[i + 2];

            const brightness = (pixelR + pixelG + pixelB) / 3;
            // Filter out extreme blacks/whites for nice background colors
            if (brightness > 40 && brightness < 200) {
              r += pixelR;
              g += pixelG;
              b += pixelB;
              count++;
            }
          }

          if (count === 0) return resolve('var(--color-orange-muted)');
          
          r = Math.max(15, Math.floor(r / count) - 20); // Darken a bit for visual comfort
          g = Math.max(13, Math.floor(g / count) - 20);
          b = Math.max(12, Math.floor(b / count) - 20);

          resolve(`rgb(${r}, ${g}, ${b})`);
        } catch {
          resolve('#1b1917');
        }
      };
      img.onerror = () => resolve('#1b1917');
    });
  };

  // Navigations
  const openAlbum = (albumId: string) => {
    setCurrentAlbumId(albumId);
    setActiveView('album');
  };

  const openArtist = (artistId: string, artistName: string) => {
    setCurrentArtistId(artistId);
    setCurrentArtistName(artistName);
    setActiveView('artist');
  };

  // Playlist management actions
  const deletePlaylist = async () => {
    if (!selectedPlaylistId) return;
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      await subsonic.deletePlaylist(selectedPlaylistId);
      setPlaylistTrigger(prev => prev + 1);
      setSelectedPlaylistId(null);
      setActiveView('home');
    } catch {
      alert('Failed to delete playlist');
    }
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    try {
      await subsonic.updatePlaylist(playlistId, [trackId], []);
      setPlaylistTrigger(prev => prev + 1);
      setShowAddToPlaylistMenu(null);
    } catch {
      alert('Failed to add track to playlist');
    }
  };

  const removeTrackFromPlaylist = async (index: number) => {
    if (!selectedPlaylistId) return;
    try {
      await subsonic.updatePlaylist(selectedPlaylistId, [], [index]);
      // Reload playlist
      const detail = await subsonic.getPlaylist(selectedPlaylistId);
      const tracks = detail.entry ? (Array.isArray(detail.entry) ? detail.entry : [detail.entry]) : [];
      setPlaylistTracks(tracks);
      setPlaylistTrigger(prev => prev + 1);
    } catch {
      alert('Failed to remove track');
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // --- RENDER VIEWS ---

  // HOME VIEW
  const renderHome = () => {
    if (loadingHome) {
      return (
        <div style={styles.loaderContainer}>
          <div style={styles.spinner} className="spin" />
          <span>Syncing your library...</span>
        </div>
      );
    }

    const renderAlbumGrid = (albums: any[]) => (
      <div style={styles.grid}>
        {albums.map(album => {
          const coverUrl = album._cerberusCover || subsonic.getCoverArtUrl(album.coverArt || album.id, 200);
          return (
            <div
              key={album.id}
              onClick={() => openAlbum(album.id)}
              style={styles.card}
              className="clickable"
            >
              <div style={styles.cardCoverContainer}>
                <img
                  src={coverUrl}
                  alt={album.name}
                  onError={async (e) => {
                    // Fallback using scraper
                    const fallback = await metadataScraper.getFallbackCoverArt(album.artist, album.name);
                    (e.target as HTMLImageElement).src = fallback || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=120&auto=format&fit=crop';
                  }}
                  style={styles.cardCover}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Play whole album
                    subsonic.getAlbum(album.id).then(details => {
                      const songs = details.song ? (Array.isArray(details.song) ? details.song : [details.song]) : [];
                      if (songs.length > 0) onPlaySongs(songs);
                    });
                  }}
                  style={styles.cardPlayBtn}
                >
                  <Play size={20} fill="#fff" color="#fff" style={{ marginLeft: 2 }} />
                </button>
              </div>
              <div style={styles.cardTitle} className="truncate">{album.name}</div>
              <div style={styles.cardArtist} className="truncate">{album.artist}</div>
            </div>
          );
        })}
      </div>
    );

    return (
      <div style={styles.viewContainer}>
        {/* Welcome Banner */}
        <div style={styles.welcomeBanner}>
          <div style={styles.welcomeGradient} />
          <div style={styles.welcomeContent}>
            <span style={styles.welcomeTag}>Personalized Stream</span>
            <h1>Cerberus Music</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
              Your premium Spotify-like portal to your self-hosted collection.
            </p>
          </div>
        </div>

        {/* Made For You Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Made For You</h2>
          <div style={styles.grid}>
            <div
              onClick={() => {
                setActiveDiscoverType('discover');
                setActiveView('discover');
              }}
              style={{ ...styles.card, ...styles.discoverCard }}
              className="clickable"
            >
              <div style={styles.discoverIconBg}>
                <Sparkles size={32} color="#fff" />
              </div>
              <div style={styles.cardTitle}>Cerberus Discover</div>
              <div style={styles.cardArtist}>Similar tracks based on your favorites</div>
            </div>

            <div
              onClick={() => {
                setActiveDiscoverType('forgotten');
                setActiveView('discover');
              }}
              style={{ ...styles.card, ...styles.forgottenCard }}
              className="clickable"
            >
              <div style={styles.forgottenIconBg}>
                <RefreshCw size={32} color="#fff" />
              </div>
              <div style={styles.cardTitle}>Forgotten Favorites</div>
              <div style={styles.cardArtist}>Tracks you loved, shuffled for you</div>
            </div>

            {dailyMixes.map((mix, i) => (
              <div
                key={mix.name}
                onClick={() => {
                  setActiveDiscoverType(`mix${i}` as any);
                  setActiveView('discover');
                }}
                style={{ ...styles.card, ...styles.mixCard }}
                className="clickable"
              >
                <div style={styles.mixIconBg}>
                  <Disc size={32} color="#fff" />
                </div>
                <div style={styles.cardTitle}>{mix.name}</div>
                <div style={styles.cardArtist}>Best of {mix.genre}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended for You */}
        {recommendedAlbums.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionHeader}>Recommended For You</h2>
            {renderAlbumGrid(recommendedAlbums)}
          </section>
        )}

        {/* Recently Added */}
        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Recently Added</h2>
          {newestAlbums.length === 0 ? <p style={styles.emptyText}>No albums found</p> : renderAlbumGrid(newestAlbums)}
        </section>

        {/* Most Played */}
        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Your Heavy Rotation</h2>
          {frequentAlbums.length === 0 ? <p style={styles.emptyText}>No history yet. Start playing!</p> : renderAlbumGrid(frequentAlbums)}
        </section>

        {/* Random Selection */}
        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Random Recommendation</h2>
          {randomAlbums.length === 0 ? <p style={styles.emptyText}>No albums found</p> : renderAlbumGrid(randomAlbums)}
        </section>
      </div>
    );
  };

  // SEARCH VIEW
  const renderSearch = () => {
    return (
      <div style={styles.viewContainer}>
        {/* Search Header */}
        <div style={styles.searchBarContainer}>
          <SearchIcon size={20} color="var(--text-secondary)" style={{ marginLeft: 16 }} />
          <input
            type="text"
            placeholder="Search songs, albums, or artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            autoFocus
          />
        </div>

        {searching ? (
          <div style={styles.loaderContainer}>
            <div style={styles.spinner} className="spin" />
            <span>Searching database...</span>
          </div>
        ) : searchQuery.trim() !== '' ? (
          <div style={styles.searchResultsContainer}>
            {/* Artists */}
            {searchResults.artists.length > 0 && (
              <section style={styles.searchSection}>
                <h2 style={styles.searchSectionTitle}>Artists</h2>
                <div style={styles.artistGrid}>
                  {searchResults.artists.slice(0, 6).map(artist => (
                    <div
                      key={artist.id}
                      onClick={() => openArtist(artist.id, artist.name)}
                      style={styles.artistCard}
                      className="clickable"
                    >
                      <div style={styles.artistAvatar}>
                        <User size={32} color="var(--text-secondary)" />
                      </div>
                      <span style={styles.artistCardName} className="truncate">
                        {artist.name}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Albums */}
            {searchResults.albums.length > 0 && (
              <section style={styles.searchSection}>
                <h2 style={styles.searchSectionTitle}>Albums</h2>
                <div style={styles.grid}>
                  {searchResults.albums.slice(0, 6).map(album => {
                    const coverUrl = album._cerberusCover || subsonic.getCoverArtUrl(album.coverArt || album.id, 200);
                    return (
                      <div
                        key={album.id}
                        onClick={() => openAlbum(album.id)}
                        style={styles.card}
                        className="clickable"
                      >
                        <img
                          src={coverUrl}
                          alt={album.name}
                          style={styles.cardCover}
                          onError={async (e) => {
                            const fallback = await metadataScraper.getFallbackCoverArt(album.artist, album.name);
                            (e.target as HTMLImageElement).src = fallback || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=120&auto=format&fit=crop';
                          }}
                        />
                        <div style={styles.cardTitle} className="truncate">{album.name}</div>
                        <div style={styles.cardArtist} className="truncate">{album.artist}</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Tracks */}
            {searchResults.songs.length > 0 && (
              <section style={styles.searchSection}>
                <h2 style={styles.searchSectionTitle}>Tracks</h2>
                {renderTracksList(searchResults.songs)}
              </section>
            )}

            {searchResults.songs.length === 0 && searchResults.albums.length === 0 && searchResults.artists.length === 0 && (
              <div style={styles.emptyContainer}>
                <h3>No results found for "{searchQuery}"</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                  Check the spelling or try searching for another term.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.emptyContainer}>
            <SearchIcon size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
            <h3>Search Cerberus Music</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
              Find your favorite tracks, albums, or artists instantly.
            </p>
          </div>
        )}
      </div>
    );
  };

  // ALBUM DETAILS VIEW
  const renderAlbumDetails = () => {
    if (loadingAlbum) {
      return (
        <div style={styles.loaderContainer}>
          <div style={styles.spinner} className="spin" />
          <span>Loading album details...</span>
        </div>
      );
    }

    if (!albumDetails) return null;

    return (
      <div style={styles.detailContainer}>
        {/* Dynamic gradient background */}
        <div
          style={{
            ...styles.detailHeaderBackground,
            background: `linear-gradient(to bottom, ${albumColor} 0%, var(--bg-panel) 100%)`
          }}
        />

        {/* Back Button */}
        <button onClick={() => setActiveView('home')} style={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Header content */}
        <div style={styles.detailHeaderContent}>
          <img
            src={albumCoverUrl}
            alt={albumDetails.name}
            style={styles.detailCover}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=120&auto=format&fit=crop';
            }}
          />
          <div style={styles.detailInfo}>
            <span style={styles.detailLabel}>ALBUM</span>
            <h1 style={styles.detailTitle}>{albumDetails.name}</h1>
            <div style={styles.detailMeta}>
              <span
                onClick={() => albumDetails.artistId && openArtist(albumDetails.artistId, albumDetails.artist)}
                style={styles.detailMetaArtist}
              >
                {albumDetails.artist}
              </span>
              <span style={styles.metaDot}>•</span>
              <span>{albumDetails.songCount} songs</span>
              {albumDetails.duration && (
                <>
                  <span style={styles.metaDot}>•</span>
                  <span>{formatDuration(albumDetails.duration)}</span>
                </>
              )}
              {albumDetails.year && (
                <>
                  <span style={styles.metaDot}>•</span>
                  <span>{albumDetails.year}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={styles.actionRow}>
          <button
            onClick={() => albumTracks.length > 0 && onPlaySongs(albumTracks)}
            className="btn-primary"
            style={styles.playAllBtn}
          >
            <Play size={22} fill="#fff" color="#fff" style={{ marginRight: 6 }} />
            Play
          </button>
          <button
            onClick={() => {
              if (albumTracks.length === 0) return;
              const shuffled = [...albumTracks].sort(() => 0.5 - Math.random());
              onPlaySongs(shuffled);
            }}
            style={styles.circleActionBtn}
            title="Shuffle Play"
          >
            <Shuffle size={20} color="var(--text-primary)" />
          </button>
          <button
            onClick={() => {
              const isAlreadyStarred = starredSongs.some(s => s.albumId === albumDetails.id || s.id === albumDetails.id);
              if (isAlreadyStarred) {
                subsonic.unstar(albumDetails.id, false, false);
              } else {
                subsonic.star(albumDetails.id, false, false);
              }
              // Force trigger sidebar/header reload
              setPlaylistTrigger(p => p + 1);
            }}
            style={styles.circleActionBtn}
            title="Favorite Album"
          >
            <Heart size={20} color="var(--text-primary)" />
          </button>
        </div>

        {/* Tracks List */}
        <div style={styles.tracksSection}>
          {renderTracksList(albumTracks, true)}
        </div>
      </div>
    );
  };

  // ARTIST DETAILS VIEW
  const renderArtistDetails = () => {
    if (loadingArtist) {
      return (
        <div style={styles.loaderContainer}>
          <div style={styles.spinner} className="spin" />
          <span>Loading artist details...</span>
        </div>
      );
    }

    if (!artistDetails) return null;

    return (
      <div style={styles.detailContainer}>
        {/* Banner header */}
        <div style={{ ...styles.detailHeaderBackground, background: 'linear-gradient(to bottom, var(--color-orange-muted) 0%, var(--bg-panel) 100%)' }} />

        <button onClick={() => setActiveView('home')} style={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div style={styles.artistHeaderContent}>
          <div style={styles.artistHeaderAvatar}>
            <User size={80} color="#fff" />
          </div>
          <div>
            <span style={styles.detailLabel}>ARTIST</span>
            <h1 style={styles.artistTitle}>{artistDetails.name}</h1>
          </div>
        </div>

        {/* Discography */}
        <section style={styles.artistSection}>
          <h2 style={styles.sectionHeader}>Albums</h2>
          {artistAlbums.length === 0 ? (
            <p style={styles.emptyText}>No albums in library</p>
          ) : (
            <div style={styles.grid}>
              {artistAlbums.map(album => {
                const coverUrl = album._cerberusCover || subsonic.getCoverArtUrl(album.coverArt || album.id, 200);
                return (
                  <div
                    key={album.id}
                    onClick={() => openAlbum(album.id)}
                    style={styles.card}
                    className="clickable"
                  >
                    <img
                      src={coverUrl}
                      alt={album.name}
                      style={styles.cardCover}
                      onError={async (e) => {
                        const fallback = await metadataScraper.getFallbackCoverArt(artistDetails.name, album.name);
                        (e.target as HTMLImageElement).src = fallback || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=120&auto=format&fit=crop';
                      }}
                    />
                    <div style={styles.cardTitle} className="truncate">{album.name}</div>
                    <div style={styles.cardArtist} className="truncate">{album.year || 'Album'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Featured tracks / guest appearances */}
        {artistFeaturedTracks.length > 0 && (
          <section style={styles.artistSection}>
            <h2 style={styles.sectionHeader}>Appears On (Featured)</h2>
            {renderTracksList(artistFeaturedTracks)}
          </section>
        )}
      </div>
    );
  };

  // PLAYLIST DETAILS VIEW
  const renderPlaylistDetails = () => {
    if (loadingPlaylist) {
      return (
        <div style={styles.loaderContainer}>
          <div style={styles.spinner} className="spin" />
          <span>Loading playlist...</span>
        </div>
      );
    }

    if (!playlistDetails) return null;

    return (
      <div style={styles.detailContainer}>
        <div style={{ ...styles.detailHeaderBackground, background: 'linear-gradient(to bottom, #382c21 0%, var(--bg-panel) 100%)' }} />

        <button onClick={() => setActiveView('home')} style={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div style={styles.detailHeaderContent}>
          <div style={styles.playlistArtPlaceholder}>
            <Music size={64} color="var(--text-secondary)" />
          </div>
          <div style={styles.detailInfo}>
            <span style={styles.detailLabel}>PLAYLIST</span>
            <h1 style={styles.detailTitle}>{playlistDetails.name}</h1>
            <div style={styles.detailMeta}>
              <span>Created by {playlistDetails.owner || 'You'}</span>
              <span style={styles.metaDot}>•</span>
              <span>{playlistTracks.length} songs</span>
              {playlistDetails.duration && (
                <>
                  <span style={styles.metaDot}>•</span>
                  <span>{formatDuration(playlistDetails.duration)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actionRow}>
          <button
            onClick={() => playlistTracks.length > 0 && onPlaySongs(playlistTracks)}
            className="btn-primary"
            style={styles.playAllBtn}
          >
            <Play size={22} fill="#fff" color="#fff" style={{ marginRight: 6 }} />
            Play
          </button>
          
          <button
            onClick={() => setShowIdentifyWizard(true)}
            style={{ ...styles.playAllBtn, background: 'rgba(255,255,255,0.1)' }}
            className="btn-secondary"
            title="Identify as Album"
          >
            <Wand2 size={18} color="#fff" style={{ marginRight: 6 }} />
            Identify
          </button>

          <button
            onClick={deletePlaylist}
            style={styles.circleActionBtn}
            title="Delete Playlist"
          >
            <Trash2 size={20} color="var(--text-primary)" />
          </button>
        </div>

        {/* Tracks List */}
        <div style={styles.tracksSection}>
          {playlistTracks.length === 0 ? (
            <div style={styles.emptyContainer}>
              <Music size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
              <h3>This playlist is empty</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                Use search or browse albums to add tracks to this playlist!
              </p>
            </div>
          ) : (
            renderTracksList(playlistTracks, false, true)
          )}
        </div>
      </div>
    );
  };

  // RECOMMENDATIONS / DISCOVER VIEW
  const renderDiscover = () => {
    // Determine which tracks to show
    let title = 'Cerberus Discover';
    let tracks = discoverTracks;
    let subtitle = 'Fresh picks recommended based on your listening habits';

    if (activeDiscoverType === 'forgotten') {
      title = 'Forgotten Favorites';
      tracks = forgottenTracks;
      subtitle = 'Tracks you loved but haven\'t played in a while';
    } else if (activeDiscoverType?.startsWith('mix')) {
      const idx = parseInt(activeDiscoverType.replace('mix', ''));
      const mix = dailyMixes[idx];
      if (mix) {
        title = mix.name;
        tracks = mix.tracks;
        subtitle = `Custom mix featuring the best of ${mix.genre}`;
      }
    }

    if (loadingDiscover) {
      return (
        <div style={styles.loaderContainer}>
          <div style={styles.spinner} className="spin" />
          <span>Generating custom mixes...</span>
        </div>
      );
    }

    return (
      <div style={styles.detailContainer}>
        <div style={{ ...styles.detailHeaderBackground, background: 'linear-gradient(to bottom, var(--color-orange-muted) 0%, var(--bg-panel) 100%)' }} />

        {/* Selector Header */}
        <div style={styles.discoverSelectHeader}>
          <button
            onClick={() => setActiveDiscoverType('discover')}
            style={{
              ...styles.discoverSelectTab,
              ...(activeDiscoverType === 'discover' || !activeDiscoverType ? styles.activeDiscoverTab : {})
            }}
          >
            Cerberus Discover
          </button>
          <button
            onClick={() => setActiveDiscoverType('forgotten')}
            style={{
              ...styles.discoverSelectTab,
              ...(activeDiscoverType === 'forgotten' ? styles.activeDiscoverTab : {})
            }}
          >
            Forgotten Favorites
          </button>
          {dailyMixes.map((mix, i) => (
            <button
              key={mix.name}
              onClick={() => setActiveDiscoverType(`mix${i}` as any)}
              style={{
                ...styles.discoverSelectTab,
                ...(activeDiscoverType === `mix${i}` ? styles.activeDiscoverTab : {})
              }}
            >
              Mix: {mix.genre}
            </button>
          ))}
        </div>

        <div style={styles.detailHeaderContent}>
          <div style={{
            ...styles.discoverArtPlaceholder,
            backgroundColor: activeDiscoverType === 'forgotten' ? '#7f1d1d' : 'var(--color-orange)'
          }}>
            {activeDiscoverType === 'forgotten' ? (
              <RefreshCw size={64} color="var(--text-primary)" />
            ) : (
              <Sparkles size={64} color="var(--text-primary)" />
            )}
          </div>
          <div style={styles.detailInfo}>
            <span style={styles.detailLabel}>MADE FOR YOU</span>
            <h1 style={styles.detailTitle}>{title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>{subtitle}</p>
            <div style={{ ...styles.detailMeta, marginTop: '12px' }}>
              <span>{tracks.length} tracks</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={styles.actionRow}>
          <button
            onClick={() => tracks.length > 0 && onPlaySongs(tracks)}
            className="btn-primary"
            style={styles.playAllBtn}
          >
            <Play size={22} fill="#fff" color="#fff" style={{ marginRight: 6 }} />
            Play
          </button>
          <button
            onClick={() => buildRecommendations(true)}
            style={styles.circleActionBtn}
            title="Refresh Recommendations"
          >
            <RefreshCw size={20} color="var(--text-primary)" />
          </button>
        </div>

        {/* Tracks List */}
        <div style={styles.tracksSection}>
          {tracks.length === 0 ? (
            <div style={styles.emptyContainer}>
              <Sparkles size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
              <h3>Generating recommendations...</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                Make sure you star/play some songs first, so we can learn your taste!
              </p>
            </div>
          ) : (
            renderTracksList(tracks)
          )}
        </div>
      </div>
    );
  };

  // LIBRARY / STARRED VIEW
  const renderStarred = () => {
    return (
      <div style={styles.detailContainer}>
        <div style={{ ...styles.detailHeaderBackground, background: 'linear-gradient(to bottom, #451a03 0%, var(--bg-panel) 100%)' }} />

        <div style={styles.detailHeaderContent}>
          <div style={styles.starredArtPlaceholder}>
            <Heart size={64} fill="#fff" color="#fff" />
          </div>
          <div style={styles.detailInfo}>
            <span style={styles.detailLabel}>PLAYLIST</span>
            <h1 style={styles.detailTitle}>Liked Songs</h1>
            <div style={styles.detailMeta}>
              <span>{starredSongs.length} songs</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={styles.actionRow}>
          <button
            onClick={() => starredSongs.length > 0 && onPlaySongs(starredSongs)}
            className="btn-primary"
            style={styles.playAllBtn}
          >
            <Play size={22} fill="#fff" color="#fff" style={{ marginRight: 6 }} />
            Play
          </button>
        </div>

        {/* Tracks List */}
        <div style={styles.tracksSection}>
          {starredSongs.length === 0 ? (
            <div style={styles.emptyContainer}>
              <Heart size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
              <h3>Your liked songs will appear here</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                Click the heart icon on any song to save it to your Library.
              </p>
            </div>
          ) : (
            renderTracksList(starredSongs)
          )}
        </div>
      </div>
    );
  };

  // BROWSE ALL VIEW
  const renderBrowseAll = () => {
    if (loadingAll) {
      return (
        <div style={styles.loaderContainer}>
          <div style={styles.spinner} className="spin" />
          <span>Loading catalog...</span>
        </div>
      );
    }

    return (
      <div style={styles.detailContainer}>
        <div style={{ ...styles.detailHeaderBackground, background: 'linear-gradient(to bottom, #1e3a8a 0%, var(--bg-panel) 100%)' }} />

        <div style={styles.detailHeaderContent}>
          <div style={{ ...styles.discoverArtPlaceholder, backgroundColor: '#1e40af' }}>
            <ListMusic size={64} color="#fff" />
          </div>
          <div style={styles.detailInfo}>
            <span style={styles.detailLabel}>LIBRARY</span>
            <h1 style={styles.detailTitle}>All Albums</h1>
            <div style={styles.detailMeta}>
              <span>{allAlbums.length} albums</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 28px 28px 28px' }}>
          {allAlbums.length === 0 ? (
            <p style={styles.emptyText}>No albums found in library.</p>
          ) : (
            <div style={styles.grid}>
              {allAlbums.map(album => {
                const coverUrl = album._cerberusCover || subsonic.getCoverArtUrl(album.coverArt || album.id, 200);
                return (
                  <div
                    key={album.id}
                    onClick={() => openAlbum(album.id)}
                    style={styles.card}
                    className="clickable"
                  >
                    <img
                      src={coverUrl}
                      alt={album.name}
                      style={styles.cardCover}
                      onError={async (e) => {
                        const fallback = await metadataScraper.getFallbackCoverArt(album.artist, album.name);
                        (e.target as HTMLImageElement).src = fallback || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=120&auto=format&fit=crop';
                      }}
                    />
                    <div style={styles.cardTitle} className="truncate">{album.name}</div>
                    <div style={styles.cardArtist} className="truncate">{album.artist}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // COMMON TRACK LIST RENDERER
  const renderTracksList = (tracks: any[], showAlbumColumn = true, isPlaylistView = false) => {
    return (
      <table style={styles.trackTable}>
        <thead>
          <tr style={styles.tableHeaderRow}>
            <th style={styles.thNum}>#</th>
            <th style={styles.thTitle}>Title</th>
            {showAlbumColumn && <th style={styles.thAlbum}>Album</th>}
            <th style={styles.thActions}></th>
            <th style={styles.thDuration}>
              <Clock size={16} />
            </th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, index) => {
            const isSongStarred = starredSongs.some(s => s.id === track.id);
            const { primary, featured } = metadataScraper.parseArtists(track.artist);
            
            return (
              <tr key={`${track.id}-${index}`} style={styles.trackRow} className="track-row-hover">
                {/* Play number */}
                <td
                  onClick={() => onPlaySongs(tracks, index)}
                  style={styles.tdNum}
                  className="clickable"
                >
                  <span className="row-number">{index + 1}</span>
                  <Play size={12} fill="var(--color-orange)" color="var(--color-orange)" className="row-play-icon" style={{ display: 'none' }} />
                </td>

                {/* Title and Artist */}
                <td style={styles.tdTitle}>
                  <div style={styles.trackTitleContainer}>
                    <div style={styles.songNameText} className="truncate" title={track.title}>{track.title}</div>
                    <div style={styles.artistSubtext} className="truncate">
                      <span
                        onClick={() => track.artistId && openArtist(track.artistId, primary)}
                        style={styles.artistSubtextLink}
                      >
                        {primary}
                      </span>
                      {featured.map(feat => (
                        <span key={feat}>
                          <span>, </span>
                          <span
                            onClick={() => openArtist('', feat)}
                            style={styles.artistSubtextLink}
                          >
                            {feat}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </td>

                {/* Album link */}
                {showAlbumColumn && (
                  <td style={styles.tdAlbum}>
                    <span
                      onClick={() => track.albumId && openAlbum(track.albumId)}
                      style={styles.albumLink}
                      className="truncate"
                    >
                      {track.album}
                    </span>
                  </td>
                )}

                {/* Actions (Add to Playlist, Star) */}
                <td style={styles.tdActions}>
                  <div style={styles.actionsContainer}>
                    <button
                      onClick={() => toggleStarSong(track)}
                      style={styles.rowStarBtn}
                      title={isSongStarred ? "Unlike" : "Like"}
                    >
                      <Heart
                        size={16}
                        fill={isSongStarred ? "var(--color-orange)" : "none"}
                        color={isSongStarred ? "var(--color-orange)" : "var(--text-secondary)"}
                      />
                    </button>

                    {/* Add to Playlist button */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddToPlaylistMenu(showAddToPlaylistMenu === track.id ? null : track.id);
                        }}
                        style={styles.rowStarBtn}
                        title="Add to Playlist"
                      >
                        <Plus size={16} />
                      </button>

                      {showAddToPlaylistMenu === track.id && (
                        <div style={styles.playlistDropdown}>
                          <div style={styles.dropdownTitle}>Add to Playlist</div>
                          {playlistsList.length === 0 ? (
                            <div style={styles.dropdownItemEmpty}>No playlists found</div>
                          ) : (
                            playlistsList.map(playlist => (
                              <div
                                key={playlist.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addTrackToPlaylist(playlist.id, track.id);
                                }}
                                style={styles.dropdownItem}
                              >
                                {playlist.name}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {isPlaylistView && (
                      <button
                        onClick={() => removeTrackFromPlaylist(index)}
                        style={styles.rowStarBtn}
                        title="Remove from Playlist"
                      >
                        <Trash2 size={16} color="var(--text-secondary)" />
                      </button>
                    )}
                  </div>
                </td>

                {/* Duration */}
                <td style={styles.tdDuration}>
                  {formatDuration(track.duration)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // Switch Render
  const renderViewContent = () => {
    switch (activeView) {
      case 'home':
        return renderHome();
      case 'search':
        return renderSearch();
      case 'album':
        return renderAlbumDetails();
      case 'artist':
        return renderArtistDetails();
      case 'playlist':
        return renderPlaylistDetails();
      case 'discover':
        return renderDiscover();
      case 'starred':
        return renderStarred();
      case 'all':
        return renderBrowseAll();
      default:
        return renderHome();
    }
  };

  return (
    <main style={styles.mainContent}>
      {/* Inject custom hover style tags since React inline styles don't support pseudo selectors */}
      <style dangerouslySetInnerHTML={{ __html: `
        .track-row-hover:hover {
          background-color: var(--bg-hover) !important;
        }
        .track-row-hover:hover .row-number {
          display: none !important;
        }
        .track-row-hover:hover .row-play-icon {
          display: block !important;
        }
      ` }} />
      {renderViewContent()}

      {/* Identify Wizard Modal */}
      {showIdentifyWizard && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{ marginBottom: 16 }}>Identify as Album</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
              Convert this playlist into an album by providing its metadata. It will appear in your catalog and home page recommendations.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.inputLabel}>Album Name</label>
              <input
                type="text"
                placeholder={playlistDetails?.name || "e.g. Discovery"}
                value={wizardAlbumName}
                onChange={e => setWizardAlbumName(e.target.value)}
                style={styles.modalInput}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.inputLabel}>Artist Name</label>
              <input
                type="text"
                placeholder="e.g. Daft Punk"
                value={wizardArtistName}
                onChange={e => setWizardArtistName(e.target.value)}
                style={styles.modalInput}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={styles.inputLabel}>Cover Art URL (Optional)</label>
              <input
                type="text"
                placeholder="e.g. https://i.imgur.com/..."
                value={wizardCoverUrl}
                onChange={e => setWizardCoverUrl(e.target.value)}
                style={styles.modalInput}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowIdentifyWizard(false)}
                style={styles.modalCancelBtn}
                disabled={wizardSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!wizardAlbumName || !wizardArtistName) return;
                  setWizardSubmitting(true);
                  try {
                    const jsonPayload = JSON.stringify({
                      type: 'album',
                      album: wizardAlbumName,
                      artist: wizardArtistName,
                      coverArt: wizardCoverUrl || null
                    });
                    const comment = `[CERBERUS_ALBUM] ${jsonPayload}`;
                    await subsonic.updatePlaylist(playlistDetails.id, [], [], comment);
                    setShowIdentifyWizard(false);
                    // Force refresh by triggering activeView update
                    setPlaylistTrigger(Date.now());
                    setActiveView('all');
                  } catch (err) {
                    console.error('Failed to identify playlist', err);
                  } finally {
                    setWizardSubmitting(false);
                  }
                }}
                style={{
                  ...styles.modalSubmitBtn,
                  opacity: (!wizardAlbumName || !wizardArtistName || wizardSubmitting) ? 0.5 : 1
                }}
                disabled={!wizardAlbumName || !wizardArtistName || wizardSubmitting}
              >
                {wizardSubmitting ? 'Saving...' : 'Save & Convert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

const styles: Record<string, React.CSSProperties> = {
  mainContent: {
    flex: 1,
    height: '100%',
    backgroundColor: 'var(--bg-panel)',
    borderRadius: '8px',
    overflowY: 'auto',
    border: '1px solid var(--border-color)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '16px',
    color: 'var(--text-secondary)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '4px solid var(--border-color)',
    borderTopColor: 'var(--color-orange)',
  },
  viewContainer: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  welcomeBanner: {
    position: 'relative',
    borderRadius: '12px',
    padding: '48px 32px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-md)',
  },
  welcomeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, var(--color-orange-muted) 0%, var(--bg-sidebar) 100%)',
    zIndex: 1,
  },
  welcomeContent: {
    position: 'relative',
    zIndex: 2,
  },
  welcomeTag: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--color-orange)',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionHeader: {
    fontSize: '1.35rem',
    fontWeight: 800,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'var(--bg-sidebar)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid var(--border-color)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  cardCoverContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1',
    marginBottom: '12px',
  },
  cardCover: {
    width: '100%',
    height: '100%',
    borderRadius: '6px',
    objectFit: 'cover',
    boxShadow: 'var(--shadow-sm)',
  },
  cardPlayBtn: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-orange)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: 0,
    transform: 'translateY(8px)',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--shadow-md)',
  },
  cardTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  cardArtist: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  discoverCard: {
    background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
    border: 'none',
  },
  discoverIconBg: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '16px',
  },
  forgottenCard: {
    background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
    border: 'none',
  },
  forgottenIconBg: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '16px',
  },
  mixCard: {
    background: 'linear-gradient(135deg, #1b3f27 0%, #064e3b 100%)',
    border: 'none',
  },
  mixIconBg: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '16px',
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  },
  searchBarContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-sidebar)',
    border: '1px solid var(--border-color)',
    borderRadius: '500px',
    height: '48px',
    width: '100%',
    maxWidth: '420px',
    marginTop: '28px',
    marginLeft: '28px',
  },
  searchInput: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    width: '100%',
    padding: '0 16px',
  },
  searchResultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    padding: '0 28px 28px 28px',
  },
  searchSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  searchSectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  artistGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '16px',
  },
  artistCard: {
    backgroundColor: 'var(--bg-sidebar)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
  },
  artistAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-panel)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  artistCardName: {
    fontSize: '0.85rem',
    fontWeight: 700,
    width: '100%',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '64px 32px',
  },
  detailContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    padding: '28px',
    minHeight: '100%',
  },
  detailHeaderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '340px',
    zIndex: 1,
  },
  backBtn: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(0,0,0,0.3)',
    border: 'none',
    color: 'var(--text-primary)',
    padding: '8px 16px',
    borderRadius: '500px',
    cursor: 'pointer',
    width: 'fit-content',
    fontWeight: 700,
    fontSize: '0.85rem',
    marginBottom: '24px',
  },
  detailHeaderContent: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'flex-end',
    gap: '24px',
    flexWrap: 'wrap',
  },
  detailCover: {
    width: '190px',
    height: '190px',
    borderRadius: '8px',
    objectFit: 'cover',
    boxShadow: 'var(--shadow-lg)',
  },
  playlistArtPlaceholder: {
    width: '190px',
    height: '190px',
    borderRadius: '8px',
    backgroundColor: '#3730a3',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'var(--shadow-lg)',
  },
  starredArtPlaceholder: {
    width: '190px',
    height: '190px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #451a03 0%, var(--color-orange) 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'var(--shadow-lg)',
  },
  discoverArtPlaceholder: {
    width: '190px',
    height: '190px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'var(--shadow-lg)',
  },
  detailInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  detailLabel: {
    fontSize: '0.75rem',
    fontWeight: 800,
    letterSpacing: '1px',
    color: 'var(--text-primary)',
  },
  detailTitle: {
    fontSize: '2.5rem',
    fontWeight: 800,
    lineHeight: '1.1',
    margin: '6px 0 12px 0',
  },
  detailMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  detailMetaArtist: {
    color: 'var(--text-primary)',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  metaDot: {
    color: 'var(--text-muted)',
  },
  actionRow: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '28px 0',
  },
  playAllBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 32px',
    fontSize: '1rem',
  },
  circleActionBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tracksSection: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
  },
  trackTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderRow: {
    borderBottom: '1px solid var(--border-color)',
    height: '36px',
  },
  thNum: {
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.85rem',
    width: '40px',
    textAlign: 'center',
  },
  thTitle: {
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  thAlbum: {
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  thActions: {
    width: '90px',
  },
  thDuration: {
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.85rem',
    width: '60px',
    textAlign: 'right',
    paddingRight: '12px',
  },
  trackRow: {
    borderBottom: '1px solid transparent',
    height: '56px',
    borderRadius: '6px',
    transition: 'background-color 0.15s ease',
  },
  tdNum: {
    textAlign: 'center',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  tdTitle: {
    fontSize: '0.92rem',
  },
  trackTitleContainer: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  songNameText: {
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  artistSubtext: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    marginTop: '2px',
  },
  artistSubtextLink: {
    cursor: 'pointer',
  },
  tdAlbum: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  albumLink: {
    cursor: 'pointer',
  },
  tdActions: {
    textAlign: 'right',
  },
  actionsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  rowStarBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  tdDuration: {
    textAlign: 'right',
    paddingRight: '12px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  artistHeaderContent: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginTop: '12px',
  },
  artistHeaderAvatar: {
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-orange-muted)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'var(--shadow-lg)',
  },
  artistTitle: {
    fontSize: '3.5rem',
    fontWeight: 800,
  },
  artistSection: {
    position: 'relative',
    zIndex: 2,
    marginTop: '36px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  discoverSelectHeader: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
    marginBottom: '24px',
  },
  discoverSelectTab: {
    background: 'none',
    border: 'none',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.15s ease',
  },
  activeDiscoverTab: {
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--color-orange)',
  },
  playlistDropdown: {
    position: 'absolute',
    top: '32px',
    right: 0,
    backgroundColor: 'var(--bg-sidebar)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    width: '180px',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 150,
    padding: '8px 0',
    textAlign: 'left',
  },
  dropdownTitle: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    padding: '4px 12px 8px 12px',
    borderBottom: '1px solid var(--border-color)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  dropdownItem: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  dropdownItemEmpty: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    padding: '8px 12px',
    fontStyle: 'italic',
  },
};
// Add CSS rules for playlist hover and play button visibility
