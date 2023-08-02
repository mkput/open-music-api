require('dotenv').config();
const Jwt = require('@hapi/jwt');

const Hapi = require('@hapi/hapi');
const ClientError = require('./exceptions/ClientError');

// Songs
const SongsServices = require('./services/postgre/SongsServices');
const SongsValidator = require('./validator/songs');
const songs = require('./api/songs');

// album
const AlbumValidator = require('./validator/albums');
const AlbumServices = require('./services/postgre/AlbumServices');
const albums = require('./api/albums');

// users
const users = require('./api/users');
const UserValidator = require('./validator/users');
const UsersServices = require('./services/postgre/UsersServices');

// authentications
const authentications = require('./api/authentications');
const AuthenticationsServices = require('./services/postgre/AuthenticationsServices');
const AuthenticationsValidator = require('./validator/authentications');
const TokenManager = require('./tokenize/TokenManager');

// paylists
const playlists = require('./api/playlists');
const PlaylistsServices = require('./services/postgre/PlaylistsServices');
const PlaylistsValidator = require('./validator/playlists');

// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsServices = require('./services/postgre/CollaborationsServices');

const init = async () => {
  const albumServices = new AlbumServices();
  const songsServices = new SongsServices();
  const usersService = new UsersServices();
  const authenticationsService = new AuthenticationsServices();
  const collaborationsService = new CollaborationsServices();
  const playlistsService = new PlaylistsServices(collaborationsService);

  const server = Hapi.server({
    host: process.env.HOST,
    port: process.env.PORT,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // registrasi plugin eksternal
  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  // mendefinisikan strategy autentikasi jwt
  server.auth.strategy('openmusicapp_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: albums,
      options: {
        service: albumServices,
        validator: AlbumValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsServices,
        validator: SongsValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UserValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        playlistsService,
        songsService: songsServices,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        usersService,
        playlistsService,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    // mendapatkan konteks response dari request
    const { response } = request;
    if (response instanceof Error) {
      // penanganan client error secara internal.
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }
      // mempertahankan penanganan client error oleh hapi secara native, seperti 404, etc.
      if (!response.isServer) {
        return h.continue;
      }
      // penanganan server error sesuai kebutuhan
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }
    // jika bukan error, lanjutkan dengan response sebelumnya (tanpa terintervensi)
    return h.continue;
  });

  await server.start();
  console.log(`Server running at ${server.info.uri}`);
};

init();
