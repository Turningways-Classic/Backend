exports.getWelcomePage = async (req, res) => {
  res.status(200).json({
    message: "Welcome to Trakar 👋",
    description: "Trakar is a visitor and staff access management system.",
    endpoints: {
      signup: "/api/visitor/signup",
      login: "/api/visitor/login",
      logout: "/api/visitor/logout",
      verify_otp: "/api/visitor/verify-otp",
      profile: "/api/visitor/profile"
    }
  });
};
