import { NextResponse } from 'next/server';
import db from '@/lib/db'

export async function GET(req) {
    const url = req.url;
    const urlParams = new URLSearchParams(url.split('?')[1]); 
    const userId = urlParams.get('userId');
    const month = urlParams.get('selectedMonth');
    const fromDate = urlParams.get('fromDate');
    const toDate = urlParams.get('toDate');

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
      if (!month) {

        const [workingDays] = await db.query(`
          SELECT date
          FROM qrcode
          WHERE DATE(date) between ? AND ?;
        `, [fromDate, toDate]);

      return NextResponse.json({ presents, leaves, monthlyWorkingDays, workingDays, late }, { status: 200 });
      }

      const [workingDays] = await db.query(`
        SELECT date 
        FROM qrcode 
        WHERE MONTH(date) = ? 
          AND YEAR(date) = 2024
      `, [month]);

      return NextResponse.json({ presents, late, leaves, monthlyWorkingDays, workingDays }, { status: 200 });
    } catch (error) {
      console.log(error)
      return NextResponse.json({ error: 'Unable to fetch attendance records.' }, { status: 500 });
    }
}

export async function POST(req) {
  let { userId, date, status } = await req.json();

  // Convert status to matching db status
  switch (status) {
    case 'present':
      status = 'presentApproved';
      break;
    case 'leave':
      status = 'leaveApproved';
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
    const workingDay = await db.query('SELECT date FROM qrcode WHERE date = ?', [date]);

    if (workingDay.length === 0) {
      // If the date doesn't exist in working_days, return an error
      return NextResponse.json({ error: 'The specified date is not a working day.' }, { status: 400 });
    }

    // Handle the case based on status
    if (status === 'presentApproved' || status === 'late') {
      status = 'approved'
      // Step 2: Handling `present` and `late` statuses
      
      //if date existing in attendance table
      const existingDate = await db.query('SELECT date FROM attendance WHERE user_id = ? AND date = ?', [userId, date]);
      
      //existing leave for that date
      const existInLeaveRequests = await db.query(
        'SELECT start_date, end_date FROM leave_requests WHERE user_id = ? AND start_date <= ? AND end_date >= ?',
        [userId, date, date]
      );


      // if leave request is for only one day i.e: (startDate = endDate) then delete this request
      if (existInLeaveRequests[0].length > 0) {
        if (existInLeaveRequests[0][0].start_date = existInLeaveRequests[0][0].end_date) {
          //deleting leave-req on that date
          await db.query(
            'DELETE FROM leave_requests WHERE user_id = ? AND start_date = ? AND end_date = ?',
            [userId, date, date]
          );
        }
        const prevEndDate = existInLeaveRequests[0][0].end_date;
        const nextDayDateObj = new Date(date); // to add a day
        const prevDayDateObj = new Date(date); // to add a day
        nextDayDateObj.setDate(nextDayDateObj.getDate() + 1); // Add 1 day to the date
        prevDayDateObj.setDate(prevDayDateObj.getDate() - 1); // Add 1 day to the date
        const nextDate = nextDayDateObj.toISOString().split('T')[0];// to add a day
        const prevDate = prevDayDateObj.toISOString().split('T')[0];// to add a day

        //updateing leave-req because date exist in leave-req range
        await db.query(
          'UPDATE leave_requests SET end_date = ? WHERE user_id = ? AND start_date <= ? AND end_date >= ?',
          [prevDate, userId, date, date]
        );
        //Now inserting new leave-req for rest leave days
        await db.query(
          'INSERT INTO leave_requests (user_id, start_date, end_date, status) VALUES (?, ?, ?, ?)',
          [userId, nextDate, prevEndDate, 'approved']
        );
      }

      if (!existingDate[0].length>0) {
        // If the date doesn't exist, insert a new row into attendance
        const res = await db.query(
          "INSERT INTO attendance (status, user_id, date) VALUES (?, ?, ?)",
          [status, userId, date]
        );
        if (res[0].affectedRows > 0) {
          return NextResponse.json({ message: 'Attendance updated successfully.' }, { status: 200 });
        }
        throw res[0].info;
      }

      // If the date exists, update the attendance status
      const res = await db.query(
        "UPDATE attendance SET status = ? WHERE user_id = ? AND date = ?",
        [status, userId, date]
      );
      if (res[0].affectedRows > 0) {
        return NextResponse.json({ message: 'Attendance updated successfully.' }, { status: 200 });
      }
      throw res[0].info;
    }

    if (status === 'leaveApproved') {
      // Step 3: Handling `leave` requests
      const leaveRequests = await db.query(
        'SELECT start_date, end_date FROM leave_requests WHERE user_id = ? AND start_date <= ? AND end_date >= ?',
        [userId, date, date]
      );
      // Checking if the date is marked as present
      const existingAttendance = await db.query(
        'SELECT date FROM attendance WHERE user_id = ? AND date = ?',
        [userId, date]
      );
      //Delete the present marked to prevent leave and present overlapping
      if (existingAttendance[0].length > 0) {
        await db.query(
          'DELETE FROM attendance WHERE user_id = ? AND date = ?',
          [userId, date]
        );
      }

      if (leaveRequests[0].length > 0) {
        // If the date is within an existing leave range, update the status to 'approved'
        const res = await db.query(
          "UPDATE leave_requests SET status = 'approved' WHERE user_id = ? AND start_date <= ? AND end_date >= ?",
          [userId, date, date]
        );
        
        if (res[0].affectedRows > 0) {
          return NextResponse.json({ message: 'Leave request approved.' }, { status: 200 });
        }
        throw res[0].info;
      } else {
        // If the date is not within an existing leave range, insert a new leave request
        const res = await db.query(
          'INSERT INTO leave_requests (user_id, start_date, end_date, status, reason) VALUES (?, ?, ?, ?, ?)',
          [userId, date, date, 'approved', 'granted by admin']
        );
        if (res[0].affectedRows > 0) {
          return NextResponse.json({ message: 'Leave request inserted successfully.' }, { status: 200 });
        }
        throw res[0].info;
      }
    }

    if (status === 'rejected') {
      // Step 4: Handling `absent` status (rejected)

      //if date existing in attendance table
      const existingDate = await db.query('SELECT date FROM attendance WHERE user_id = ? AND date = ?', [userId, date]);
      
      //if date existing in leave-req table
      const existInLeaveRequests = await db.query(
        'SELECT start_date, end_date FROM leave_requests WHERE user_id = ? AND start_date <= ? AND end_date >= ?',
        [userId, date, date]
      );

      // if date falls in leave-req range
      if (existInLeaveRequests[0].length > 0) {
        // if leave request is for only one day i.e: (startDate = endDate) then delete this request
        if (existInLeaveRequests[0][0].start_date = existInLeaveRequests[0][0].end_date) {
          const res = await db.query(
            'DELETE FROM leave_requests WHERE user_id = ? AND start_date = ? AND end_date = ?',
            [userId, date, date]
          );
        } else {
        // update the range and deduct that date
        const prevEndDate = existInLeaveRequests[0][0].end_date;
        const nextDayDateObj = new Date(date); // to add a day
        const prevDayDateObj = new Date(date); // to add a day
        nextDayDateObj.setDate(nextDayDateObj.getDate() + 1); // Add 1 day to the date
        prevDayDateObj.setDate(prevDayDateObj.getDate() - 1); // Add 1 day to the date
        const nextDate = nextDayDateObj.toISOString().split('T')[0];// to add a day
        const prevDate = prevDayDateObj.toISOString().split('T')[0];// to add a day

        await db.query(
          'UPDATE leave_requests SET end_date = ? WHERE user_id = ? AND start_date <= ? AND end_date >= ?',
          [prevDate, userId, date, date]
        );
        await db.query(
          'INSERT INTO leave_requests (user_id, start_date, end_date, status) VALUES (?, ?, ?, ?)',
          [userId, nextDate, prevEndDate, 'approved']
        );
      }
    }

      if (!existingDate[0].length>0) {
        // If the date doesn't exist, insert a new row into attendance
        const res = await db.query(
          "INSERT INTO attendance (status, user_id, date) VALUES (?, ?, ?)",
          [status, userId, date]
        );
        if (res[0].affectedRows > 0) {
          return NextResponse.json({ message: 'Attendance updated successfully.' }, { status: 200 });
        }
        throw res[0].info;
      }

      // If the date exists, update the attendance status
      const res = await db.query(
        "UPDATE attendance SET status = ? WHERE user_id = ? AND date = ?",
        [status, userId, date]
      );
      if (res[0].affectedRows > 0) {
        return NextResponse.json({ message: 'Attendance updated successfully.' }, { status: 200 });
      }
      throw res[0].info;
    }

  } catch (error) {
    if (error?.message?.includes('qrcode')) {
      return NextResponse.json({ error: "Not a working day." }, { status: 500 });
    }
    console.log(error)
    return NextResponse.json({ error }, { status: 500 });
  }
}

