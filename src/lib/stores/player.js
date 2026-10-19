import { writable, derived } from 'svelte/store';
import { invoke, isTauri } from '../tauri/core-proxy.js';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { calculateProgress } from '../utils/playerStats.js';
import { logUiAction } from '../utils/uiActionLogger.js';
import { rememberWindowBoundsRelativeToGame, restoreWindowBounds } from './windowState.js';

// Player state
export const isPlaying = writable(false);
export const isPaused = writable(false);
export const currentPosition = writable(0);
export const totalDuration = writable(0);
export const currentFile = writable(null);
export const loopMode = writable(false);
export const shuffleMode = writable(false);

// Note calculation mode (default: Python/YueLyn)
export const noteMode = writable("Python");

// Key mode (21 or 36 keys)
export const keyMode = writable("Keys21");

// Modifier delay for sharps/flats in 36-key mode (ms)
export const modifierDelay = writable(2);

// Octave shift (-2 to +2)
export const octaveShift = writable(0);

// Playback speed (0.25 to 2.0, default 1.0)
export const speed = writable(1.0);

// Track selection for solo play (null = all tracks)
export const availableTracks = writable([]); // [{ id, name, note_count, channel }]
export const selectedTrackId = writable(null); // null = all, number = specific track

// Playlist state
export const midiFiles = writable([]);
export const isLoadingMidi = writable(false);
export const isImportingFiles = writable(false);
export const midiLoadProgress = writable({ loaded: 0, total: 0 });
export const totalMidiCount = writable(0); // Total files in album folder
export const hasMoreFiles = writable(false); // Whether there are more files to load
export const playlist = writable([]);

// Playback Context state (Spotify-like context: library, playlist, favorites)
export const playbackContext = writable({
  source: 'library',
  name: 'Library',
  id: null,
  tracks: [],
  index: -1,
});

// Shuffled sequence for current context
export const shuffleIndices = writable([]);
export const shufflePosition = writable(0);

// Trigger to smoothly scroll to and highlight a track in whichever list is active
export const scrollToTrackTrigger = writable(null); // { path: string, timestamp: number }

// Library play mode - play directly from library without queue
export const libraryPlayMode = writable(false);
export const libraryPlayIndex = writable(-1); // Current index in filtered library
export const libraryPlayShuffle = writable(false);
export const libraryShuffleOrder = writable([]); // Shuffled indices for shuffle mode

// Large library threshold - show warning above this
const LARGE_LIBRARY_THRESHOLD = 5000;
const LOAD_BATCH_SIZE = 2000;
export const currentIndex = writable(0);
export const libraryScrollTop = writable(0);
export const queueScrollTop = writable(0);
export const librarySortBy = writable("date-desc");

// Multiple playlists support
export const savedPlaylists = writable([]);
export const activePlaylistId = writable(null);

// Favorites
export const favorites = writable([]);

// UI state
export const isDraggable = writable(true);
export const isMinimized = writable(false);
export const miniMode = writable(false);
export const smartPause = writable(false);

// Keybinding recording mode (prevents App.svelte from handling keys)
export const recordingKeybind = writable(false);

// ============ Live MIDI Input State ============
export const midiInputDevices = writable([]);
export const selectedMidiDevice = writable(null);
export const selectedMidiDeviceIndex = writable(null); // Persisted device selection
export const isLiveModeActive = writable(false);
export const isDevVirtualConnected = writable(false); // DEV virtual MIDI keyboard connection state
export const midiConnectionState = writable('NoDevices'); // NoDevices, DevicesAvailable, Connecting, Connected, Listening, Disconnected, Error
export const liveTranspose = writable(0);
export const lastLiveNote = writable(null); // { midiNote, key, noteName, velocity }

// Toggle mini mode with window resize
export async function toggleMiniMode() {
  const currentMiniMode = get(miniMode);
  const appWindow = getCurrentWindow();

  if (!currentMiniMode) {
    // Entering mini mode - save current state and resize
    try {
      await rememberWindowBoundsRelativeToGame();

      // Set to mini size (64x88 for the floating icon + drag handle)
      await appWindow.setMinSize(new LogicalSize(64, 88));
      await appWindow.setSize(new LogicalSize(64, 88));
    } catch (error) {
      console.error('Failed to resize window for mini mode:', error);
    }
  } else {
    // Exiting mini mode - restore previous state
    try {
      await appWindow.setMinSize(new LogicalSize(960, 540));
      await restoreWindowBounds({ width: 1180, height: 620 });
    } catch (error) {
      console.error('Failed to restore window from mini mode:', error);
    }
  }

  miniMode.update(v => !v);
}

let smartPauseCooldownUntil = 0;

// LocalStorage keys
const STORAGE_KEYS = {
  FAVORITES: 'wwm-favorites',
  PLAYLISTS: 'wwm-playlists',
  ACTIVE_PLAYLIST: 'wwm-active-playlist',
  NOTE_MODE: 'wwm-note-mode',
  KEY_MODE: 'wwm-key-mode',
  MODIFIER_DELAY: 'wwm-modifier-delay',
  SPEED: 'wwm-speed',
  STATS: 'wwm-stats'
};

// Stats store
export const stats = writable({
  totalPlaytime: 0,
  songsPlayed: 0,
  sessionsCount: 0,
  mostPlayed: {},
  lastPlayed: null,
  firstUsed: null,
});

// Track song play
export function trackSongPlay(filename) {
  stats.update(s => {
    s.songsPlayed++;
    s.lastPlayed = new Date().toISOString();
    s.mostPlayed[filename] = (s.mostPlayed[filename] || 0) + 1;
    if (!s.firstUsed) s.firstUsed = new Date().toISOString();
    saveStats(s);
    return s;
  });
}

// Add playtime
export function addPlaytime(seconds) {
  stats.update(s => {
    s.totalPlaytime += seconds;
    saveStats(s);
    return s;
  });
}

// Increment session
export function incrementSession() {
  stats.update(s => {
    s.sessionsCount++;
    if (!s.firstUsed) s.firstUsed = new Date().toISOString();
    saveStats(s);
    return s;
  });
}

