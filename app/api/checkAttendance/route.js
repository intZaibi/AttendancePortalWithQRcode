import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function POST(req) {
    const { userId } = await req.json();

    if (typeof userId == 'undefined') {
        return NextResponse.json({error: 'userId is undefined'},{status:500})
    }
      
    try {
      const today = new Date();
      const date = today.toISOString().split('T')[0];
        const resp = await db.query('SELECT date FROM attendance WHERE user_id = ? AND date = ?', [userId, date]);
        if (resp[0].length > 0) {
          
          return NextResponse.json({ message: 'Attendance already marked!' }, { status: 500 });
        }
        return NextResponse.json({ message: 'Attendance pending!' }, { status: 201 });
    } catch (error) {

        console.log('error:', error);
        return NextResponse.json({ error }, { status: 500 });
    }
}