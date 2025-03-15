function verifyToken(req) {
  try {
    // Retrieve token from headers
    const authHeader = req.headers.get('authorization');
    const token = authHeader.split(' ')[1] || null;
    
    if (!token) {
      return { error: "No token provided", status: 401 };
    }

    // Verify the token using the secret stored in environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Return the decoded user data if the token is valid
    return { userId: decoded.id, role: decoded.role };
  } catch (error) {
    // Handle any errors related to token verification
    if (error.name === 'TokenExpiredError') {
      return { error: "Token expired", status: 401 };
    }
    return { error: "Invalid token", status: 401 };
  }
}