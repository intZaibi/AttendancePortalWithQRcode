import { NextResponse } from "next/server";
import db from '@/lib/db'

export async function GET(req){
    const url = req.url;
    const urlParams = new URLSearchParams(url.split('?')[1]); 
    const userId = urlParams.get('id');
    if(userId){
      try {
        
        const username = await db.query("SELECT name FROM users WHERE id = ?", [userId]);

        if(username[0].length <= 0)
          return NextResponse.json({ message: 'User not found!' }, { status: 404 });
        
        return NextResponse.json({ username: username[0][0].name }, { status: 200 })
      } catch (error) {

        console.log(error)
        return NextResponse.json({ message: 'User fetching failed.' }, { status: 200 })
      }
    }

  //getting users from MySQL db
  try{
    const users = await db.query('SELECT * FROM users');

    if(!users[0].length)
      return NextResponse.json({message: 'No users found'}, {status: 404});

    return NextResponse.json({users: users[0]}, {status: 201});

  } catch (error) {

    console.error(error);
    return NextResponse.json({error: 'Error fetching users'}, {status: 500});
  }
}