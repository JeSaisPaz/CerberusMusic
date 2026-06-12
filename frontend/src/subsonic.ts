import * as jsMd5 from 'js-md5';
const md5 = (
  typeof jsMd5 === 'function'
    ? jsMd5
    : (jsMd5 as any).default || (jsMd5 as any).md5 || jsMd5
) as (message: string) => string;

export interface SubsonicCredentials {
  url: string;
  username: string;
  token: string;
  salt: string;
}

export class SubsonicClient {
  private url: string = '';
  private username: string = '';
  private passwordClearText: string = ''; // Keep password to generate new salt/token if needed
  private token: string = '';
  private salt: string = '';
  private clientName: string = 'CerberusMusic';
  private apiVersion: string = '1.16.1';

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials() {
    const saved = localStorage.getItem('cerberus_credentials');
    if (saved) {
      try {
        const creds = JSON.parse(saved);
        this.url = creds.url || '';
        this.username = creds.username || '';
        // If we saved salt/token directly
        this.token = creds.token || '';
        this.salt = creds.salt || '';
        this.passwordClearText = creds.password || '';
        
        // If we have password, regenerate a fresh salt/token for security
        if (this.passwordClearText) {
          this.generateAuth(this.passwordClearText);
        }
      } catch (e) {
        console.error('Failed to parse saved credentials', e);
      }
    }
  }

  public saveCredentials(url: string, username: string, passwordClearText: string) {
    this.url = url.replace(/\/$/, ''); // Remove trailing slash
    this.username = username;
    this.passwordClearText = passwordClearText;
    this.generateAuth(passwordClearText);

    localStorage.setItem('cerberus_credentials', JSON.stringify({
      url: this.url,
      username: this.username,
      password: this.passwordClearText, // Stored to regenerate salts dynamically
      token: this.token,
      salt: this.salt
    }));
  }

  public clearCredentials() {
    this.url = '';
    this.username = '';
    this.passwordClearText = '';
    this.token = '';
    this.salt = '';
    localStorage.removeItem('cerberus_credentials');
  }

  private generateAuth(password: string) {
    // Generate a random salt
    this.salt = Math.random().toString(36).substring(2, 12);
    // Token is md5(password + salt)
    this.token = md5(password + this.salt);
  }

  public isAuthenticated(): boolean {
    return !!(this.url && this.username && this.token);
  }

  public getBaseUrl(): string {
    return this.url;
  }

  /**
   * Helper to build a complete Subsonic API request URL
   */
  public buildUrl(endpoint: string, params: Record<string, string> = {}): string {
    // If client credentials are not initialized yet, we can't make queries
    if (!this.url) return '';
    
    // Regenerate auth dynamically if we have password to ensure fresh salt is used frequently
    if (this.passwordClearText) {
      this.generateAuth(this.passwordClearText);
    }

    const queryParams = new URLSearchParams({
      u: this.username,
      t: this.token,
      s: this.salt,
      v: this.apiVersion,
      c: this.clientName,
      f: 'json',
      ...params
    });

    return `${this.url}/rest/${endpoint}?${queryParams.toString()}`;
  }

