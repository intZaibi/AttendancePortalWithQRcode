import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AttendancePortal = () => {

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [newId, setNewId] = useState(0);

  useEffect(() => {
    setIsMounted(true);

    // Initial data fetch
    fetchData();
    // Set up polling every 5 seconds
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000); // Poll every 5 seconds

    // Cleanup on component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures the effect runs only once

  // Function to fetch data from the API
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/newAttendance?prevId=${newId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }); // Replace with your API endpoint
      if (!response.ok) throw new Error('Failed to check new attendance');
      const result = await response.json();
      if (result.message === 'yes') {
        // Using a functional update to ensure the latest value is used
        setNewId((prevId) => {
          if (result.newId !== prevId) {
            toast(`Roll no: ${result.studentId}, ${result.studentName} has marked the attendance!`);
          }
          return result.newId;
        });
      }
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    setQrCodeData('');
    const isoDate = new Date().toISOString();
    const qrData = `Date: ${isoDate.split('T')[0]}`;
    setQrCodeData(qrData);

    try {
      // Save QR data to the backend for validation
      const response = await fetch('/api/admin/markWorking', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeImage(data.qrCode);
        toast.success('QR Code generated successfully!');

        setTimeout(() => {
          setQrCodeImage(null);
        }, 60 * 1000);
      } else {
        const data = await response.json();
        throw data.message;
      }
    } catch (err) {
      setLoading(false);
      if (err?.message?.includes("'root'@'localhost'"))
        setMessage('Database connection failed!!!');
      else {
        console.error(err);
        setMessage(err);
        toast.error('QR Code generation failed!');
        setTimeout(() => {
          setMessage(null);
        }, 10000);
      }
    }
  };

  if (!isMounted) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6 bg-white rounded shadow-md">
      <ToastContainer />
      <h2 className="text-xl font-bold mb-4">Attendance</h2>
      
      {message && !loading ?  (
        <p className={`mb-4 text-red-500`}>
          {message}
        </p>
      ): ''}

      <div className='flex flex-col items-center'>
        {qrCodeImage && (
          <div className=''>
            <img src={qrCodeImage} alt="QR Code" width={700} />
            <p className='text-center'>{qrCodeData}</p>
          </div>
        )}
        <button className='my-2 py-2 px-4 rounded-xl text-lg text-white hover:bg-green-600 bg-green-500' onClick={handleGenerateQR}>
          Start Roll Call
        </button>
      </div>

      <div className=''>
        {qrCodeImage ? <p className='text-lg my-4'>Please scan the QR code!</p> : <p className='text-lg my-4'>Get ready for roll call !!!</p>}
      </div>
    </div>
  );
};

export default AttendancePortal;