function saveStats(s) {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(s));
  } catch (e) {
    console.error('Failed to save stats:', e);
  }
}

function loadStats() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STATS);
    if (stored) {
      stats.set(JSON.parse(stored));
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

// Initialize storage - load from files with localStorage fallback
export async function initializeStorage() {
  // Load stats first
  loadStats();
  incrementSession();

  try {
    // Load favorites from file, fallback to localStorage
    try {
      const fileFavorites = await invoke('load_favorites');
      if (Array.isArray(fileFavorites) && fileFavorites.length > 0) {
        favorites.set(fileFavorites);
      } else {
        // Fallback to localStorage (for migration)
        const storedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
        if (storedFavorites) {
          const parsed = JSON.parse(storedFavorites);
          favorites.set(parsed);
          // Migrate to file
          await invoke('save_favorites', { favorites: parsed });
          localStorage.removeItem(STORAGE_KEYS.FAVORITES);
        }
      }
    } catch (e) {
      console.warn('Failed to load favorites from file, using localStorage:', e);
      const storedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (storedFavorites) {
        favorites.set(JSON.parse(storedFavorites));
      }
    }

    // Load playlists from file, fallback to localStorage
    try {
      const filePlaylists = await invoke('load_playlists');
      if (Array.isArray(filePlaylists) && filePlaylists.length > 0) {
        savedPlaylists.set(filePlaylists);
      } else {
        // Fallback to localStorage (for migration)
        const storedPlaylists = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
        if (storedPlaylists) {
          const parsed = JSON.parse(storedPlaylists);
          savedPlaylists.set(parsed);
          // Migrate to file
          await invoke('save_playlists', { playlists: parsed });
          localStorage.removeItem(STORAGE_KEYS.PLAYLISTS);
        }
      }
    } catch (e) {
      console.warn('Failed to load playlists from file, using localStorage:', e);
      const storedPlaylists = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (storedPlaylists) {
        savedPlaylists.set(JSON.parse(storedPlaylists));
      }
    }

    const storedActivePlaylist = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAYLIST);
    if (storedActivePlaylist) {
      activePlaylistId.set(storedActivePlaylist);
    }

    // Sync favorites and playlists with current library (hydrate paths from hashes)
    // This is needed because midiFiles may have loaded before storage was initialized
    const currentFiles = get(midiFiles);
    if (currentFiles.length > 0) {
      syncFavoritesWithLibrary(currentFiles);
      syncPlaylistsWithLibrary(currentFiles);
    }

    // Load note mode from localStorage and sync with backend
    const storedNoteMode = localStorage.getItem(STORAGE_KEYS.NOTE_MODE);
    if (storedNoteMode) {
      noteMode.set(storedNoteMode);
      // Sync with backend
      await invoke('set_note_mode', { mode: storedNoteMode });
    }

    // Load key mode from localStorage and sync with backend
    const storedKeyMode = localStorage.getItem(STORAGE_KEYS.KEY_MODE);
    if (storedKeyMode) {
      keyMode.set(storedKeyMode);
      // Sync with backend
      await invoke('set_key_mode', { mode: storedKeyMode });
    }

    // Load modifier delay from localStorage and sync with backend
    const storedModifierDelay = localStorage.getItem(STORAGE_KEYS.MODIFIER_DELAY);
    if (storedModifierDelay) {
      const delay = parseInt(storedModifierDelay, 10);
      modifierDelay.set(delay);
      // Sync with backend
      await invoke('set_modifier_delay', { delay_ms: delay });
    }

    // Load speed from localStorage and sync with backend
    const storedSpeed = localStorage.getItem(STORAGE_KEYS.SPEED);
    if (storedSpeed) {
      const spd = parseFloat(storedSpeed);
      speed.set(spd);
      // Sync with backend
      await invoke('set_speed', { speed: spd });
    }
  } catch (error) {
    console.error('Failed to load from storage:', error);
  }
}

// Strip path from file data (path is hydrated from midiFiles on load)
function stripPath(file) {
  const { path, ...rest } = file;
  return rest;
}

// Save favorites to file with localStorage fallback (without paths)
async function saveFavorites(favs) {
  const stripped = favs.map(stripPath);
  try {
    await invoke('save_favorites', { favorites: stripped });
  } catch (error) {
    console.error('Failed to save favorites to file, using localStorage:', error);
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(stripped));
    } catch (e) {
      console.error('Failed to save favorites to localStorage:', e);
    }
  }
}

// Save playlists to file with localStorage fallback (without paths)
async function savePlaylists(lists) {
  const stripped = lists.map(playlist => ({
    ...playlist,
    tracks: playlist.tracks.map(stripPath)
  }));
  try {
    await invoke('save_playlists', { playlists: stripped });
  } catch (error) {
    console.error('Failed to save playlists to file, using localStorage:', error);
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(stripped));
    } catch (e) {
      console.error('Failed to save playlists to localStorage:', e);
    }
  }
}

// Favorites operations (uses hash for identification, survives renames)
export function toggleFavorite(file) {
  favorites.update(favs => {
    const exists = favs.find(f => f.hash === file.hash);
    let newFavs;
    if (exists) {
      newFavs = favs.filter(f => f.hash !== file.hash);
    } else {
      newFavs = [...favs, file];
    }
    saveFavorites(newFavs);
    return newFavs;
  });
}

export function isFavorite(hash) {
  let result = false;
  favorites.subscribe(favs => {
    result = favs.some(f => f.hash === hash);
  })();
  return result;
}

// Sync favorites with current midiFiles (hydrate paths only)
// Note: Does NOT save - only updates in-memory state
// Does NOT remove or replace favorites - only adds path property
export function syncFavoritesWithLibrary(files) {
  const filesByHash = new Map(files.map(f => [f.hash, f]));
  const filesByName = new Map(files.map(f => [f.name, f])); // Fallback by name
  favorites.update(favs => {
    if (favs.length === 0) return favs;
    return favs.map(fav => {
      // Try hash match first
      let matched = filesByHash.get(fav.hash);
      // Fallback to name match
      if (!matched && fav.name) {
        matched = filesByName.get(fav.name);
      }
      // Only ADD path to existing favorite, don't replace anything else
      if (matched && matched.path) {
        return { ...fav, path: matched.path };
      }
      return fav; // Keep favorite exactly as-is if no match
    });
  });
}

