const isAuthenticated = (request, response, next) => {
  const { user } = request.session;
  if (request.session.user.id !== undefined && user.id !== undefined) {
    next();
  } else {
    response.redirect("authenticated/login");
  }
};

module.exports = isAuthenticated;
