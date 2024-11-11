import React, { useEffect, useState } from 'react';

const AttendancePortal = ({user}) => {

  const [username, setUsername] = useState(null);

  useEffect(() => {
  const fetchUsers = async () => {
    const res = await fetch(`/api/admin/users?id=${user?.userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        },
    })
    const name = await res.json();
    setUsername(name.username);
  }

  fetchUsers()
  }, [user])
  

  const [attendance, setAttendance] = useState({
    date: new Date().toISOString().split('T')[0],
    studentId: user?.userId,
    status: 'Present',
  });

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDateChange = (event) => {
    setAttendance({ ...attendance, date: event.target.value });
  };

  const handleStatusChange = (value) => {
    setAttendance({ ...attendance, status: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.userId,
          date: attendance.date,
          status: attendance.status
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
      setMessage({ type: 'error', text: 'An error occurred while marking attendance.' });
      console.error(error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8 bg-white rounded shadow-md">
      <h2 className="text-lg font-bold mb-4">Mark Attendance</h2>
      
      {message && !loading ?  (
        <p className={`mb-4 ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
          {message.text}
        </p>
      ): ''}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <span className="block text-gray-700 text-sm font-bold mb-2">
            Student Details:
          </span>
          <div className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500">
            <div>
              <span className='font-medium'>Name: </span>
              {username}
            </div>
            <div className='mt-2'>
              <span className='font-medium'>Id: </span>
              {user?.userId}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
            {'Date: (mm/dd/yyyy)'}
          </label>
          <input
            className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
            id="date"
            type="date"
            value={attendance.date}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
            Status:
          </label>
          <select
            className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
            id="status"
            value={attendance.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="Present">Present</option>
            <option value="Late">Late</option>
          </select>
        </div>

        <button
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="submit"
        >
          {loading ? 'Mark Attendance...' : "Mark Attendance"}
        </button>
      </form>

      <div className=''>
        <p className='text-sm my-4'>Attendance will be marked for the selected date according to status.</p>
      </div>
    </div>
  );
};

export default AttendancePortal;
