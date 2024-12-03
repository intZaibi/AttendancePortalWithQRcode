import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';

const AttendancePortal = () => {

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGenerateQR = async () => {
    setQrCodeData('');
    const isoDate = new Date().toISOString();
    const qrData =`Date: ${isoDate.split('T')[0]}`;
    setQrCodeData(qrData);

    try {

      // Save QR data to the backend for validation
      const response = await fetch('/api/admin/markWorking', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json()
          setQrCodeImage(data.qrCode);
          toast.success('QR Code generated successfully!')
  
          setTimeout(()=>{
            setQrCodeImage(null);
          }, 15 * 60 * 1000)
      } else {
        const data = await response.json();
        throw data.message;
      }
      // alert('QR Code generated successfully!');
    } catch (err) {
      setLoading(false)
      if(err?.message?.includes("'root'@'localhost'"))
        setMessage('Database connection failed!!!')
      else {
      console.error(err);
      setMessage(err)
      toast.success('QR Code generation failed!')
      setTimeout(() => {
        setMessage(null)
      }, 5000);
    }
    }
  };

  if (!isMounted) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8 bg-white rounded shadow-md">
      <ToastContainer />
      <h2 className="text-lg font-bold mb-4">Mark Working Days</h2>
      
      {message && !loading ?  (
        <p className={`mb-4 text-red-500`}>
          {message}
        </p>
      ): ''}

      <div className='flex flex-col items-center'>
        {qrCodeImage && (
          <div className=''>
            <img src={qrCodeImage} alt="QR Code" />
            <p className='text-center'>{qrCodeData}</p>
          </div>
        )}
        <button className='my-2 py-2 px-4 rounded-xl text-white hover:bg-green-600  bg-green-500' onClick={handleGenerateQR}>Generate QR Code</button>
      </div>

      <div className=''>
        <p className='text-sm my-4'>The selected date will be marked as a working day.</p>
      </div>
    </div>
  );
};

export default AttendancePortal;
