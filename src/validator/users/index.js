const InvariantError = require('../../exceptions/InvariantError');
const { UsersPayloadSchema } = require('./schema');

const UserValidator = {
  validateUsersPayload: (payload) => {
    const validationResult = UsersPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = UserValidator;
