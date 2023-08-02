const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsServices {
  constructor(colaborationsService) {
    this._pool = new Pool();
    this._collaborationsService = colaborationsService;
  }

  async addPlaylist(name, owner) {
    const id = `playlists-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menambahkan playlist');
    }
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists
            LEFT JOIN users ON playlists.owner = users.id 
            LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
            WHERE playlists.owner = $1 OR collaborations.user_id = $1`,
      values: [owner],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async deletePlaylist(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus playlist. Id tidak ditemukan');
    }
  }

  async addPlaylistSong(playlist, song, userId) {
    const id = `playlist-song-${nanoid(16)}`;
    const activitiyId = `activity-${nanoid(16)}`;
    const date = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlist, song],
    };

    const activityQuery = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [activitiyId, playlist, song, userId, 'add', date],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menambahkan lagu ke playlist');
    }

    const resultActivity = await this._pool.query(activityQuery);

    if (!resultActivity.rows.length) {
      throw new InvariantError('Gagal menambahkan playlist activities');
    }
  }

  async getPlaylistSongs(playlistId) {
    const playlistQuery = {
      text: `SELECT playlists.id, playlists.name, users.username
            FROM playlists INNER JOIN users ON playlists.owner = users.id
            WHERE playlists.id = $1`,
      values: [playlistId],
    };

    const songsQuery = {
      text: `SELECT songs.id, songs.title, songs.performer
            FROM playlist_songs LEFT JOIN songs ON playlist_songs.song_id = songs.id
            WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };

    const playlistResult = await this._pool.query(playlistQuery);

    if (!playlistResult.rows.length) {
      throw new NotFoundError('playlist tidak ditemukan');
    }

    const songsResult = await this._pool.query(songsQuery);

    return {
      ...playlistResult.rows[0],
      songs: [...songsResult.rows],
    };
  }

  async deletePlaylistSong(playlist, song, userId) {
    const activitiyId = `activity-${nanoid(16)}`;
    const date = new Date().toISOString();

    const query = {
      text: `DELETE FROM playlist_songs 
      WHERE playlist_songs.playlist_id = $1 AND playlist_songs.song_id = $2 RETURNING id`,
      values: [playlist, song],
    };

    const activityQuery = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [activitiyId, playlist, song, userId, 'delete', date],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError(
        'Gagal menghapus lagu dari playlist. Id tidak ditemukan'
      );
    }

    const resultActivity = await this._pool.query(activityQuery);

    if (!resultActivity.rows.length) {
      throw new InvariantError('Gagal menambahkan playlist activities');
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resourses ini');
    }
  }

  async verifyPlaylistId(playlistId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationsService.verifyCollaborator(
          playlistId,
          userId
        );
      } catch {
        throw error;
      }
    }
  }

  async getPlaylistActivities(playlistId) {
    const query = {
      text: `SELECT users.username, songs.title, playlist_song_activities.action, playlist_song_activities.time
      FROM playlist_song_activities
      LEFT JOIN users ON playlist_song_activities.user_id = users.id
      LEFT JOIN songs ON playlist_song_activities.song_id = songs.id
      WHERE playlist_song_activities.playlist_id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError(
        'Tidak dapat menampilkan aktivitas pada playlist ini'
      );
    }

    return {
      playlistId,
      activities: [...result.rows],
    };
  }
}

module.exports = PlaylistsServices;
