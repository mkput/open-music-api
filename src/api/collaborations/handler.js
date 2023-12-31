const autoBind = require('auto-bind');

class CollaborationsHandler {
  constructor(collaborationsService, usersService, playlistsService) {
    this._collaborationsService = collaborationsService;
    this._usersService = usersService;
    this._playlistsService = playlistsService;

    autoBind(this);
  }

  async postCollaborationHandler(request, h) {
    const { playlistId, userId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._usersService.verifyUserId(userId);
    await this._playlistsService.verifyPlaylistId(playlistId);
    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);

    const collaborationId = await this._collaborationsService.addCollaboration(
      playlistId,
      userId
    );

    const response = h.response({
      status: 'success',
      data: {
        collaborationId,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(request) {
    const { playlistId, userId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    await this._collaborationsService.deleteCollaboration(playlistId, userId);

    return {
      status: 'success',
      message: 'Kolaborasi berhasil dihapus',
    };
  }
}

module.exports = CollaborationsHandler;
