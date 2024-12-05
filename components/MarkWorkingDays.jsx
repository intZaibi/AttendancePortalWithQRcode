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
  const [counter, setCounter] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setIsMounted(true);

    // Set up polling after a time interval
    const intervalId = setInterval(() => {
      setCounter(prevCounter => prevCounter + 1)
    }, 3000); // Poll time

    // Cleanup on component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures the effect runs only once

  useEffect(()=>{
    fetchData();
  }, [counter])
  
  useEffect(()=>{
    if (isMounted) {
      toast(`Roll no: ${toastMessage.user_id}, ${toastMessage.name} has marked the attendance!`);
    }
  }, [toastMessage])

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
        //generating toasts for each student and Using a functional update to ensure the latest value is used
        setNewId((prevId) => {
          if (result.newLastId !== prevId) {
            result.markedStudents.forEach((student) => {
              // Find the student name by matching user_id with names.id
              const studentName = result.names.find((nameObj) => nameObj.id === student.user_id)?.name;
              
              // If a name is found, toast the message
              if (studentName) {
                setToastMessage({user_id: student.user_id, name: studentName})
                // toast(`Roll no: ${student.user_id}, ${studentName} has marked the attendance!`);
              } else {
                // Optionally handle the case where the name is not found
                console.error(`Name for user_id ${student.user_id} not found!`);
              }
            });
          }
          return result.newLastId;
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
    <div className="p-4 text-center md:p-6 bg-white rounded shadow-md">
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

      <div className=' text-center'>
        {qrCodeImage ? <p className='text-lg my-4'>Please scan the QR code!</p> : <p className='text-lg my-4'>Get ready for roll call !!!</p>}
      </div>
    </div>
  );
};

export default AttendancePortal;
