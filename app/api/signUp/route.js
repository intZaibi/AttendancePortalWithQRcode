import { NextResponse } from 'next/server';
import db from '../../../lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  const { fullName, email, password, role } = await req.json();
  console.log('name:', fullName, 'email:',  email, 'password:', password, 'role:', role)

  try {
    // Check if user already exists
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    console.log("db connected")
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user into the database
    await db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [fullName, email, hashedPassword, role]);

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
