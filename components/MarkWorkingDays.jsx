import React, { useState } from 'react';

const AttendancePortal = () => {

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');

  const handleDateChange = (event) => {
    setDate( event.target.value );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/markWorking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLoading(false);
        setMessage({ type: 'success', text: data.message });
      } else {
        const errorData = await res.json();
        setLoading(false);
        setMessage({ type: 'error', text: errorData.message });
      }
    } catch (error) {
      setLoading(false);
      setMessage({ type: 'error', text: 'An error occurred while marking working day.' });
      console.error(error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8 bg-white rounded shadow-md">
      <h2 className="text-lg font-bold mb-4">Mark Working Days</h2>
      
      {message && !loading ?  (
        <p className={`mb-4 ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
          {message.text}
        </p>
      ): ''}

      <form onSubmit={handleSubmit}>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
            {'Date: (mm/dd/yyyy)'}
          </label>
          <input
            className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
            id="date"
            type="date"
            value={date}
            onChange={handleDateChange}
          />
        </div>
        
        <button
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="submit"
        >
          {loading ? 'Marking the day...' : "Mark"}
        </button>
      </form>

      <div className=''>
        <p className='text-sm my-4'>The selected date will be marked as a working day.</p>
      </div>
    </div>
  );
};

export default AttendancePortal;
