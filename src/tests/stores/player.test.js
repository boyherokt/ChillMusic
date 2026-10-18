import { beforeEach, describe, expect, it, vi } from 'vitest'
import { get } from 'svelte/store'

vi.mock('../../lib/tauri/core-proxy.js', () => ({
  invoke: vi.fn(() => Promise.resolve({})),
}))
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve({ unlisten: vi.fn() })),
}))
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    innerSize: vi.fn(() => Promise.resolve({ width: 100, height: 100 })),
    innerPosition: vi.fn(() => Promise.resolve({ x: 0, y: 0 })),
    setMinSize: vi.fn(() => Promise.resolve()),
    setSize: vi.fn(() => Promise.resolve()),
  })),
  LogicalSize: class LogicalSize {
    constructor(width = 0, height = 0) {
      this.width = width
      this.height = height
    }
  },
}))

import { invoke } from '../../lib/tauri/core-proxy.js'

import {
  addPlaytime,
  addToSavedPlaylist,
  clearAllFavorites,
  createPlaylist,
  currentFile,
  deletePlaylist,
  favorites,
  generateShuffleIndices,
  incrementSession,
  isFavorite,
  isPlaying,
  loopMode,
  playbackContext,
  playFromContext,
  playlist,
  playNext,
  playPrevious,
  reorderPlaylists,
  reorderSavedPlaylist,
  removeDeletedFile,
  removeFromSavedPlaylist,
  savedPlaylists,
  setPlaylistsOrder,
  setPlaylistTracks,
  shuffleIndices,
  shuffleMode,
  shufflePosition,
  stats,
  syncFavoritesWithLibrary,
  syncPlaylistsWithLibrary,
  toggleFavorite,
  toggleShuffle,
  trackSongPlay,
} from '../../lib/stores/player.js'

describe('player store helpers', () => {
  const initialStats = {
    totalPlaytime: 0,
    songsPlayed: 0,
    sessionsCount: 0,
    mostPlayed: {},
    lastPlayed: null,
    firstUsed: null,
  }

  let storageSpy

  beforeEach(() => {
    localStorage.clear()
    storageSpy = vi.spyOn(localStorage, 'setItem')
    stats.set({ ...initialStats })
    favorites.set([])
    savedPlaylists.set([])
    shuffleMode.set(false)
    invoke.mockReset()
  })

  afterEach(() => {
    storageSpy.mockRestore()
  })

  it('records plays and persists stats', () => {
    trackSongPlay('demo.mid')
    const recorded = get(stats)
    expect(recorded.songsPlayed).toBe(1)
    expect(recorded.mostPlayed).toHaveProperty('demo.mid', 1)
    expect(storageSpy).toHaveBeenCalledWith(
      'wwm-stats',
      expect.stringContaining('"songsPlayed":1')
    )
  })

  it('accumulates playtime and session counts', () => {
    addPlaytime(45)
    expect(get(stats).totalPlaytime).toBe(45)
    incrementSession()
    expect(get(stats).sessionsCount).toBe(1)
  })

  it('toggles shuffle mode', () => {
    toggleShuffle()
    expect(get(shuffleMode)).toBe(true)
    toggleShuffle()
    expect(get(shuffleMode)).toBe(false)
  })

  it('adds and removes favorites', () => {
    const track = { hash: 'fav-1', name: 'Favorite' }
    toggleFavorite(track)
    expect(get(favorites)).toEqual([track])
    expect(isFavorite('fav-1')).toBe(true)
    toggleFavorite(track)
    expect(get(favorites)).toHaveLength(0)
    clearAllFavorites()
    expect(get(favorites)).toHaveLength(0)
  })

  it('syncs favorites with library metadata', () => {
    favorites.set([{ hash: 'fav-1', name: 'Favorite' }])
    syncFavoritesWithLibrary([{ hash: 'fav-1', name: 'Favorite', path: '/tmp/fav.mid' }])
    expect(get(favorites)[0]).toHaveProperty('path', '/tmp/fav.mid')
  })

  it('creates and mutates playlists', () => {
    const id = createPlaylist('Test')
    const stored = get(savedPlaylists)
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ id, name: 'Test' })

    const track = { hash: 't-1', name: 'Track' }
    addToSavedPlaylist(id, track)
    expect(get(savedPlaylists)[0].tracks).toEqual([track])

    addToSavedPlaylist(id, track)
    expect(get(savedPlaylists)[0].tracks).toHaveLength(1)

    removeFromSavedPlaylist(id, track.hash)
    expect(get(savedPlaylists)[0].tracks).toHaveLength(0)

    deletePlaylist(id)
    expect(get(savedPlaylists)).toHaveLength(0)
  })

  it('reorders playlists and track lists', () => {
    savedPlaylists.set([
      { id: 'a', name: 'A', tracks: [{ hash: '1' }, { hash: '2' }] },
      { id: 'b', name: 'B', tracks: [] },
    ])
    reorderSavedPlaylist('a', 0, 1)
    expect(get(savedPlaylists)[0].tracks.map(t => t.hash)).toEqual(['2', '1'])

    reorderPlaylists(0, 1)
    expect(get(savedPlaylists)[0].id).toBe('b')

    setPlaylistsOrder([{ id: 'c', name: 'C', tracks: [] }])
    expect(get(savedPlaylists)).toHaveLength(1)
    expect(get(savedPlaylists)[0].id).toBe('c')
  })

  it('sets playlist tracks directly', () => {
    savedPlaylists.set([{ id: 'list', name: 'List', tracks: [] }])
    setPlaylistTracks('list', [{ hash: 'alpha' }])
    expect(get(savedPlaylists)[0].tracks).toEqual([{ hash: 'alpha' }])
  })

  it('syncs playlists with library data and handles deletions', () => {
    savedPlaylists.set([
      {
        id: 'list',
        name: 'List',
        tracks: [
          { hash: 'share', name: 'Shared' },
          { hash: 'gone', name: 'Gone' },
        ],
      },
    ])
    syncPlaylistsWithLibrary([{ hash: 'share', name: 'Shared', path: '/music/share.mid' }])
    expect(get(savedPlaylists)[0].tracks.find(t => t.hash === 'share')).toHaveProperty('path', '/music/share.mid')

    favorites.set([{ hash: 'gone' }, { hash: 'share' }])
    removeDeletedFile('gone')
    expect(get(favorites).every(f => f.hash !== 'gone')).toBe(true)
    expect(get(savedPlaylists)[0].tracks.some(t => t.hash === 'gone')).toBe(false)
  })
})