  /**
   * Generic fetch wrapper that calls the Subsonic API and returns JSON
   */
  private async request<T = any>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    if (!url) {
      throw new Error('Client is not configured.');
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      
      // Subsonic API wraps all responses in 'subsonic-response'
      const subsonicResponse = data['subsonic-response'];
      if (!subsonicResponse) {
        throw new Error('Invalid Subsonic API response format');
      }

      if (subsonicResponse.status === 'failed') {
        const error = subsonicResponse.error || { code: 0, message: 'Unknown Subsonic API Error' };
        throw new Error(`API Error ${error.code}: ${error.message}`);
      }

      return subsonicResponse;
    } catch (err: any) {
      console.error(`Subsonic API request failed [${endpoint}]:`, err);
      throw err;
    }
  }

  // --- Core API Methods ---

  public async ping(): Promise<boolean> {
    try {
      const res = await this.request('ping.view');
      return res.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Get album list. Type can be: 'newest', 'random', 'frequent', 'recent' (recently played)
   */
  public async getAlbumList(type: 'newest' | 'random' | 'frequent' | 'recent', size: number = 20, offset: number = 0): Promise<any[]> {
    const res = await this.request('getAlbumList2.view', {
      type,
      size: size.toString(),
      offset: offset.toString()
    });
    return res.albumList2?.album || [];
  }

  public async getAlbum(id: string): Promise<any> {
    const res = await this.request('getAlbum.view', { id });
    return res.album || null;
  }

  public async getArtist(id: string): Promise<any> {
    const res = await this.request('getArtist.view', { id });
    return res.artist || null;
  }

  public async getArtists(): Promise<any[]> {
    const res = await this.request('getArtists.view');
    // Subsonic returns artists grouped by index letter
    const indexes = res.artists?.index || [];
    const artists: any[] = [];
    for (const index of indexes) {
      if (index.artist) {
        artists.push(...(Array.isArray(index.artist) ? index.artist : [index.artist]));
      }
    }
    return artists;
  }

  public async getGenres(): Promise<any[]> {
    const res = await this.request('getGenres.view');
    return res.genres?.genre || [];
  }

  public async getStarred(): Promise<{ songs: any[], albums: any[], artists: any[] }> {
    const res = await this.request('getStarred2.view');
    return {
      songs: res.starred2?.song || [],
      albums: res.starred2?.album || [],
      artists: res.starred2?.artist || []
    };
  }

  public async star(id: string, isSong: boolean = true, isArtist: boolean = false): Promise<void> {
    const params: Record<string, string> = {};
    if (isSong) params.id = id;
    else if (isArtist) params.artistId = id;
    else params.albumId = id;
    
    await this.request('star.view', params);
  }

  public async unstar(id: string, isSong: boolean = true, isArtist: boolean = false): Promise<void> {
    const params: Record<string, string> = {};
    if (isSong) params.id = id;
    else if (isArtist) params.artistId = id;
    else params.albumId = id;

    await this.request('unstar.view', params);
  }

  public async search(query: string): Promise<{ songs: any[], albums: any[], artists: any[] }> {
    const res = await this.request('search3.view', { query, songCount: '40', albumCount: '20', artistCount: '20' });
    return {
      songs: res.searchResult3?.song || [],
      albums: res.searchResult3?.album || [],
      artists: res.searchResult3?.artist || []
    };
  }

  public async getPlaylists(): Promise<any[]> {
    const res = await this.request('getPlaylists.view');
    return res.playlists?.playlist || [];
  }

  public async getPlaylist(id: string): Promise<any> {
    const res = await this.request('getPlaylist.view', { id });
    return res.playlist || null;
  }

  public async createPlaylist(name: string, songIds: string[]): Promise<any> {
    const params: Record<string, string> = { name };
    const res = await this.request('createPlaylist.view', params);
    const playlist = res.playlist || null;
    
    if (playlist && songIds.length > 0) {
      await this.updatePlaylist(playlist.id, songIds, []);
    }
    return playlist;
  }

  public async deletePlaylist(id: string): Promise<void> {
    await this.request('deletePlaylist.view', { id });
  }

  public async updatePlaylist(id: string, songIdsToAdd: string[], songIdsToRemoveIndexes: number[]): Promise<void> {
    const params: Record<string, string> = { playlistId: id };
    
    // Subsonic supports adding songs one-by-one or multiple.
    // Let's call them.
    for (const songId of songIdsToAdd) {
      await this.request('updatePlaylist.view', { ...params, songIdToAdd: songId });
    }
    
    // To remove, Subsonic uses 'songIndexToRemove'
    // Sort descending to avoid index shifting problems
    const sortedToRemove = [...songIdsToRemoveIndexes].sort((a, b) => b - a);
    for (const index of sortedToRemove) {
      await this.request('updatePlaylist.view', { ...params, songIndexToRemove: index.toString() });
    }
  }

  // --- Advanced Spotify-like Helpers ---

  /**
   * Get dynamic stream URL for audio source
   */
  public getStreamUrl(id: string): string {
    return this.buildUrl('stream.view', { id });
  }

  /**
   * Get cover art image URL
   */
  public getCoverArtUrl(id: string, size: number = 300): string {
    return this.buildUrl('getCoverArt.view', { id, size: size.toString() });
  }

  /**
   * Scrobble track.
   * Call once with submission=false when starting playback (tells server to mark "now playing")
   * Call once with submission=true at >50% playback (tells server to scrobble and increment play count)
   */
  public async scrobble(id: string, submission: boolean = true): Promise<void> {
    await this.request('scrobble.view', {
      id,
      submission: submission.toString(),
      time: Date.now().toString()
    });
  }

  /**
   * Get lyrics for a track.
   * Navidrome supports getLyrics by artist & title.
   */
  public async getLyrics(artist: string, title: string): Promise<string> {
    try {
      const res = await this.request('getLyrics.view', { artist, title });
      // Returns structured lyrics object
      return res.lyrics?.value || res.lyrics || '';
    } catch {
      return '';
    }
  }

  /**
   * Get similar tracks to compile a "song radio"
   */
  public async getSimilarSongs(songId: string, count: number = 20): Promise<any[]> {
    try {
      const res = await this.request('getSimilarSongs2.view', {
        id: songId,
        count: count.toString()
      });
      return res.similarSongs2?.song || [];
    } catch {
      // Fallback: If similarity fails, fetch random tracks
      try {
        const res = await this.request('getRandomSongs.view', { size: count.toString() });
        return res.randomSongs?.song || [];
      } catch {
        return [];
      }
    }
  }
}

// Singleton instance
export const subsonic = new SubsonicClient();
