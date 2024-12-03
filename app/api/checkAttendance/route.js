import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function POST(req) {
    const { userId } = await req.json();

    if (typeof userId == 'undefined') {
        return NextResponse.json({error: 'userId is undefined'},{status:500})
    }
      
    try {
        const resp = await db.query('SELECT date FROM attendance WHERE user_id = ? AND DATE(date) = CURDATE()', [userId]);
        if (resp[0].length > 0) {
          
          return NextResponse.json({ message: 'Attendance already marked!' }, { status: 200 });
        }
        return NextResponse.json({ }, { status: 201 });
    } catch (error) {

        console.log('error:', error);
        return NextResponse.json({ error }, { status: 500 });
    }
}