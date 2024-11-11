import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function POST(req) {
    const { userId, date, status } = await req.json();

    try {
        const [workingDays] = await db.query('SELECT date FROM working_days');
        
        const isWorkingDay = workingDays.filter((day) => day.date === date );

        if(isWorkingDay.toString() === '')
            return NextResponse.json({ message: 'Not a working day' }, { status: 400 });

        // Check if attendance for the user on this date already exists
        const [existingAttendance] = await db.query(
            'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
            [userId, date]
        );

        if (existingAttendance.length > 0) {
            console.log('Attendance already marked for today.');
            return NextResponse.json({ message: 'Attendance already marked for today.' }, { status: 400 });
        }

        // Check if the user has requested leave for this date
        const [leaveRequest] = await db.query(
            'SELECT * FROM leave_requests WHERE user_id = ? AND (start_date <= ? AND end_date >= ?)',
            [userId, date, date]
        );

        if (leaveRequest.length > 0) {
            console.log('User has requested leave for this date.');
            return NextResponse.json({ message: 'User has requested leave for this date.' }, { status: 400 });
        }

        if(status === 'Late') {
            await db.query(
                'INSERT INTO attendance (user_id, date, status) VALUES (?, ?, ?)',
                [userId, date, 'latePending']
            );
        } else {
            await db.query(
                'INSERT INTO attendance (user_id, date) VALUES (?, ?)',
                [userId, date]
            );
        }

        return NextResponse.json({ message: 'Attendance marked successfully.' }, { status: 201 });
    } catch (error) {
        console.log('error:', error);
        return NextResponse.json({ message: 'Unable to mark attendance.' }, { status: 500 });
    }
}
