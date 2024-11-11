'use client'
import React, { useEffect, useState } from 'react'
import LogoutButton from './LogoutBtn'
import Logo from './Logo'
import Link from 'next/link'
import Sidebar from './Sidebar'

export default function Navbar() {

  const [menu, setMenu] = useState(false);

  const [isAdminPage, setIsAdminPage] = useState(false);

  useEffect(() => {
    // Check if the current URL includes 'admin'
    const currentURL = window.location.href;
    if (currentURL.includes('admin')) {
      setIsAdminPage(true);  // Set state to hide the sidebar on admin pages
    } else {
      setIsAdminPage(false); // Show sidebar on other pages
    }
  }, []);

  const handleToggleMenu = () => {
    setMenu(!menu);
  }

  return (
    <>
      {!isAdminPage && (
        <div className={`lg:block fixed md:hidden w-[40vw] right-0 lg:left-0 transition-all duration-300 ease-in-out transform ${menu ? 'translate-x-0 opacity-100' : 'translate-x-[200%] opacity-0 lg:translate-x-0 lg:opacity-100'}`}>
          <Sidebar />
        </div>
      )}
      
      <div className="py-5 fixed w-[100vw] bg-white lg:px-14 px-4 shadow-[260px_0_10px_#080f342f] flex justify-between items-center mb-6">
        <Logo />
        <div className="flex gap-8">

          <LogoutButton />

          <div className='text-black lg:hidden' onClick={handleToggleMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}