// Remove a file from favorites and playlists when deleted
// This is called when a file is explicitly deleted (not during sync)
export function removeDeletedFile(hash) {
  // Remove from favorites
  favorites.update(favs => {
    const newFavs = favs.filter(f => f.hash !== hash);
    if (newFavs.length !== favs.length) {
      saveFavorites(newFavs);
    }
    return newFavs;
  });

  // Remove from all playlists
  savedPlaylists.update(lists => {
    let changed = false;
    const newLists = lists.map(p => {
      const newTracks = p.tracks.filter(t => t.hash !== hash);
      if (newTracks.length !== p.tracks.length) {
        changed = true;
        return { ...p, tracks: newTracks };
      }
      return p;
    });
    if (changed) {
      savePlaylists(newLists);
    }
    return newLists;
  });
}

// Clear all favorites
export function clearAllFavorites() {
  favorites.set([]);
  saveFavorites([]);
}

// Reorder favorites (from drag-drop)
export function reorderFavorites(newOrder) {
  favorites.set(newOrder);
  saveFavorites(newOrder);
}

// Playlist operations
export function createPlaylist(name) {
  const id = Date.now().toString();
  const newPlaylist = {
    id,
    name,
    tracks: [],
    createdAt: new Date().toISOString()
  };

  savedPlaylists.update(lists => {
    const newLists = [...lists, newPlaylist];
    savePlaylists(newLists);
    return newLists;
  });

  return id;
}

export function deletePlaylist(id) {
  savedPlaylists.update(lists => {
    const newLists = lists.filter(p => p.id !== id);
    savePlaylists(newLists);
    return newLists;
  });

  // If active playlist was deleted, clear it
  const currentActive = get(activePlaylistId);
  if (currentActive === id) {
    activePlaylistId.set(null);
  }
}

export function renamePlaylist(id, newName) {
  savedPlaylists.update(lists => {
    const newLists = lists.map(p =>
      p.id === id ? { ...p, name: newName } : p
    );
    savePlaylists(newLists);
    return newLists;
  });
}

export function addToSavedPlaylist(playlistId, file) {
  savedPlaylists.update(lists => {
    const newLists = lists.map(p => {
      if (p.id === playlistId) {
        // Check for duplicate by hash
        if (!p.tracks.find(t => t.hash === file.hash)) {
          return { ...p, tracks: [...p.tracks, file] };
        }
      }
      return p;
    });
    savePlaylists(newLists);
    return newLists;
  });
}

// Add multiple files to playlist at once (single save - avoids race condition)
export function addManyToSavedPlaylist(playlistId, files) {
  savedPlaylists.update(lists => {
    const newLists = lists.map(p => {
      if (p.id === playlistId) {
        // Filter out duplicates by hash
        const existingHashes = new Set(p.tracks.map(t => t.hash));
        const newTracks = files.filter(f => !existingHashes.has(f.hash));
        if (newTracks.length > 0) {
          return { ...p, tracks: [...p.tracks, ...newTracks] };
        }
      }
      return p;
    });
    savePlaylists(newLists);
    return newLists;
  });
}

export function removeFromSavedPlaylist(playlistId, fileHash) {
  savedPlaylists.update(lists => {
    const newLists = lists.map(p => {
      if (p.id === playlistId) {
        return { ...p, tracks: p.tracks.filter(t => t.hash !== fileHash) };
      }
      return p;
    });
    savePlaylists(newLists);
    return newLists;
  });
}

// Sync playlists with current midiFiles (hydrate paths only)
// Note: Does NOT save - only updates in-memory state
// Does NOT remove or replace tracks - only adds path property
export function syncPlaylistsWithLibrary(files) {
  const filesByHash = new Map(files.map(f => [f.hash, f]));
  const filesByName = new Map(files.map(f => [f.name, f])); // Fallback by name
  savedPlaylists.update(lists => {
    if (lists.length === 0) return lists;
    return lists.map(p => ({
      ...p,
      tracks: p.tracks.map(t => {
        // Try hash match first
        let matched = filesByHash.get(t.hash);
        // Fallback to name match
        if (!matched && t.name) {
          matched = filesByName.get(t.name);
        }
        // Only ADD path to existing track, don't replace anything else
        if (matched && matched.path) {
          return { ...t, path: matched.path };
        }
        return t; // Keep track exactly as-is if no match
      })
    }));
  });
}

export function reorderSavedPlaylist(playlistId, fromIndex, toIndex) {
  savedPlaylists.update(lists => {
    const newLists = lists.map(p => {
      if (p.id === playlistId) {
        const tracks = [...p.tracks];
        const [item] = tracks.splice(fromIndex, 1);
        tracks.splice(toIndex, 0, item);
        return { ...p, tracks };
      }
      return p;
    });
    savePlaylists(newLists);
    return newLists;
  });
}

// Set playlist tracks (for drag-drop reordering)
export function setPlaylistTracks(playlistId, newTracks) {
  savedPlaylists.update(lists => {
    const newLists = lists.map(p => {
      if (p.id === playlistId) {
        return { ...p, tracks: newTracks };
      }
      return p;
    });
    savePlaylists(newLists);
    return newLists;
  });
}

export function reorderPlaylists(fromIndex, toIndex) {
  savedPlaylists.update(lists => {
    const newLists = [...lists];
    const [item] = newLists.splice(fromIndex, 1);
    newLists.splice(toIndex, 0, item);
    savePlaylists(newLists);
    return newLists;
  });
}

// Set playlists order (for drag-drop reordering)
export function setPlaylistsOrder(newOrder) {
  savedPlaylists.set(newOrder);
  savePlaylists(newOrder);
}

export async function loadPlaylistToQueue(playlistId, autoPlay = true) {
  const lists = get(savedPlaylists);
  const targetPlaylist = lists.find(p => p.id === playlistId);
  if (targetPlaylist && targetPlaylist.tracks.length > 0) {
    activePlaylistId.set(playlistId);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAYLIST, playlistId);

    if (autoPlay) {
      await playFromContext({
        source: 'playlist',
        id: playlistId,
        name: targetPlaylist.name,
        tracks: targetPlaylist.tracks,
        index: 0,
        shuffle: get(shuffleMode),
      });
    }
  }
}

