const { nanoid } = require('nanoid');

const mapDBToModel = ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  album_id,
}) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId: album_id,
});

const mapPlaylistDBToModel = ({ id, name, owner }) => ({
  id,
  name,
  username: owner,
});

const generatedAlbumId = () => {
  const prefix = 'album-';
  const length = 16;
  const id = nanoid(length);
  return prefix + id;
};

const generatedSongId = () => {
  const prefix = 'song-';
  const length = 16;
  const id = nanoid(length);
  return prefix + id;
};

module.exports = {
  mapDBToModel,
  generatedAlbumId,
  generatedSongId,
  mapPlaylistDBToModel,
};
