import db from '@/lib/db'
import { NextResponse } from 'next/server';

export async function POST(req){
  const { date } = await req.json();
  try {
    const existingWorkingDays = await db.query('SELECT date FROM working_days WHERE date = ?', [date]);
    
    if (existingWorkingDays[0].length > 0) {
      return NextResponse.json({ message: 'Date already marked' }, { status: 400});
    }

    await db.query('INSERT INTO working_days (date) VALUE (?)', [date]);
    return NextResponse.json({ message: 'Date added successfully' }, { status: 201 });

  } catch (error) {

    console.error(error);
    return NextResponse.json({ message: error }, { status: 500 });
  }
}