import React, { useEffect, useState } from 'react';
import QRScanner from 'qr-scanner';

const MarkAttendance = ({ userId }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false); // Track scanning state
  const [scanner, setScanner] = useState(null); // Store scanner instance
  const [attendanceChecked, setAttendanceChecked] = useState(false); // To track if attendance is checked
  const [attendanceMarked, setAttendanceMarked] = useState(false); // To track if attendance is already marked
  const [hasPermission, setHasPermission] = useState(false); // State to track camera permission
  const [videoStream, setVideoStream] = useState(null); // State to store video stream object
  const [errorMessage, setErrorMessage] = useState(''); // State for error message

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && userId) {
      checkAttendance(); // Check if attendance is marked when the component mounts
    }
  }, [isMounted]);

  const checkAttendance = async () => {
    try {
      const resp = await fetch('/api/checkAttendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (resp.ok) {
        setAttendanceChecked(true);
      } else {
        setAttendanceMarked(true);
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
      setError(true);
    }
  };

  const handleQRCodeScan = async (data) => {
    setScanned(true);
    const parsedData = JSON.parse(data); // Parse the QR code data

    try {
      if (scanner) {
        await scanner.stop(); // Stop the scanner properly
        setIsScanning(false); // Update scanning state
      }

      const resp = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: parsedData.uuid,
          date: parsedData.date,
          userId, // Directly access userIdId from props
        }),
      });
      if (resp.ok) {
        alert('Attendance Marked Successfully!!!');
        setSuccess(true);
        stopScanning();
        return;
      } else {
        setError(true);
        return;
      }
    } catch (error) {
      setError(true);
      console.error("Error marking attendance:", error);
    }
  };

  const handleQRCodeError = (error) => {
    console.error("QR Code Scanning Error: ", error);
  };

  const startScanning = () => {
    setIsScanning(true); // Set scanning state to true
    if (!scanner) return;
    // Start the QR scanner
    scanner.start()?.catch(handleQRCodeError);
  };

  const stopScanning = () => {
    setIsScanning(false); // Update scanning state
    if (scanner) {
      scanner.stop()?.catch(handleQRCodeError); // Stop the scanner
    }
  };

  useEffect(() => {
    if (!isMounted) return;

    const videoElement = document.getElementById('qr-reader'); // Get the video element
    if (!videoElement) {
      console.error('Video element not found');
      return;
    }

    const scannerInstance = new QRScanner(videoElement, handleQRCodeScan, handleQRCodeError);
    setScanner(scannerInstance); // Store the scanner instance

    return () => {
      if (scannerInstance) {
        scannerInstance.stop()?.catch(handleQRCodeError);
      }
    };
  }, [isMounted]);

  const handleCameraPermission = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // Set the video stream to state so that we can render it
      setVideoStream(stream);
      setHasPermission(true);
      setErrorMessage('');
    } catch (error) {
      setHasPermission(false);
      setErrorMessage('Permission denied or camera not available.');
      console.error('Error accessing camera:', error);
    }
  };

  const handleStopCamera = () => {
    if (videoStream) {
      const tracks = videoStream.getTracks();
      tracks.forEach(track => track.stop()); // Stop all tracks
    }
    setVideoStream(null);
    setHasPermission(false);
    setErrorMessage('');
  };

  if (!isMounted) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="lg:max-w-2xl lg:mx-auto m-2 p-10 lg:p-8 bg-white rounded shadow-lg lg:shadow-md">
      <h2 className="text-2xl font-bold mb-4">Mark Attendance</h2>

      {success && (
        <p className="my-10 py-5 text-center text-2xl font-bold text-green-500">Attendance marked successfully!</p>
      )}
      {(error || attendanceMarked) && (
        <p className="my-10 py-5 text-center text-2xl font-bold text-red-500">{attendanceMarked ? 'Attendance already marked for today!' : 'Attendance Mark Failed!'}</p>
      )}

      {/* Show Start/Stop scanning buttons */}
      {!scanned && !attendanceMarked && (
        <div className="flex flex-col items-center pb-6">
          <h1 className="mb-2">Scan QR Code to Mark Attendance</h1>
          <video
            id="qr-reader"
            className="border-4 lg:w-[390px] w-full h-[300px] rounded-lg shadow-lg bg-white p-4"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
      )}

      {/* Camera Permission Button */}
      <div className="mt-4">
        {!hasPermission ? (
          <button
            onClick={handleCameraPermission}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Allow Camera Access
          </button>
        ) : (
          <button
            onClick={handleStopCamera}
            className="bg-red-500 text-white p-2 rounded"
          >
            Stop Camera
          </button>
        )}
      </div>

      {/* Show Start/Stop scanning buttons */}
      {!isScanning && !scanned && !attendanceMarked ? (
        <button
          onClick={startScanning}
          className="mt-4 bg-green-500 text-white p-2 rounded"
        >
          Start Scanning
        </button>
      ) : !scanned && !attendanceMarked && (
        <button
          onClick={stopScanning}
          className="mt-4 bg-red-500 text-white p-2 rounded"
        >
          Stop Scanning
        </button>
      )}

      {/* Error handling */}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
};

export default MarkAttendance;
