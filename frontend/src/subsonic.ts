// Pure TypeScript MD5 implementation to eliminate any CJS/ESM bundler import issues

function md5(string: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function bitRotateLeft(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }

  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function binlMD5(x: number[], len: number): number[] {
    x[len >> 5] |= 0x80 << len % 32;
    x[(((len + 64) >>> 9) << 4) + 14] = len;

    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;

    for (let i = 0; i < x.length; i += 16) {
      const olda = a;
      const oldb = b;
      const oldc = c;
      const oldd = d;

      a = md5ff(a, b, c, d, x[i], 7, -680876936);
      d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);

      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);

      a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
      d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = md5hh(d, a, b, c, x[i], 11, -358537222);
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);

      a = md5ii(a, b, c, d, x[i], 6, -198630844);
      d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);

      a = safeAdd(a, olda);
      b = safeAdd(b, oldb);
      c = safeAdd(c, oldc);
      d = safeAdd(d, oldd);
    }
    return [a, b, c, d];
  }

  function binl2rstr(input: number[]): string {
    let output = '';
    const length32 = input.length * 32;
    for (let i = 0; i < length32; i += 8) {
      output += String.fromCharCode((input[i >> 5] >>> i % 32) & 0xff);
    }
    return output;
  }

  function rstr2binl(input: string): number[] {
    const output: number[] = [];
    output[(input.length >> 2) - 1] = undefined as any;
    for (let i = 0; i < output.length; i += 1) {
      output[i] = 0;
    }
    const length8 = input.length * 8;
    for (let i = 0; i < length8; i += 8) {
      output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << i % 32;
    }
    return output;
  }

  function rstrMD5(s: string): string {
    return binl2rstr(binlMD5(rstr2binl(s), s.length * 8));
  }

  function rstr2hex(input: string): string {
    const hexTab = '0123456789abcdef';
    let output = '';
    for (let i = 0; i < input.length; i += 1) {
      const x = input.charCodeAt(i);
      output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f);
    }
    return output;
  }

  function str2rstrUTF8(input: string): string {
    return unescape(encodeURIComponent(input));
  }

  function rawMD5(s: string): string {
    return rstrMD5(str2rstrUTF8(s));
  }

  return rstr2hex(rawMD5(string));
}

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