// Derived states
export const progress = derived(
  [currentPosition, totalDuration],
  ([$position, $duration]) => calculateProgress($position, $duration)
);

export { formatTime } from '../utils/playerStats.js';

// Check library size and cache status
export async function getLibraryInfo() {
  if (!isTauri) {
    return { total_files: 0, cached_files: 0, is_mostly_cached: true };
  }
  try {
    const info = await invoke('get_library_info');
    if (!info) return { total_files: 0, cached_files: 0, is_mostly_cached: true };
    totalMidiCount.set(info.total_files);
    return info;
  } catch (error) {
    console.error('Failed to get library info:', error);
    return { total_files: 0, cached_files: 0, is_mostly_cached: true };
  }
}

// Check if library needs warning (large AND not cached)
export async function shouldShowLibraryWarning() {
  const info = await getLibraryInfo();
  const isLarge = info.total_files > LARGE_LIBRARY_THRESHOLD;
  // Only warn if large AND files aren't cached (first time load will be slow)
  const needsWarning = isLarge && !info.is_mostly_cached;
  return {
    needsWarning,
    isLarge,
    count: info.total_files,
    cachedCount: info.cached_files,
    isCached: info.is_mostly_cached
  };
}

// Load MIDI files from album folder (streaming for large libraries)
// limit: max files to load (0 = all), append: whether to append to existing
export async function loadMidiFiles(limit = 0, append = false) {
  const actionContext = { limit, append };
  logUiAction('loadMidiFiles', 'started', actionContext);
  try {
    isLoadingMidi.set(true);
    midiLoadProgress.set({ loaded: 0, total: 0 });

    // Get current files if appending
    let existingFiles = [];
    let offset = 0;
    if (append) {
      midiFiles.subscribe(files => {
        existingFiles = files;
        offset = files.length;
      })();
    } else {
      // Clear existing files before loading
      midiFiles.set([]);
    }

    // Collect files in memory to avoid frequent store updates (which cause lag)
    let collectedFiles = [];

    // Set up progress listener - returns a promise that resolves when done
    await new Promise(async (resolve) => {
      if (!isTauri) {
        resolve();
        return;
      }
      const unlisten = await listen('midi-load-progress', (event) => {
        const { loaded, total, files: newFiles, done } = event.payload;

        // Update progress counter (this is cheap)
        midiLoadProgress.set({ loaded, total });

        // Collect files in memory (don't update store yet - that causes lag)
        if (newFiles && newFiles.length > 0) {
          collectedFiles.push(...newFiles);
        }

        // Done loading - now update store ONCE with all files
        if (done) {
          // Single store update with all collected files
          if (append) {
            midiFiles.set([...existingFiles, ...collectedFiles]);
          } else {
            midiFiles.set(collectedFiles);
          }

          isLoadingMidi.set(false);

          // Sync favorites and playlists with final file list
          midiFiles.subscribe(files => {
            syncFavoritesWithLibrary(files);
            syncPlaylistsWithLibrary(files);
          })();

          // Check if there are more files
          midiFiles.subscribe(loadedFiles => {
            totalMidiCount.subscribe(total => {
              hasMoreFiles.set(loadedFiles.length < total);
            })();
          })();

          // Clean up and resolve
          logUiAction('loadMidiFiles', 'completed', {
            ...actionContext,
            loaded: collectedFiles.length
          });
          unlisten();
          resolve();
        }
      });

      // Start streaming load with offset and limit
      await invoke('load_midi_files_streaming', {
        offset: offset > 0 ? offset : null,
        limit: limit > 0 ? limit : null
      });

      // Set a timeout in case no events come (e.g., empty folder)
      setTimeout(() => {
        // If timed out but we have files, still set them
        if (collectedFiles.length > 0) {
          if (append) {
            midiFiles.set([...existingFiles, ...collectedFiles]);
          } else {
            midiFiles.set(collectedFiles);
          }
        }
        isLoadingMidi.set(false);
        unlisten();
        resolve();
      }, 120000); // 2 minute timeout for very large libraries
    });
  } catch (error) {
    console.error('Failed to load MIDI files:', error);
    logUiAction('loadMidiFiles', 'error', {
      ...actionContext,
      error: error?.message || error
    });
    isLoadingMidi.set(false);
  }
}

// Load more files (pagination)
export async function loadMoreFiles() {
  await loadMidiFiles(LOAD_BATCH_SIZE, true);
}

// Load initial batch for large libraries
export async function loadInitialBatch() {
  await loadMidiFiles(LOAD_BATCH_SIZE, false);
}

// Load all remaining files
export async function loadAllFiles() {
  await loadMidiFiles(0, true);
}

// Import a MIDI file to album folder
export async function importMidiFile(sourcePath) {
  const actionContext = { sourcePath };
  logUiAction('importMidiFile', 'started', actionContext);
  try {
    const newFile = await invoke('import_midi_file', { sourcePath });
    // Add to midiFiles store
    midiFiles.update(files => [...files, newFile]);
    logUiAction('importMidiFile', 'completed', {
      ...actionContext,
      file: newFile?.path || newFile?.name || null
    });
    return { success: true, file: newFile };
  } catch (error) {
    console.error('Failed to import MIDI file:', error);
    logUiAction('importMidiFile', 'error', {
      ...actionContext,
      error: error?.message || error
    });
    return { success: false, error: error.toString() };
  }
}

// Load available tracks for a MIDI file
export async function loadTracksForFile(path) {
  if (!path) {
    logUiAction('loadTracksForFile', 'warn', { reason: 'missing_path' });
    availableTracks.set([]);
    return [];
  }
  const actionContext = { path };
  logUiAction('loadTracksForFile', 'started', actionContext);
  try {
    const tracks = await invoke('get_midi_tracks', { path });
    availableTracks.set(tracks);
    logUiAction('loadTracksForFile', 'completed', actionContext);
    return tracks;
  } catch (error) {
    console.error('Failed to load tracks:', error);
    logUiAction('loadTracksForFile', 'error', {
      ...actionContext,
      error: error?.message || error
    });
    availableTracks.set([]);
    return [];
  }
}

