"use client";

import React, { useEffect, useState } from 'react';

const LeaveRequestPage = ({ user }) => {
  const [leaveRequest, setLeaveRequest] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setLeaveRequest({ ...leaveRequest, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/leaves/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.userId,
          ...leaveRequest,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLoading(false);
        setMessage({ type: 'success', text: data.message });
        setIsSubmitted(true);
        setTimeout(() => {
          setMessage(null); // Reset message correctly
          setIsSubmitted(false);
        }, 2500);
      } else {
        const errorData = await res.json();
        setLoading(false);
        setMessage({ type: 'error', text: errorData.message });
        setTimeout(() => {
          setMessage(null); // Reset message correctly
        }, 2500);
      }
    } catch (error) {
      setLoading(false);
      console.log('Error:', error);
      setMessage({ type: 'error', text: error.message || 'An error occurred.' });
      setTimeout(() => {
        setMessage(null); // Reset message correctly
      }, 2500);
    }
  };

  if (!isMounted) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8 bg-white rounded shadow-md">
      <h2 className="text-lg font-bold mb-4">Request a Leave</h2>

      {/* Show success or error message */}
      {message && !loading && (
        <p className={`mb-4 ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
            Start Date
          </label>
          <input
            className="bg-gray-200 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            type="date"
            id="startDate"
            name="startDate"
            value={leaveRequest.startDate}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
            End Date
          </label>
          <input
            className="bg-gray-200 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            type="date"
            id="endDate"
            name="endDate"
            value={leaveRequest.endDate}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reason">
            Reason
          </label>
          <textarea
            className="bg-gray-200 min-h-32 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            id="reason"
            name="reason"
            value={leaveRequest.reason}
            onChange={handleChange}
            required
          />
        </div>

        <p className="text-sm my-4">Leave will be requested for the selected date range.</p>

        <button
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Request Leave'}
        </button>
      </form>

      {/* Show success message after submission */}
      {isSubmitted && !loading && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Leave request submitted successfully!
        </div>
      )}
    </div>
  );
};

export default LeaveRequestPage;
