const isAuthenticated = (request, response, next) => {
  const { user } = request.session;
  console.log("User:", user); // Add this line for debugging
  if (user !== undefined && user.id !== undefined) {
    next();
  } else {
    response.redirect("/authentication/login");
  }
};

module.exports = isAuthenticated;