// Set selected track for solo play (live update during playback)
export async function setSelectedTrack(trackId) {
  selectedTrackId.set(trackId);

  // Update filter live in backend - takes effect immediately on next note
  await invoke('set_track_filter', { trackId });
}

// Store for tracking missing files (by hash)
export const missingFiles = writable(new Set());

// Play a MIDI file
export async function playMidi(path, options = {}) {
  const actionContext = { path };
  logUiAction('playMidi', 'started', actionContext);
  try {
    delaySmartPause();

    // If no path provided, file is missing
    if (!path) {
      throw new Error('FILE_MISSING');
    }

    // Reset track selection when playing a different song
    const $currentFile = get(currentFile);
    if (path !== $currentFile) {
      selectedTrackId.set(null);
      await invoke('set_track_filter', { trackId: null });
    }

    // Reset state immediately before playing
    currentPosition.set(0);
    isPlaying.set(false);
    isPaused.set(false);

    // Play - the backend will use the already-set track filter
    await invoke('play_midi', { path });

    // Small delay to let backend initialize
    await new Promise(resolve => setTimeout(resolve, 50));

    // Focus is now handled in the backend after playback starts
    await refreshPlaybackState();
    isPlaying.set(true);
    isPaused.set(false);
    currentFile.set(path);

    // Update currentIndex to match the playing file's position in playlist
    const $playlist = get(playlist);
    const playingIndex = $playlist.findIndex(f => f.path === path);
    if (playingIndex !== -1) {
      currentIndex.set(playingIndex);
    }

    // Also update context index if applicable (only if not an interrupting queued track)
    if (!options.isQueueTrack) {
      const ctx = get(playbackContext);
      if (ctx && ctx.tracks && ctx.tracks.length > 0) {
        const ctxIdx = ctx.tracks.findIndex(t => t.path === path);
        if (ctxIdx !== -1) {
          playbackContext.update(c => ({ ...c, index: ctxIdx }));
          libraryPlayIndex.set(ctxIdx);
        }
      }
    }

    // Track stats
    const filename = path.split(/[\\/]/).pop() || path;
    trackSongPlay(filename);
    logUiAction('playMidi', 'completed', actionContext);
  } catch (error) {
    console.error('Failed to play MIDI:', error);
    logUiAction('playMidi', 'error', {
      ...actionContext,
      error: error?.message || error
    });
  }
}

// Play a MIDI file for band mode with split/track options
export async function playMidiBand(file, options = {}) {
  const path = typeof file === 'string' ? file : file.path;
  const { mode = 'split', slot = 0, totalPlayers = 1, trackId = null } = options;
  const actionContext = { path, mode, slot, totalPlayers, trackId };
  logUiAction('playMidiBand', 'started', actionContext);
  try {
    delaySmartPause();

    // Reset state immediately before playing
    currentPosition.set(0);
    isPlaying.set(false);
    isPaused.set(false);

    await invoke('play_midi_band', {
      path,
      mode,
      slot,
      totalPlayers,
      trackId
    });

    // Small delay to let backend initialize
    await new Promise(resolve => setTimeout(resolve, 50));

    await refreshPlaybackState();
    isPlaying.set(true);
    isPaused.set(false);
    currentFile.set(path);

    // Track stats
    const filename = path.split(/[\\/]/).pop() || path;
    trackSongPlay(filename);
    logUiAction('playMidiBand', 'completed', actionContext);
  } catch (error) {
    console.error('Failed to play MIDI in band mode:', error);
    logUiAction('playMidiBand', 'error', {
      ...actionContext,
      error: error?.message || error
    });
  }
}

// Pause/Resume playback
let lastPauseResumeTime = 0;
export async function pauseResume() {
  // Local debounce for UI-triggered calls
  const now = Date.now();
  if (now - lastPauseResumeTime < 150) return;
  lastPauseResumeTime = now;

  try {
    const status = await invoke('get_playback_status');

    // If not playing at all, try to start playing
    if (!status.is_playing) {
      const $currentFile = get(currentFile);
      if ($currentFile) {
        await playMidi($currentFile);
      } else {
        const $playlist = get(playlist);
        if ($playlist.length > 0) {
          await playMidi($playlist[0].path);
        } else {
          const ctx = get(playbackContext);
          if (ctx && ctx.tracks && ctx.tracks.length > 0) {
            const idx = ctx.index >= 0 ? ctx.index : 0;
            await playMidi(ctx.tracks[idx].path);
          }
        }
      }
      return;
    }

    // Otherwise standard toggle
    const state = await invoke('pause_resume');
    isPaused.set(state.is_paused);
    isPlaying.set(state.is_playing);
    currentPosition.set(state.current_position);
    totalDuration.set(state.total_duration);
    if (!state.is_paused) {
      await focusGameWindow();
      delaySmartPause();
    }
  } catch (error) {
    console.error('Failed to pause/resume:', error);
  }
}

// Stop playback
export async function stopPlayback() {
  try {
    delaySmartPause();
    await invoke('stop_playback');
    isPlaying.set(false);
    isPaused.set(false);
    currentPosition.set(0);
    currentFile.set(null);
    // Exit library play mode when stopped
    exitLibraryPlayMode();
  } catch (error) {
    console.error('Failed to stop playback:', error);
  }
}

// Toggle loop mode
export async function toggleLoop() {
  const newLoopMode = !get(loopMode);
  loopMode.set(newLoopMode);

  // Backend should not freeze-loop a single track so that playlist progression / repeat works smoothly
  try {
    await invoke('set_loop_mode', { enabled: false });
    delaySmartPause();
  } catch (error) {
    console.error('Failed to set loop mode:', error);
  }
}

