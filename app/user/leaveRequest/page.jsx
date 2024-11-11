'use client'

import LeaveRequestPage from '@/components/LeaveRequest'
import Navbar from '@/components/Navbar'
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

export default function LeaveRequest() {
  const router = useRouter();
  
  const [user, setUser] = useState(null);

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

        // Check if the token is valid and if we got the expected user info
        if (data.error) {
          throw data.error
        } else {
          setUser(data); // Assuming data contains user information (id, role, etc.)
        }
      } catch (err) {
        console.log('An error occurred: ' + err.message);
      }
    };

    // Call the function to verify the token when the component mounts
    verifyUserToken();
  }, []);
  return (
    <div className='overflow-x-hidden'>
      <Navbar/>
      <div className="pl-[20vw] pr-10 pt-28 w-full mx-auto">
        <LeaveRequestPage user={user}/>
      </div>
    </div>
  )
}
