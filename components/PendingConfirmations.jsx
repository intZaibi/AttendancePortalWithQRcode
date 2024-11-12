'use client'
import React, { useEffect, useState } from "react";

export default function PendingConfirmations() {
  const [data, setData] = useState([]);
  const [message, setMessage] = useState({});

  useEffect(() => {
    const fetchPendingConfirmations = async () => {
      const response = await fetch('/api/admin/confirmations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();

      setData(data.data);
      };

      fetchPendingConfirmations();
  }, [])
  
  const handleConfirm = async (user_id, date) => {
    try {

      const res = await fetch('/api/admin/confirmations',{
        method : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date,
          user_id,
          status: 'approved'
        })
      })
      const response = await res.json()
      console.log('Response got from API after updating attendance:',response.message)
      if(res.ok){
        setData(prevData => prevData.filter(item => !((item.user_id == user_id) && (item.date == date))));
        setMessage({ type: 'success', text: 'Attendance Confirmed Successfully.'})

        setTimeout(() => {
          setMessage({})
        }, 2500);
      } else
      throw response.message;

    } catch (error) {
      
      console.log('got error from API while updating:',error)
      setMessage({ type: 'error', text: error})

      setTimeout(() => {
        setMessage({})
        
      }, 2500);
    }
  };


  const handleReject = async (user_id, date) => {
    try {
      
      const res = await fetch('/api/admin/confirmations',{
        method : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date,
          user_id,
          status: 'rejected'
        })
      })
      const response = await res.json()
      console.log(response.message)
      if(res.ok){
        setData(prevData => prevData.filter(item => !((item.user_id == user_id) && (item.date == date))));
        setMessage({ type: 'success', text: 'Attendance Rejected.'})

        setTimeout(() => {
          setMessage({})
        }, 2500);
      } else
      throw response.message;

    } catch (error) {
      
      console.log(error)
      setMessage({ type: 'error', text: error})

      setTimeout(() => {
        setMessage({})
      }, 2500);
    }
  };

  return (
    <div className="overflow-x-auto p-2">
      {message && (
        <p className={`mb-4 ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
          {message.text}
        </p>
      )}
      <table className="min-w-[75vw] bg-white shadow-[0_4px_20px_#080f341a] rounded-lg">
        <thead>
          <tr className="text-left font-semibold text-gray-700">
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Student Name</th>
            <th className="px-6 py-3">Attendance</th>
            <th className="px-6 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {data ? 
          (data?.map((student, key) => (
            <tr key={key} className="border-t hover:bg-gray-50">
              <td className="px-6 py-2 text-gray-600">{student.date}</td>
              <td className="px-6 py-2 text-gray-800">{student.name}</td>
              <td className="px-6 py-2 text-gray-600">{student.status}</td>
              <td className="px-6 py-2">
                <button
                  onClick={() => handleConfirm(student.user_id, student.date)}
                  className="px-4 bg-green-500 text-white rounded-lg transition-transform duration-300 hover:bg-green-600 focus:outline-none"
                >
                  Confirm
                </button>
                <button
                  onClick={() => handleReject(student.user_id, student.date)}
                  className="px-4 bg-red-500 text-white rounded-lg transition-transform duration-300 hover:bg-red-600 focus:outline-none"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))) : (<p>No data available yet</p>)}  
        </tbody>
      </table>
      
      {data.length === 0 ? (
        <div className="w-full text-center text-lg font-bold my-4">
          <p>No data available yet</p>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
