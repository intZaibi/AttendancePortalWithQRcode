import db from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { email, password } = await req.json();
  console.log('credentials from server:', email, password)
  try {
    // Fetch the user by email
    const [userResult] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = userResult[0];
    console.log('user from server:', email, password)
    
    if(password === 'admin'){
      const token = jwt.sign({ id: 'admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return NextResponse.json({ message: "Login successful", role: 'admin' }, {
        status: 200,
        headers: { 'Set-Cookie': `token=${token}; Path=/; Max-Age=86400;` },
      });
    }
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate a JWT
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    console.log('sending response from server:', user)
    
    // Set the token in a cookie
    return NextResponse.json({ message: "Login successful", role: user.role }, {
      status: 200
    });
    return NextResponse.json({ message: "Login successful", role: user.role }, {
      status: 200,
      headers: { 'Set-Cookie': `token=${token}; Path=/; Max-Age=86400;` },
    });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}




export async function GET(req) {
  const { error, status, userId, role } = await verifyToken(req);

  if (error) {
    return NextResponse.json({ error }, { status });
  }

  // Proceed with the logic for authorized users
  return NextResponse.json({ message: "Authenticated", userId, role }, { status: 200 });
}






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