describe('Spotify-like playback, queue, and shuffle logic', () => {
  const dummyTracks = [
    { hash: 't1', name: 'Track 1', path: '/music/t1.mid' },
    { hash: 't2', name: 'Track 2', path: '/music/t2.mid' },
    { hash: 't3', name: 'Track 3', path: '/music/t3.mid' },
    { hash: 't4', name: 'Track 4', path: '/music/t4.mid' },
  ]

  beforeEach(() => {
    playlist.set([])
    loopMode.set(false)
    shuffleMode.set(false)
    shuffleIndices.set([])
    shufflePosition.set(0)
    currentFile.set(null)
    playbackContext.set({
      source: 'library',
      name: 'Library',
      id: null,
      tracks: [],
      index: -1,
    })
  })

  it('generateShuffleIndices generates a non-repeating permutation with current track first', () => {
    const indices = generateShuffleIndices(5, 2)
    expect(indices).toHaveLength(5)
    expect(indices[0]).toBe(2)
    const set = new Set(indices)
    expect(set.size).toBe(5)
    for (let i = 0; i < 5; i++) {
      expect(set.has(i)).toBe(true)
    }
  })

  it('playFromContext sets the context and plays selected track', async () => {
    await playFromContext({
      source: 'library',
      tracks: dummyTracks,
      index: 1,
    })

    const ctx = get(playbackContext)
    expect(ctx.source).toBe('library')
    expect(ctx.index).toBe(1)
    expect(get(currentFile)).toBe('/music/t2.mid')
    expect(get(playlist)).toEqual([])
  })

  it('playNext plays sequentially and stops at end of context when loopMode is false', async () => {
    await playFromContext({
      source: 'library',
      tracks: dummyTracks,
      index: 2, // Track 3
    })

    await playNext() // Should play Track 4 (index 3)
    expect(get(playbackContext).index).toBe(3)
    expect(get(currentFile)).toBe('/music/t4.mid')

    await playNext() // At end of playlist with loopMode false -> should stop, NOT jump back to Track 1
    expect(get(isPlaying)).toBe(false)
  })

  it('playNext wraps around to start when loopMode is true', async () => {
    loopMode.set(true)
    await playFromContext({
      source: 'library',
      tracks: dummyTracks,
      index: 3, // Last track
    })

    await playNext() // At end with loopMode true -> wraps to index 0
    expect(get(playbackContext).index).toBe(0)
    expect(get(currentFile)).toBe('/music/t1.mid')
  })

  it('playNext prioritizes user queue and removes played track from queue', async () => {
    await playFromContext({
      source: 'library',
      tracks: dummyTracks,
      index: 0,
    })

    // User explicitly queued Track 4
    playlist.set([dummyTracks[3]])

    await playNext() // Should play user queue track (Track 4)
    expect(get(currentFile)).toBe('/music/t4.mid')
    expect(get(playlist)).toEqual([]) // Popped from queue!

    await playNext() // User queue is now empty, should resume context from index 1 (Track 2)
    expect(get(playbackContext).index).toBe(1)
    expect(get(currentFile)).toBe('/music/t2.mid')
  })

  it('shuffleMode plays all tracks in shuffle order without repeating any track', async () => {
    await playFromContext({
      source: 'library',
      tracks: dummyTracks,
      index: 1, // Start with Track 2
      shuffle: true,
    })

    expect(get(shuffleMode)).toBe(true)
    const order = get(shuffleIndices)
    expect(order[0]).toBe(1) // First played is Track 2

    const playedTracks = [get(currentFile)]

    for (let i = 1; i < dummyTracks.length; i++) {
      await playNext()
      playedTracks.push(get(currentFile))
    }

    // Every track in dummyTracks was played exactly once
    expect(new Set(playedTracks).size).toBe(dummyTracks.length)
    expect(playedTracks.sort()).toEqual(dummyTracks.map(t => t.path).sort())

    // Without loop, next track stops
    await playNext()
    expect(get(isPlaying)).toBe(false)
  })

  it('playPrevious goes to previous track in context', async () => {
    await playFromContext({
      source: 'library',
      tracks: dummyTracks,
      index: 2,
    })

    await playPrevious()
    expect(get(playbackContext).index).toBe(1)
    expect(get(currentFile)).toBe('/music/t2.mid')
  })
})

