import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function POST(req) {
    const { userId, startDate, endDate, reason } = await req.json();

    try {

      const start = new Date(startDate);
        const end = new Date(endDate);

        const [existingRecords] = await db.query(
            `SELECT * FROM leave_requests 
             WHERE user_id = ? 
             AND (start_date BETWEEN ? AND ? OR end_date BETWEEN ? AND ? 
                  OR (? BETWEEN start_date AND end_date) 
                  OR (? BETWEEN start_date AND end_date))`,
            [userId, start, end, start, end, start, end]
        );

      if (existingRecords.length > 0) {
        return NextResponse.json({ message: 'Leave has already requested.' }, { status: 400 });
      }

      await db.query(
        'INSERT INTO leave_requests (user_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?)',
        [userId, startDate, endDate, reason, 'pending']
      );

      return NextResponse.json({ message: 'Leave request has submitted.' }, { status: 201 });
    } catch (error) {
      console.log(error)
      return NextResponse.json({ message: error.sqlMessage }, { status: 500 });
    }
}