// Toggle shuffle mode
export function toggleShuffle() {
  const newShuffle = !get(shuffleMode);
  shuffleMode.set(newShuffle);

  const ctx = get(playbackContext);
  if (newShuffle) {
    if (ctx && ctx.tracks && ctx.tracks.length > 0) {
      const curIdx = ctx.index >= 0 ? ctx.index : 0;
      const shuffled = generateShuffleIndices(ctx.tracks.length, curIdx);
      shuffleIndices.set(shuffled);
      shufflePosition.set(0);
      libraryShuffleOrder.set(shuffled);
      libraryPlayShuffle.set(true);
    }
  } else {
    shuffleIndices.set([]);
    shufflePosition.set(0);
    libraryShuffleOrder.set([]);
    libraryPlayShuffle.set(false);
  }
}

// Seek to a specific position (in seconds)
export async function seekTo(position) {
  try {
    const duration = get(totalDuration);
    const clamped = Math.max(0, Math.min(position, duration));
    currentPosition.set(clamped);
    await invoke('seek', { position: clamped });
    delaySmartPause();
  } catch (error) {
    console.error('Failed to seek:', error);
  }
}

// Set note calculation mode (Default or Detailed)
export async function setNoteMode(mode) {
  try {
    await invoke('set_note_mode', { mode });
    noteMode.set(mode);
    localStorage.setItem(STORAGE_KEYS.NOTE_MODE, mode);
    console.log(`Note mode set to: ${mode}`);
    // Sync to band members if host
    const { broadcastSettings } = await import('./band.js');
    broadcastSettings();
  } catch (error) {
    console.error('Failed to set note mode:', error);
  }
}

// Set octave shift (-2 to +2)
export async function setOctaveShift(shift) {
  try {
    const clamped = Math.max(-2, Math.min(2, shift));
    await invoke('set_octave_shift', { shift: clamped });
    octaveShift.set(clamped);
    console.log(`Octave shift set to: ${clamped}`);
    // Sync to band members if host
    const { broadcastSettings } = await import('./band.js');
    broadcastSettings();
  } catch (error) {
    console.error('Failed to set octave shift:', error);
  }
}

// Set key mode (Keys21 or Keys36)
export async function setKeyMode(mode) {
  try {
    await invoke('set_key_mode', { mode });
    keyMode.set(mode);
    localStorage.setItem(STORAGE_KEYS.KEY_MODE, mode);
    console.log(`Key mode set to: ${mode}`);
    // Sync to band members if host
    const { broadcastSettings } = await import('./band.js');
    broadcastSettings();
  } catch (error) {
    console.error('Failed to set key mode:', error);
  }
}

// Set modifier delay for sharps/flats (ms)
export async function setModifierDelay(delayMs) {
  const clamped = Math.max(0, Math.min(50, delayMs));
  // Update store immediately for responsive UI
  modifierDelay.set(clamped);
  localStorage.setItem(STORAGE_KEYS.MODIFIER_DELAY, clamped.toString());
  try {
    await invoke('set_modifier_delay', { delay_ms: clamped });
    console.log(`Modifier delay set to: ${clamped}ms`);
  } catch (error) {
    console.error('Failed to set modifier delay:', error);
  }
}

// Set playback speed (0.25 to 2.0)
export async function setSpeed(newSpeed) {
  const clamped = Math.max(0.25, Math.min(2.0, newSpeed));
  // Update store immediately for responsive UI
  speed.set(clamped);
  localStorage.setItem(STORAGE_KEYS.SPEED, clamped.toString());
  try {
    await invoke('set_speed', { speed: clamped });
    console.log(`Speed set to: ${clamped}x`);
    // Sync to band members if host
    const { broadcastSettings } = await import('./band.js');
    broadcastSettings();
  } catch (error) {
    console.error('Failed to set speed:', error);
  }
}

// Test all 21 keys
export async function testAllKeys() {
  try {
    await invoke('test_all_keys');
    console.log('21-key test complete');
  } catch (error) {
    console.error('Failed to test all keys:', error);
  }
}

// Test all 36 keys (including modifiers)
export async function testAllKeys36() {
  try {
    await invoke('test_all_keys_36');
    console.log('36-key test complete');
  } catch (error) {
    console.error('Failed to test 36 keys:', error);
  }
}

// ============ Spotify-Style Context & Playback Functions ============

// Generate a non-repeating Fisher-Yates shuffled list of track indices
export function generateShuffleIndices(length, currentIdx = -1) {
  if (length <= 0) return [];
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  // Move current track to front so it won't repeat until end of cycle
  if (currentIdx >= 0 && currentIdx < length) {
    const pos = indices.indexOf(currentIdx);
    if (pos > -1) {
      indices.splice(pos, 1);
      indices.unshift(currentIdx);
    }
  }
  return indices;
}

// Play a track within a specified Context (Library, Saved Playlist, Favorites)
export async function playFromContext({
  source = 'library',
  name = '',
  id = null,
  tracks = [],
  index = 0,
  file = null,
  shuffle = null,
} = {}) {
  if (!tracks || tracks.length === 0) return;

  // Determine starting index
  let targetIndex = index;
  if (file) {
    const foundIdx = tracks.findIndex(t => t.path === file.path || t.hash === file.hash);
    if (foundIdx !== -1) targetIndex = foundIdx;
  }

  const isShuffle = shuffle !== null ? shuffle : get(shuffleMode);
  if (shuffle !== null) {
    shuffleMode.set(shuffle);
  }

  if (targetIndex < 0 || targetIndex >= tracks.length) {
    targetIndex = isShuffle && tracks.length > 1 ? Math.floor(Math.random() * tracks.length) : 0;
  }

  // Update playback context
  playbackContext.set({
    source,
    name: name || (source === 'library' ? 'Library' : source),
    id,
    tracks,
    index: targetIndex,
  });

  // Keep legacy libraryPlayMode stores in sync for any dependent views
  libraryPlayMode.set(source === 'library');
  libraryPlayIndex.set(targetIndex);
  libraryPlayShuffle.set(isShuffle);

  if (isShuffle) {
    const shuffled = generateShuffleIndices(tracks.length, targetIndex);
    shuffleIndices.set(shuffled);
    shufflePosition.set(0);
    libraryShuffleOrder.set(shuffled);
  } else {
    shuffleIndices.set([]);
    shufflePosition.set(0);
    libraryShuffleOrder.set([]);
  }

  const trackToPlay = tracks[targetIndex];
  if (trackToPlay && trackToPlay.path) {
    currentPosition.set(0);
    totalDuration.set(0);
    await playMidi(trackToPlay.path);
  }
}

