import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET(req) {
  const url = req.url;
  const urlParams = new URLSearchParams(url.split('?')[1]); 
  const userId = urlParams.get('userId');

  console.log('userId in profile get api:', userId)
  
  if (!userId) {
    return NextResponse.json({message: 'Invalid request: userId not found.'}, { status: 500 });
    }

  try {
    const res = await db.query(
      'SELECT profile_picture FROM users WHERE id = ?',
      [userId]
    );
    console.log(res[0][0])

    if(!res[0][0]?.profile_picture)
      return NextResponse.json({ message: 'Image Not Found' }, { status: 404 });
    return NextResponse.json({ profilePicture: res[0][0]?.profile_picture }, { status: 201 });
  } catch (error) {
    console.log('error while fetching profile pic from db:',error)
    return NextResponse.json({ error }, { status: 400 });
  }
}

export async function POST(req) {
  const {imageURL, userId} = await req.json();
  console.log('ImageURL and userId in profile post api:', userId, imageURL)


  if (!imageURL || !userId) {
    console.log('Invalid request')

    return NextResponse.json({message: 'Invalid request'}, { status: 500 });
    }

    try {
      const res = await db.query(
        'UPDATE users SET profile_picture = ? WHERE id = ?',
        [imageURL, userId]
      );
      console.log(res[0][0])
      return NextResponse.json({ message: 'Image uploaded successfully' }, { status: 201 });
    } catch (error) {
      console.log(error)
      return NextResponse.json({ message: 'Image uploading failed' }, { status: 400 });
    }
}