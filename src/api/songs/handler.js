const autoBind = require('auto-bind');

class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    autoBind(this);
  }

  async postSongsHandler(request, h) {
    this._validator.validateSongsPayload(request.payload);

    const songId = await this._service.addSong(request.payload);

    const response = h.response({
      status: 'success',
      data: {
        songId,
      },
    });
    response.code(201);
    return response;
  }

  async getSongsHandler(request) {
    const query = request.query;
    const songs = await this._service.getSongs();

    if (query.title || query.performer) {
      const filteredSongs = songs.filter((song) => {
        const titleMatch = query.title
          ? song.title.toLowerCase().includes(query.title.toLowerCase())
          : true;
        const performerMatch = query.performer
          ? song.performer.toLowerCase().includes(query.performer.toLowerCase())
          : true;
        return titleMatch && performerMatch;
      });

      return {
        status: 'success',
        data: {
          songs: filteredSongs,
        },
      };
    }

    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongsByIdHandler(request) {
    const { id } = request.params;
    const song = await this._service.getSongById(id);

    return {
      status: 'success',
      data: {
        song,
      },
    };
  }

  async putSongsByIdHandler(request) {
    this._validator.validateSongsPayload(request.payload);

    const { id } = request.params;
    await this._service.editSongById(id, request.payload);

    return {
      status: 'success',
      message: 'Lagu berhasil diubah',
    };
  }

  async deleteSongsByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteSongById(id);

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }
}

module.exports = SongsHandler;
