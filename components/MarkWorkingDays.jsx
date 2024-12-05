import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
          }, 60 * 1000)
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
      toast.error('QR Code generation failed!')
      setTimeout(() => {
        setMessage(null)
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
            <img src={qrCodeImage} alt="QR Code" width={700}/>
            <p className='text-center'>{qrCodeData}</p>
          </div>
        )}
        <button className='my-2 py-2 px-4 rounded-xl text-lg text-white hover:bg-green-600  bg-green-500' onClick={handleGenerateQR}>Start Roll Call</button>
      </div>

      <div className=''>
        {qrCodeImage ? <p className='text-lg my-4'>Please scan the QR code!</p> : <p className='text-lg my-4'>Get ready for roll call !!!</p>}
      </div>
    </div>
  );
};

export default AttendancePortal;
