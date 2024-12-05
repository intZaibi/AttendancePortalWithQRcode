import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function GET(req) {
  const url = req.url;
  const urlParams = new URLSearchParams(url.split('?')[1]); 
  const prevId = urlParams.get('prevId');

  const resp = await db.query('SELECT user_id, id FROM attendance WHERE id > ? AND date = CURDATE() ORDER BY id ASC', [prevId]);
  console.log('resp:',resp);
  if(resp[0].length > 0){

    const names = await db.query('SELECT name, id FROM users');
    console.log('message: yes', 'markedStudents:', resp[0], 'studentNames:', names[0], 'NewLastId:', resp[0][(resp[0].length-1)].id);
    return NextResponse.json({message: 'yes', markedStudents: resp[0], names: names[0], newLastId: resp[0][(resp[0].length-1)].id}, {status: 200})
  }

  return NextResponse.json({message: 'no'}, {status: 200});
}
