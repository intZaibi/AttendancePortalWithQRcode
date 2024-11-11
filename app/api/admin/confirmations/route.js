import db from '@/lib/db'
import { NextResponse } from 'next/server';

export async function GET(req){

  const url = req.url;
  const urlParams = new URLSearchParams(url.split('?')[1]); 
  const type = urlParams.get('type');

  if(type === 'leaveRequest') {
    try {
      const pendings = await db.query(`SELECT user_id, start_date, end_date, reason, status FROM leave_requests WHERE status = 'pending' `);
      const users = await db.query(`SELECT id, name FROM users`);
      
      const data = pendings[0].map((row) => {
        const user = users[0].find((user) => user.id === row.user_id);
        return {
          ...row,
          name: user ? user.name : null
        };
      });
      
      return NextResponse.json({ data }, { status: 201 });
    } catch (error) {

      console.log(error)
      return NextResponse.json({ message: error }, { status: 500 })
    }
  }




  try {
    const pendings = await db.query(`SELECT user_id, date, status FROM attendance WHERE status = 'latePending' OR status = 'pending'`);
    const users = await db.query(`SELECT id, name FROM users`);
    
    const data = pendings[0].map((row) => {
      const user = users[0].find((user) => user.id === row.user_id);
      return {
        ...row,
        name: user ? user.name : null
      };
    });
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {

    console.log(error)
    return NextResponse.json({ message: error }, { status: 500 })
  }
}









export async function POST(req){
  const {type, date, start_date, end_date, user_id, status} = await req.json();

  if(type === 'leaveRequest') {
    try {
      const res = await db.query('UPDATE leave_requests SET status = ? WHERE user_id = ? AND start_date = ? AND end_date = ?', [status, user_id, start_date, end_date ])  
      
      if (res[0].affectedRows > 0) {
        return NextResponse.json({ message: 'Request confirmed successfully.' }, { status: 201 });
      }
      throw res[0].info;

    } catch (error) {
      
      console.log(error)
      return NextResponse.json({ message: error }, { status: 400 })
    }
  }




  try {
    const res = await db.query('UPDATE attendance SET status = ? WHERE user_id = ? AND date = ?', [status, user_id, date ])  
    
    if (res[0].affectedRows > 0) {
      return NextResponse.json({ message: 'Attendance confirmed successfully.' }, { status: 201 });
    }
    throw res[0].info;

  } catch (error) {
    
    console.log(error)
    return NextResponse.json({ message: error }, { status: 200 })
  }
}