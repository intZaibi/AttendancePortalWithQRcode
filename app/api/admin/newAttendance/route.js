import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function GET(req) {
  const url = req.url;
  const urlParams = new URLSearchParams(url.split('?')[1]); 
  const prevId = urlParams.get('prevId');
  console.log('prevId:', prevId);
  const resp = await db.query('SELECT user_id, id FROM attendance WHERE id > ? AND date = CURDATE()', [prevId]);
  console.log('resp:',resp);
  if(resp[0].length > 0){

    const student = await db.query(
      'SELECT name FROM users WHERE id = ?',
      [resp[0][0].user_id]
    );
    console.log('message: yes', 'studentId:', resp[0][0].user_id, 'studentName:', student[0][0].name);
    return NextResponse.json({message: 'yes', studentId: resp[0][0].user_id, studentName: student[0][0].name, newId: resp[0][0].id}, {status: 200})
  }

  return NextResponse.json({message: 'no'}, {status: 200});
}
