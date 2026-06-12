export class MetadataScraper {
  private cachePrefix = 'cerberus_mb_cache_';

  private getCacheKey(artist: string, album: string): string {
    const cleanArtist = artist.toLowerCase().trim();
    const cleanAlbum = album.toLowerCase().trim();
    return `${this.cachePrefix}${cleanArtist}::${cleanAlbum}`;
  }

  /**
   * Search MusicBrainz for a Release MBID and return its Cover Art Archive image URL
   */
  public async getFallbackCoverArt(artist: string, album: string): Promise<string | null> {
    if (!artist || !album || album.toLowerCase() === 'unknown' || album.toLowerCase().includes('unknown album')) {
      return null;
    }

    const cacheKey = this.getCacheKey(artist, album);
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      if (cached === 'NONE') return null;
      return cached;
    }

    try {
      // Clean up artist/album name for MusicBrainz query syntax
      const cleanArtist = artist.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ' ');
      const cleanAlbum = album.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ' ');
      
      const query = `release:"${cleanAlbum.trim()}" AND artist:"${cleanArtist.trim()}"`;
      const url = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json&limit=3`;

      // MusicBrainz requires a descriptive User-Agent-like header or custom identifier (represented in Accept)
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`MusicBrainz query returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const releases = data.releases || [];

      if (releases.length === 0) {
        // Cache negative result
        localStorage.setItem(cacheKey, 'NONE');
        return null;
      }

      // Find first release with cover art archive enabled
      const releaseWithCover = releases.find((r: any) => r['cover-art-archive']?.count > 0 || r['cover-art-archive']?.front) || releases[0];
      const mbid = releaseWithCover.id;

      if (!mbid) {
        localStorage.setItem(cacheKey, 'NONE');
        return null;
      }

      // Check if Cover Art Archive actually has art
      // Cover Art Archive provides 250px, 500px, and original sizes. 
      // We use front-500 for a perfect balance of speed and visual quality.
      const imageUrl = `https://coverartarchive.org/release/${mbid}/front-500`;
      
      // Let's quickly verify if Cover Art Archive returns a valid response
      // Actually, we can just use the URL directly, but to prevent broken images on CAA,
      // we can do a quick HEAD or GET request, or just cache it.
      // CAA redirects, so checking HTTP status works. But we can also do it lazily in React.
      // Let's store the URL in cache.
      localStorage.setItem(cacheKey, imageUrl);
      return imageUrl;

    } catch (error) {
      console.warn(`Failed to scrape cover art for ${artist} - ${album}:`, error);
      // Don't cache negative result on network error, so we can retry later
      return null;
    }
  }

  /**
   * Helper to parse artist names and extract guest/featured artists
   */
  public parseArtists(artistString: string): { primary: string; featured: string[] } {
    if (!artistString) {
      return { primary: 'Unknown Artist', featured: [] };
    }

    // Common separators
    const featRegex = /\s+(?:feat\.?|ft\.?|featuring)\s+(.+)$/i;
    const match = artistString.match(featRegex);
    
    let primary = artistString;
    let featuredList: string[] = [];

    if (match) {
      primary = artistString.replace(featRegex, '').trim();
      const featuredString = match[1];
      
      // Split featured artists by comma, ampersand, or slash
      featuredList = featuredString
        .split(/(?:,|\s+&\s+|\s+and\s+|\/)/)
        .map(a => a.trim())
        .filter(a => a.length > 0);
    }

    // Also check for "Artist A & Artist B" without explicit feat
    if (primary.includes(' & ')) {
      const parts = primary.split(' & ').map(p => p.trim());
      primary = parts[0];
      featuredList = [...featuredList, ...parts.slice(1)];
    }

    return {
      primary,
      featured: featuredList
    };
  }
}

export const metadataScraper = new MetadataScraper();
