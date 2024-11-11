import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(req) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url)); // Redirect to login if no token
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const url = req.nextUrl.pathname;

    // Restrict access based on role and route
    if (url.startsWith('/admin') && decoded.role !== 'admin') {
      return NextResponse.redirect(new URL('/user/dashboard', req.url));
    }

    if (url.startsWith('/user') && decoded.role !== 'student') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*'], // Apply middleware to specific routes
};