// Start playing from library (compat wrapper for playFromContext)
export async function playAllLibrary(files, startIndex = 0, shuffle = false) {
  let idx = startIndex;
  if (shuffle && files && files.length > 1) {
    idx = Math.floor(Math.random() * files.length);
  }
  await playFromContext({
    source: 'library',
    name: 'Library',
    tracks: files,
    index: idx,
    shuffle,
  });
}

// Exit library play mode
export function exitLibraryPlayMode() {
  libraryPlayMode.set(false);
  libraryPlayIndex.set(-1);
  libraryShuffleOrder.set([]);
}

// Play next track (User Queue takes priority, then active Context)
export async function playNext() {
  // 1. Priority: User Queue (Hàng chờ do người dùng thêm vào qua Add to Queue)
  const $userQueue = get(playlist);
  if ($userQueue.length > 0) {
    const nextQueuedTrack = $userQueue[0];
    // Remove the played track from queue
    playlist.update(q => q.slice(1));
    currentPosition.set(0);
    totalDuration.set(0);
    await playMidi(nextQueuedTrack.path, { isQueueTrack: true });
    return;
  }

  // 2. Play next in active Context
  const ctx = get(playbackContext);
  if (!ctx || !ctx.tracks || ctx.tracks.length === 0) {
    const files = get(midiFiles);
    if (files.length > 0) {
      await playFromContext({ source: 'library', tracks: files, index: 0 });
    } else {
      isPlaying.set(false);
      currentPosition.set(0);
    }
    return;
  }

  const $shuffle = get(shuffleMode);
  const $loop = get(loopMode);
  let nextTrackIndex = -1;

  if ($shuffle) {
    let $shuffleOrder = get(shuffleIndices);
    let $pos = get(shufflePosition) + 1;

    if (!$shuffleOrder || $shuffleOrder.length !== ctx.tracks.length) {
      $shuffleOrder = generateShuffleIndices(ctx.tracks.length, ctx.index);
      shuffleIndices.set($shuffleOrder);
      $pos = 1;
    }

    if ($pos < $shuffleOrder.length) {
      shufflePosition.set($pos);
      nextTrackIndex = $shuffleOrder[$pos];
    } else if ($loop) {
      // Loop: Reshuffle and start from beginning
      const newShuffled = generateShuffleIndices(ctx.tracks.length, -1);
      shuffleIndices.set(newShuffled);
      shufflePosition.set(0);
      nextTrackIndex = newShuffled[0];
    } else {
      // End of shuffled playlist - stop playback
      isPlaying.set(false);
      currentPosition.set(0);
      return;
    }
  } else {
    // Normal sequential progression
    let nextIdx = ctx.index + 1;
    if (nextIdx < ctx.tracks.length) {
      nextTrackIndex = nextIdx;
    } else if ($loop) {
      // Loop enabled: wrap to beginning
      nextTrackIndex = 0;
    } else {
      // End of playlist: STOP (Do NOT loop back to track 1!)
      isPlaying.set(false);
      currentPosition.set(0);
      return;
    }
  }

  if (nextTrackIndex >= 0 && ctx.tracks[nextTrackIndex]) {
    playbackContext.update(c => ({ ...c, index: nextTrackIndex }));
    libraryPlayIndex.set(nextTrackIndex);
    currentPosition.set(0);
    totalDuration.set(0);
    await playMidi(ctx.tracks[nextTrackIndex].path);
  }
}

// Play previous track
export async function playPrevious() {
  const curPos = get(currentPosition);
  // If track has been playing for more than 3 seconds, restart current track (Spotify standard)
  if (curPos > 3) {
    await seekTo(0);
    return;
  }

  const ctx = get(playbackContext);
  if (!ctx || !ctx.tracks || ctx.tracks.length === 0) return;

  const $shuffle = get(shuffleMode);
  const $loop = get(loopMode);
  let prevTrackIndex = -1;

  if ($shuffle) {
    let $pos = get(shufflePosition) - 1;
    const $shuffleOrder = get(shuffleIndices);
    if ($pos >= 0 && $shuffleOrder && $shuffleOrder.length > 0) {
      shufflePosition.set($pos);
      prevTrackIndex = $shuffleOrder[$pos];
    } else if ($loop && $shuffleOrder && $shuffleOrder.length > 0) {
      $pos = $shuffleOrder.length - 1;
      shufflePosition.set($pos);
      prevTrackIndex = $shuffleOrder[$pos];
    } else {
      prevTrackIndex = 0;
    }
  } else {
    let prevIdx = ctx.index - 1;
    if (prevIdx >= 0) {
      prevTrackIndex = prevIdx;
    } else if ($loop) {
      prevTrackIndex = ctx.tracks.length - 1;
    } else {
      prevTrackIndex = 0;
    }
  }

  if (prevTrackIndex >= 0 && ctx.tracks[prevTrackIndex]) {
    playbackContext.update(c => ({ ...c, index: prevTrackIndex }));
    libraryPlayIndex.set(prevTrackIndex);
    currentPosition.set(0);
    totalDuration.set(0);
    await playMidi(ctx.tracks[prevTrackIndex].path);
  }
}

// Add to queue and optionally play
export function addToQueue(file, playNow = false) {
  playlist.update(list => {
    // Allow duplicates in queue (unlike library playlists)
    return [...list, file];
  });
  if (playNow) {
    setTimeout(() => playMidi(file.path), 0);
  }
}

// Reorder queue
export function reorderQueue(fromIndex, toIndex) {
  playlist.update(list => {
    const items = [...list];
    const [item] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, item);

    // Update currentIndex if needed
    const $currentIndex = get(currentIndex);
    if (fromIndex === $currentIndex) {
      currentIndex.set(toIndex);
    } else if (fromIndex < $currentIndex && toIndex >= $currentIndex) {
      currentIndex.set($currentIndex - 1);
    } else if (fromIndex > $currentIndex && toIndex <= $currentIndex) {
      currentIndex.set($currentIndex + 1);
    }

    return items;
  });
}

