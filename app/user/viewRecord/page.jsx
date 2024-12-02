'use client'

import Navbar from '@/components/Navbar'
import Cookies from 'js-cookie';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

// Dynamically import ViewRecords to handle client-side rendering
const ViewRecords = dynamic(() => import('@/components/ViewRecords'), { ssr: false });

export default function ViewRecord() {
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to true after the component mounts to handle SSR issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Function to verify user token and fetch user data
  const verifyUserToken = async () => {
    try {
      const response = await fetch('/api/signIn', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setUser(data);
    } catch (err) {
      console.error(err);
      router.push("/auth/signIn");
    }
  };

  useEffect(() => {
    if (isMounted) {
      verifyUserToken(); // Fetch user data after the component mounts
    }
  }, [isMounted]);

  if (!isMounted) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <div className="pl-[20vw] pr-10 py-28 w-full mx-auto">
        {user ? <ViewRecords user={user} /> : <ViewRecords />}
      </div>
    </div>
  );
}
