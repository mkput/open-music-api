const InvariantError = require('../../exceptions/InvariantError');
const {
  PostAuthenticationsPayloadSchema,
  PutAuthenticationsPayloadSchema,
  DeleteAuthenticationPayloadSchema,
} = require('./schema');

const AuthenticationsValidator = {
  validatePostAuthenticationsPayload: (payload) => {
    const validationResult = PostAuthenticationsPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },

  validatePutAuthenticationsPayload: (payload) => {
    const validationResult = PutAuthenticationsPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },

  validateDeleteAuthenticationPayload: (payload) => {
    const validationResult =
      DeleteAuthenticationPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = AuthenticationsValidator;
