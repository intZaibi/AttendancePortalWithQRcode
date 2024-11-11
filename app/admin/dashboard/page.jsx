'use client'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/AdminSidebar'
import ViewRecords from '@/components/AdminViewRecords'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Dashboard() {

  const router = useRouter();
  
  useEffect(() => {
    // Function to fetch and verify the token
    const verifyUserToken = async () => {
      try {
        // Fetch request to verify the token (adjust URL to your backend API)
        const response = await fetch('/api/signIn', {
          method: 'GET',
          headers:{
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + Cookies.get('token'),
          }, // Make sure cookies are sent if the token is stored there
        });
        if (!response.ok) {
          console.error('Token verification failed');
          router.push("/auth/signIn")
        }

        const data = await response.json();
        if(data.role === 'student')
          router.push("/auth/signIn");
        

        // Check if the token is valid and if we got the expected user info
        if (data.error) {
          throw data.error
        }

      } catch (err) {
        console.log('An error occurred: ' + err.message);
      }
    };

    // Call the function to verify the token when the component mounts
    verifyUserToken();
  }, []);

  return (
    <div>
      <Sidebar/>
      <Navbar/>
      <div className="pl-[20vw] pr-10 pt-24 w-full mx-auto">
        <ViewRecords/>
      </div>
    </div>
  )
}