// Toggle draggable mode
export async function toggleDraggable() {
  const newMode = !get(isDraggable);
  isDraggable.set(newMode);

  try {
    await invoke('set_interaction_mode', { interactive: newMode });
  } catch (error) {
    console.error('Failed to set interaction mode:', error);
  }
}

// Initialize event listeners
export function initializeListeners() {
  // Initialize storage first
  initializeStorage();

  // Listen for playback progress updates from backend (single source of truth)
  listen('playback-progress', (event) => {
    currentPosition.set(event.payload);
  });

  // Listen for playback ended
  listen('playback-ended', async () => {
    await playNext();
  });

  // Check game focus periodically for smart pause
  setInterval(async () => {
    if (Date.now() < smartPauseCooldownUntil) {
      return;
    }

    if (get(smartPause) && get(isPlaying) && !get(isPaused)) {
      try {
        const focused = await invoke('is_game_focused');
        if (!focused) {
          await pauseResume();
        }
      } catch (error) {
        console.error('Failed to check game focus:', error);
      }
    }
  }, 1000);
}

// Utility to get store value
function get(store) {
  let value;
  store.subscribe(v => value = v)();
  return value;
}

function delaySmartPause(duration = 2000) {
  smartPauseCooldownUntil = Date.now() + duration;
}

async function focusGameWindow() {
  try {
    await invoke('focus_game_window');
    delaySmartPause();
  } catch (error) {
    console.warn('Failed to focus game window:', error);
  }
}

async function refreshPlaybackState() {
  try {
    const state = await invoke('get_playback_status');
    if (!state) return;
    if (typeof state.is_playing === 'boolean') isPlaying.set(state.is_playing);
    if (typeof state.is_paused === 'boolean') isPaused.set(state.is_paused);
    if (typeof state.loop_mode === 'boolean') loopMode.set(state.loop_mode);
    if (typeof state.current_position === 'number') currentPosition.set(state.current_position);
    if (typeof state.total_duration === 'number') totalDuration.set(state.total_duration);
    if (state.current_file) {
      currentFile.set(state.current_file);
    }
    if (state.note_mode) {
      noteMode.set(state.note_mode);
    }
    if (state.key_mode) {
      keyMode.set(state.key_mode);
    }
    if (state.octave_shift !== undefined) {
      octaveShift.set(state.octave_shift);
    }
    if (state.speed !== undefined) {
      speed.set(state.speed);
    }
  } catch (error) {
    console.error('Failed to refresh playback status:', error);
  }
}

// ============ Live MIDI Input Functions ============

// Refresh list of available MIDI input devices
export async function refreshMidiDevices() {
  try {
    const devices = await invoke('list_midi_input_devices');
    midiInputDevices.set(devices);
    // Only update connection state if not already connected
    const currentState = get(midiConnectionState);
    const isVirtualConnected = get(isDevVirtualConnected);
    if (currentState !== 'Connected' && !isVirtualConnected) {
      midiConnectionState.set(devices.length > 0 ? 'DevicesAvailable' : 'NoDevices');
    }
    return devices;
  } catch (error) {
    console.error('Failed to list MIDI devices:', error);
    midiInputDevices.set([]);
    // Only set error if not connected
    const currentState = get(midiConnectionState);
    if (currentState !== 'Connected') {
      midiConnectionState.set('Error');
    }
    return [];
  }
}

// Start listening to a MIDI device
export async function startMidiListening(deviceIndex) {
  try {
    midiConnectionState.set('Connecting');
    const deviceName = await invoke('start_midi_listening', { deviceIndex });
    selectedMidiDevice.set({ index: deviceIndex, name: deviceName });
    isLiveModeActive.set(true);
    midiConnectionState.set('Connected');
    console.log(`Connected to MIDI device: ${deviceName}`);
    return { success: true, deviceName };
  } catch (error) {
    console.error('Failed to start MIDI listening:', error);
    midiConnectionState.set('Error');
    return { success: false, error: error.toString() };
  }
}

// Stop listening to MIDI device
export async function stopMidiListening() {
  try {
    await invoke('stop_midi_listening');
    isLiveModeActive.set(false);
    selectedMidiDevice.set(null);
    lastLiveNote.set(null);
    // Refresh devices to update state
    await refreshMidiDevices();
    console.log('Stopped MIDI listening');
    return { success: true };
  } catch (error) {
    console.error('Failed to stop MIDI listening:', error);
    return { success: false, error: error.toString() };
  }
}

// Set live transpose value
export async function setLiveTranspose(value) {
  const clamped = Math.max(-12, Math.min(12, value));
  liveTranspose.set(clamped);
  try {
    await invoke('set_live_transpose', { value: clamped });
    console.log(`Live transpose set to: ${clamped}`);
  } catch (error) {
    console.error('Failed to set live transpose:', error);
  }
}

// Track if listeners are already initialized
let liveMidiListenersInitialized = false;

// Initialize live MIDI event listeners (only once)
export function initializeLiveMidiListeners() {
  if (liveMidiListenersInitialized) return;
  liveMidiListenersInitialized = true;

  // Listen for live note events
  listen('live-note-event', (event) => {
    const { midi_note, key, note_name, velocity } = event.payload;
    lastLiveNote.set({
      midiNote: midi_note,
      key,
      noteName: note_name,
      velocity
    });
    // Clear after a short delay for visual feedback
    setTimeout(() => {
      lastLiveNote.update(current => {
        // Only clear if it's the same note (avoid clearing newer notes)
        if (current && current.midiNote === midi_note) {
          return null;
        }
        return current;
      });
    }, 200);
  });

  // Listen for device disconnection
  listen('midi-device-disconnected', () => {
    isLiveModeActive.set(false);
    selectedMidiDevice.set(null);
    midiConnectionState.set('Disconnected');
    console.log('MIDI device disconnected');
  });

  // Listen for device connection
  listen('midi-device-connected', (event) => {
    midiConnectionState.set('Connected');
    console.log(`MIDI device connected: ${event.payload}`);
  });
}
