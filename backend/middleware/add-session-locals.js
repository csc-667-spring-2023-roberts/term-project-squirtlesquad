const addSessionLocals = (request, response, next) => {
  if (request.session && request.session.user !== undefined) {
    request.app.locals.user = {
      ...request.session.user,
    };
  }

  next();
};

module.exports = addSessionLocals;
