"use client";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx"; 

export default function AdminViewRecords() {
  const [data, setData] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [users, setUsers] = useState(""); // State to store users' names
  const [user, setUser] = useState(""); // State to store selected user
  const [fromDate, setFromDate] = useState(""); // State to store 'from' date
  const [toDate, setToDate] = useState(""); // State to store 'to' date
  const [selectedRow, setSelectedRow] = useState(null);
  const [isMonthSelected, setIsMonthSelected] = useState(false); // State to handle all users report
  const [isRangeSelected, setIsRangeSelected] = useState(false); // State to handle all users report
  const [isMounted, setIsMounted] = useState(false); // State to handle all users report
  const [attendanceStatus, setAttendanceStatus] = useState("");
  const [totalWorkingDays, setTotalWorkingDays] = useState(0);
  const [presentDays, setPresents] = useState(0);
  const [late, setLate] = useState(0);
  const [leaves, setLeaves] = useState(0);
  const [absents, setAbsents] = useState(0);
  const [grade, setGrade] = useState('None');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(()=>{
    const fetchUsers = async () => {
      try {
        const users = await fetch('/api/admin/users');
        const usersData = await users.json();
        setUsers(usersData.users);
      } catch (error) {
        alert(error)
        console.error(error)
      }
    }

    fetchUsers();
  }, []);

  useEffect(()=>{
    const grade = calculateGrade(presentDays);
        setGrade(grade);
  }, [presentDays, data])

  // Function to calculate the grade based on present days
  const calculateGrade = (presentDays) => {
    if (((presentDays/totalWorkingDays)*100) < 75) return 'Short';
    if (((presentDays/totalWorkingDays)*100) >= 75) return 'Okay';
    return 'None';
  };


  const fetchAttendanceRecords = async () => {
    let url = `/api/admin/report?userId=${user}`;

    if (selectedMonth) {
      url += `&selectedMonth=${selectedMonth}`;
    } else if (fromDate && toDate) {
      url += `&fromDate=${fromDate}&toDate=${toDate}`;
    }

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await res?.json();
      setTotalWorkingDays(result.workingDays.length);
      if(result?.error){
        throw result.error
      }

      if (result) {
        // Process attendance data
        const presentsData = result?.presents?.map((attendance) => new Date(attendance?.date)?.toISOString()?.split('T')[0]);
        const lateData = result?.late?.map((attendance) => new Date(attendance?.date)?.toISOString()?.split('T')[0]);
        const leavesData = result?.leaves?.map((leave) => {
          const start = new Date(leave?.start_date)?.toISOString()?.split('T')[0];
          const end = new Date(leave?.end_date)?.toISOString()?.split('T')[0];
          return { start, end };
        });

        const workingDaysData = result?.workingDays?.map((wd) => new Date(wd?.date)?.toISOString()?.split('T')[0]);

        // Determine the attendance status for each working day
        const detailedData = workingDaysData?.map((date) => {
          const isPresent = presentsData?.includes(date);
          const isLate = lateData?.includes(date);
          const isLeave = leavesData?.some(
            (leave) => date >= leave?.start && date <= leave?.end
          );
          const isAbsent = !isPresent && !isLeave && !isLate;

          return {
            date,
            present: isPresent,
            late: isLate,
            leave: isLeave,
            absent: isAbsent,
          };
        });

        setData(detailedData);

        // Attendance summary
        const presentCount = detailedData?.filter((entry) => entry?.present)?.length;
        const lateCount = detailedData?.filter((entry) => entry?.late)?.length;
        const leaveCount = detailedData?.filter((entry) => entry?.leave)?.length;
        const absentCount = detailedData?.filter((entry) => entry?.absent)?.length;

        setPresents(presentCount);
        setLate(lateCount);
        setLeaves(leaveCount);
        setAbsents(absentCount);
        console.log("Presents:", presentDays, ", leaves:", ", absents:", absents, ", grade:", grade, ", late:", late, ", data:", data)
      }
    } catch (error) {
      alert("Error fetching attendance records:", error);
      console?.error("Error fetching attendance records:", error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    
    if (isMounted && user && (selectedMonth || isRangeSelected)) fetchAttendanceRecords();
  }, [user, selectedMonth, toDate]);

  const getGradeColor = (grade) => {
    if (grade === 'Short') return 'text-red-500';
    if (grade === 'Okay') return 'text-green-500';
    return 'text-gray-500'
  };

  // Function to download the table data as an Excel file
  const downloadExcel = () => {
    // Create a worksheet from the data
    const wsData = data?.map(row => ({
      Date: row?.date,
      User: row?.user,
      "Present Days": row?.present ? "✓" : "",
      "Absent Days": row?.absent ? "✓" : "",
      "Leave Days": row?.leave ? "✓" : "",
      "Late Days": row?.late ? "✓" : ""
    }));

    // Create a worksheet
    const ws = XLSX?.utils?.json_to_sheet(wsData);

    // Create a new workbook and add the worksheet
    const wb = XLSX?.utils?.book_new();
    XLSX?.utils?.book_append_sheet(wb, ws, "Attendance Report");

    // Write the workbook to a file
    XLSX?.writeFile(wb, "Attendance_Report?.xlsx");
  };

  const handleSaveEdit = async () => {
    if (!selectedRow) return;

    const status = attendanceStatus;
    const { date } = selectedRow;

    try {
      const res = await fetch('/api/admin/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          userId: user,
          status: status,
        }),
      });

      const result = await res.json();
      if (result?.error) {
        setMessage({type: 'error', text: result?.error})
        setTimeout(() => {
          setMessage({});
        }, 35000);
        throw result.error
      };
      
      // Update the local data
      const updatedData = data.map((row) => {
        if (row?.date === date) {
          return {
            ...row,
            present: status === 'present' ? true : false,
            absent: status ===  'absent'  ? true : false,
            leave: status  ===  'leave'   ? true : false,
            late: status   ===  'late'    ? true : false,
          };
        }
        return row;
      });

      const presentCount = updatedData?.filter((entry) => entry?.present)?.length;
      const lateCount = updatedData?.filter((entry) => entry?.late)?.length;
      const leaveCount = updatedData?.filter((entry) => entry?.leave)?.length;
      const absentCount = updatedData?.filter((entry) => entry?.absent)?.length;

      setPresents(presentCount);
      setLate(lateCount);
      setLeaves(leaveCount);
      setAbsents(absentCount);
      setData(updatedData);
      setSelectedRow(null); // Close modal
    } catch (error) {
      console.error("Error saving attendance status:", error);
    }
  };

  const handleEditClick = (row) => {
    setSelectedRow(row);
    setAttendanceStatus(row.present ? "present" : row.absent ? "absent" : row.leave ? "leave" : "late");
  };


  return (
    <div className="mx-auto p-4 md:p-6 lg:p-8 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold">Attendance Report</h2>

      <div className="px-16 my-8">
        <p className="text-lg font-semibold mb-4">Overall:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-5">
          <div className="flex flex-col text-center bg-[#ecf0f1] w-full px-5 py-7">
            <h3 className="text-2xl font-bold mb-2">{presentDays}</h3>
            <p className="text-lg font-medium">Present Days</p>
          </div>
          <div className="flex flex-col text-center bg-[#ecf0f1] w-full px-5 py-7">
            <h3 className="text-2xl font-bold mb-2">{absents}</h3>
            <p className="text-lg font-medium">Absent Days</p>
          </div>
          <div className="flex flex-col text-center bg-[#ecf0f1] w-full px-5 py-7">
            <h3 className="text-2xl font-bold mb-2">{leaves}</h3>
            <p className="text-lg font-medium">Leaves</p>
          </div>
          {/* <div className="flex flex-col text-center bg-[#ecf0f1] w-full px-5 py-7">
            <h3 className="text-2xl font-bold mb-2">{late}</h3>
            <p className="text-lg font-medium">Late</p>
          </div> */}
          <div className="flex flex-col text-center bg-[#ecf0f1] w-full px-5 py-7">
            <h3 className={`text-2xl font-bold mb-2 ${getGradeColor(grade)}`}>{grade}</h3>
            <p className="text-lg font-medium">Status</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <select
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedMonth}
          onChange={(e) => {setIsMonthSelected(true); setSelectedMonth(e?.target?.value)}}
          disabled={isRangeSelected}
        >
          <option value="">Select a month</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
      </div>

      {/* Date Range Selection */}
      <div className="flex space-x-4 mb-4">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => {setIsRangeSelected(true); setFromDate(e?.target?.value)}}
          className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isMonthSelected}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => {setIsRangeSelected(true); setToDate(e?.target?.value)}}
          className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isMonthSelected}
        />
      </div>

      {/* User Dropdown */}
      <div className="mb-4">
        <select
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={user}
          onChange={(e) => setUser(e?.target?.value)}
        >
          <option value="">Select a user</option>
          {
            users ? users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            )) : ''
          }
        </select>
      </div>

        {/* Download Button */}
      <div className="flex justify-between my-6">
          <button
            onClick={downloadExcel}
            className="ml-auto mr-0 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
          >
            Download as Excel
          </button>
      </div>

      {/* Table */}
      <table className="min-w-full bg-white border-collapse border border-gray-200 rounded-lg shadow-md">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-700">
            <th className="px-6 py-3 text-sm font-semibold">Date</th>
            <th className="px-6 py-3 text-sm font-semibold">Present Days</th>
            <th className="px-6 py-3 text-sm font-semibold">Absent Days</th>
            <th className="px-6 py-3 text-sm font-semibold">Leave Days</th>
            <th className="px-6 py-3 text-sm font-semibold">Edit Options</th>
          </tr>
        </thead>
        <tbody>
          {data?.length > 0 ? (
            data?.map((row, index) => {
              return (
              <tr key={index}>
                <td className="px-6 py-4 text-sm text-gray-700">{row?.date}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`w-5 h-5 border-2 rounded-md flex justify-center items-center ${row?.present ? "bg-green-500 text-white" : "border-gray-300"}`}
                  >
                    {row?.present && "✓"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`w-5 h-5 border-2 rounded-md flex justify-center items-center ${row?.absent ? "bg-red-500 text-white" : "border-gray-300"}`}
                  >
                    {row?.absent && "✓"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`w-5 h-5 border-2 rounded-md flex justify-center items-center ${row?.leave ? "bg-gray-500 text-white" : "border-gray-300"}`}
                  >
                    {row?.leave && "✓"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => handleEditClick(row)}
                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            )})
          ) : (
            <tr>
              <td
                colSpan="7"
                className="px-6 py-4 text-sm text-center text-gray-500"
              >
                No data found for the selected criteria?.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Edit Attendance Modal */}
      {selectedRow && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h3 className="text-lg font-semibold mb-4">Edit Attendance for {selectedRow?.user} on {selectedRow?.date}</h3>
            <div className="mb-4">
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e?.target?.value)}
              >
                <option value="" className="text-gray-500">select an option</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                {selectedRow.status !== 'present' && <option value="leave">Leave</option>}
              </select>
            </div>
            <div className="block">
            {message && typeof message!='object' ? (
              <p className={`mb-4 ${message?.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                {message?.text}
              </p>
            ) : message && typeof message == 'object' ? 
            <p className={`mb-4 ${message?.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {message?.text?.message}
          </p> 
          : null }

            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => setSelectedRow(null)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




