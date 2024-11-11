import { NextResponse } from 'next/server';
import db from '@/lib/db'

export async function GET(req) {
    const url = req.url;
    const urlParams = new URLSearchParams(url.split('?')[1]); 
    const userId = urlParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    try {
      const [presents] = await db.query(
        `SELECT * FROM attendance WHERE user_id = ? AND status = 'approved' OR 'late' ORDER BY date DESC`,
        [userId]
      );
      const [late] = await db.query(
        `SELECT * FROM attendance WHERE user_id = ? AND status = 'late' ORDER BY date DESC`,
        [userId]
      );
      const [leaves] = await db.query(
        `SELECT * FROM leave_requests WHERE user_id = ? AND status = 'approved' ORDER BY start_date DESC`,
        [userId]
      );
      const [monthlyWorkingDays] = await db.query('SELECT * FROM monthly_workingdays');
      const [workingDays] = await db.query('SELECT date FROM working_days');

      return NextResponse.json({ presents, late, leaves, monthlyWorkingDays, workingDays }, { status: 200 });
    } catch (error) {
      console.log(error)
      return NextResponse.json({ error: 'Unable to fetch attendance records.' }, { status: 500 });
    }
}

export async function POST(req) {
  let { userId, date, status } = await req.json();
  const inputDate = new Date(date); // Convert input to Date object
  const formattedInputDate = inputDate.toISOString().split('T')[0];

  // Convert status to matching db status
  switch (status) {
    case 'present':
    case 'leave':
      status = 'approved';
      break;
    case 'late':
      status = 'late';
      break;
    case 'absent':
      status = 'rejected';
      break;
    default:
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    // Step 1: Check if the date exists in the working_days table
    const workingDay = await db.query('SELECT date FROM working_days WHERE date = ?', [formattedInputDate]);

    if (workingDay.length === 0) {
      // If the date doesn't exist in working_days, return an error
      return NextResponse.json({ error: 'The specified date is not a working day.' }, { status: 400 });
    }

    // Handle the case based on status
    if (status === 'approved' || status === 'late') {
      // Step 2: Handling `present` and `late` statuses
      const dates = await db.query('SELECT date FROM attendance WHERE user_id = ?', [userId]);

      const existingDate = dates[0].find(DBdate => {
        return DBdate.date === formattedInputDate
      });

      if (!existingDate) {
        // If the date doesn't exist, insert a new row into attendance
        const res = await db.query(
          'INSERT INTO attendance (status, user_id, date) VALUES (?, ?, ?)',
          [status, userId, date]
        );
        if (res[0].affectedRows > 0) {
          return NextResponse.json({ message: 'Attendance updated successfully.' }, { status: 200 });
        }
        throw res[0].info;
      }

      // If the date exists, update the attendance status
      const res = await db.query(
        'UPDATE attendance SET status = ? WHERE user_id = ? AND date = ?',
        [status, userId, date]
      );
      if (res[0].affectedRows > 0) {
        return NextResponse.json({ message: 'Attendance updated successfully.' }, { status: 200 });
      }
      throw res[0].info;
    }

    if (status === 'approved') {
      // Step 3: Handling `leave` requests
      const leaveRequests = await db.query(
        'SELECT start_date, end_date FROM leave_requests WHERE user_id = ? AND ? BETWEEN start_date AND end_date',
        [userId, date]
      );

      if (leaveRequests.length > 0) {
        // If the date is within an existing leave range, update the status to 'approved'
        const res = await db.query(
          'INSERT INTO attendance (status, user_id, date) VALUES (?, ?, ?)',
          [status, userId, date]
        );
        if (res[0].affectedRows > 0) {
          return NextResponse.json({ message: 'Leave request approved.' }, { status: 200 });
        }
        throw res[0].info;
      } else {
        // If the date is not within an existing leave range, insert a new leave request
        const res = await db.query(
          'INSERT INTO leave_requests (user_id, start_date, end_date, status) VALUES (?, ?, ?, ?)',
          [userId, date, date, 'approved']
        );
        if (res[0].affectedRows > 0) {
          return NextResponse.json({ message: 'Leave request inserted successfully.' }, { status: 200 });
        }
        throw res[0].info;
      }
    }

    if (status === 'rejected') {
      // Step 4: Handling `absent` status (rejected)
      // Check if the date exists in attendance or leave_requests table
      const attendanceExists = await db.query(
        'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
        [userId, date]
      );
      const leaveExists = await db.query(
        'SELECT * FROM leave_requests WHERE user_id = ? AND ? BETWEEN start_date AND end_date',
        [userId, date]
      );

      if (attendanceExists.length > 0) {
        // If an attendance record exists, update it to 'rejected'
        const res = await db.query(
          'UPDATE attendance SET status = ? WHERE user_id = ? AND date = ?',
          [status, userId, date]
        );
        if (res[0].affectedRows > 0) {
          return NextResponse.json({ message: 'Attendance status updated to rejected.' }, { status: 200 });
        }
        throw res[0].info;
      } else if (leaveExists.length > 0) {
        // If a leave request exists, update it to 'rejected'
        const res = await db.query(
          'UPDATE leave_requests SET status = ? WHERE user_id = ? AND ? BETWEEN start_date AND end_date',
          [status, userId, date]
        );
        if (res[0].affectedRows > 0) {
          return NextResponse.json({ message: 'Leave request status updated to rejected.' }, { status: 200 });
        }
        throw res[0].info;
      } else {
        // If the date doesn't exist in any table, do nothing
        return NextResponse.json({ message: 'No record found to reject.' }, { status: 200 });
      }
    }

  } catch (error) {
    if (error?.message?.includes('working_days')) {
      return NextResponse.json({ error: "Not a working day." }, { status: 500 });
    }
    return NextResponse.json({ error }, { status: 500 });
  }
}

