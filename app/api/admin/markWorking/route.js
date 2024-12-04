import db from '@/lib/db'
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export async function GET(){
  const qrId = uuidv4();
  const date = new Date();

  try {
      // Check for previously generated QR Code
      const res = await db.query("SELECT uuid, status FROM qrcode WHERE date = ?", [date.toISOString().split('T')[0]]);
      // If Qr Code is active
      if(res[0].length > 0 && res[0][0]?.status === 'active'){
        const qrData = { uuid: res[0][0].uuid, date: date.toISOString().split('T')[0] }
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData, {width: 700}));
        
        return NextResponse.json({ qrCode }, { status: 200 });
      } else if(res[0].length > 0 && res[0][0]?.status === 'expired') {
        //expired QR Code
        return NextResponse.json({ message: 'QR Code is expired for today. Now you have to mark attendance manually or comeback tomorrow!' }, { status: 400 });
      }
      
      // Generating new QR Code
      const qrData = { uuid: qrId, date: date.toISOString().split('T')[0] };
      const qrCode = await QRCode.toDataURL(JSON.stringify(qrData, {width: 320}));
      
      // Save QR code data to the database
      await db.query(
          'INSERT INTO qrcode (uuid, date) VALUES (?, ?)',
          [qrId, date]
      );

      return NextResponse.json({ qrCode }, { status: 200 });
            
  } catch (error) {

    console.error(error);
    return NextResponse.json({ message: error }, { status: 500 });
  }
}
