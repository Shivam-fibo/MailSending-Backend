import jwt from "jsonwebtoken";

// Callback handler after Google OAuth success
export const googleAuthCallback = (req, res) => {
  try {
    // Create JWT just like your normal login
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Send token as httpOnly cookie or via redirect query param
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend
    res.redirect(`http://localhost:5173/dashboard`);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    res.redirect("/login?error=google_auth_failed");
  }
};
