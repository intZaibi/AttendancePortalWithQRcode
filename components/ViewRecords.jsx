"use client";
import React, { useState, useEffect } from "react";

export default function ViewRecords({user}) {
  const [data, setData] = useState([])

  // State for search input
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [grade, setGrade] = useState('');
  const [presents, setPresents] = useState(0);
  const [late, setlate] = useState(0);
  const [leaves, setLeaves] = useState(0);
  const [absents, setAbsents] = useState(0);
  const [fromDate, setFromDate] = useState(""); // State to store 'from' date
  const [toDate, setToDate] = useState(""); // State to store 'to' date
  const [isMounted, setIsMounted] = useState(false); // State to store 'to' date
  const [isMonthSelected, setIsMonthSelected] = useState(false); // State to store 'to' date
  const [isRangeSelected, setIsRangeSelected] = useState(false); // State to store 'to' date


  const fetchAttendanceRecords = async () => {
    let url = `/api/records?userId=${user.userId}`;

    if (searchQuery) {
      url += `&searchQuery=${searchQuery}`;
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

      const result = await res.json();
      
      if (result) {
        // Process attendance data
        const presentsData = result.presents?.map((attendance) => new Date(attendance.date).toISOString().split('T')[0]);
        const lateData = result.late?.map((attendance) => new Date(attendance.date).toISOString().split('T')[0]);
        const leavesData = result.leaves?.map((leave) => {
          const start = new Date(leave.start_date).toISOString().split('T')[0];
          const end = new Date(leave.end_date).toISOString().split('T')[0];
          return { start, end };
        });

        const workingDaysData = result.workingDays?.map((wd) => new Date(wd.date).toISOString().split('T')[0]);
        
        // Determine the attendance status for each working day
        const detailedData = workingDaysData?.map((date) => {
          const isPresent = presentsData.includes(date);
          const islate = lateData.includes(date);
          const isLeave = leavesData.some(
            (leave) => date >= leave.start && date <= leave.end
          );
          const isAbsent = (!isPresent && !islate) && !isLeave;

          return {
            date,
            present: isPresent,
            late: islate,
            leave: isLeave,
            absent: isAbsent,
          };
        });

        setData(detailedData);

        // Attendance summary
        const presentCount = detailedData?.filter((entry) => entry.present)?.length;
        const lateCount = detailedData?.filter((entry) => entry.late)?.length;
        const leaveCount = detailedData?.filter((entry) => entry.leave)?.length;
        const absentCount = detailedData?.filter((entry) => entry.absent)?.length;

        setPresents(presentCount);
        setlate(lateCount);
        setLeaves(leaveCount);
        setAbsents(absentCount);
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    if (isMounted) fetchAttendanceRecords();
  }, [searchQuery, toDate]);

  useEffect(() => {
    setAttendanceSummary({ presents, leaves, absents, late });
  }, [absents, presents, leaves, late]);

  const calculateGrade = (presentDays) => {
    if (presentDays >= 26) return 'A';
    if (presentDays >= 20) return 'B';
    if (presentDays >= 15) return 'C';
    if (presentDays >= 10) return 'D';
    if (presentDays >= 1) return 'F';
    return 'None';
  };

  useEffect(() => {
    const result = calculateGrade(attendanceSummary.presents);
    setGrade(result);
  }, [attendanceSummary]);

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-500';
      case 'B': return 'text-blue-500';
      case 'C': return 'text-purple-500';
      case 'D': return 'text-yellow-500';
      case 'F': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };


  return (
    <div className="mx-auto flex flex-col p-4 md:p-6 lg:p-8 bg-white rounded shadow-md">
  <h2 className="text-2xl font-bold">Attendance Report</h2>

  <div className="px-10 my-8">
    <p className="text-lg font-semibold mb-4">Overall:</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div className="flex flex-col text-center bg-[#ecf0f1] w-full p-5">
        <h3 className="text-2xl font-bold mb-2">{attendanceSummary.presents || 0}</h3>
        <p className="text-lg font-medium">Present Days</p>
      </div>
      <div className="flex flex-col text-center bg-[#ecf0f1] w-full p-5">
        <h3 className="text-2xl font-bold mb-2">{attendanceSummary.absents || 0}</h3>
        <p className="text-lg font-medium">Absent Days</p>
      </div>
      <div className="flex flex-col text-center bg-[#ecf0f1] w-full p-5">
        <h3 className="text-2xl font-bold mb-2">{attendanceSummary.leaves || 0}</h3>
        <p className="text-lg font-medium">Leaves</p>
      </div>
      <div className="flex flex-col text-center bg-[#ecf0f1] w-full p-5">
        <h3 className="text-2xl font-bold mb-2">{attendanceSummary.late || 0}</h3>
        <p className="text-lg font-medium">Late</p>
      </div>
      <div className="flex flex-col text-center bg-[#ecf0f1] w-full p-5">
        <h3 className={`text-2xl font-bold mb-2 ${getGradeColor(attendanceSummary.grade)}`}>{grade}</h3>
        <p className="text-lg font-medium">Grade</p>
      </div>
    </div>
  </div>

  {/* Search Bar */}
  <div className="mb-4">
    <select
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={searchQuery}
      onChange={(e) => {
        setIsMonthSelected(true);
        setSearchQuery(e.target.value)
      }}
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
  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
    <input
      type="date"
      value={fromDate}
      onChange={(e) => {setIsRangeSelected(true); setFromDate(e.target.value)}}
      className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      max={new Date().toISOString().split('T')[0]}
      disabled={isMonthSelected}
    />
    <input
      type="date"
      value={toDate}
      onChange={(e) => {setIsRangeSelected(true); setToDate(e.target.value)}}
      className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      max={new Date().toISOString().split('T')[0]}
      disabled={isMonthSelected}
    />
  </div>

  {/* Table */}
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white border-collapse border border-gray-200 rounded-lg shadow-md">
      <thead>
        <tr className="bg-gray-100 text-left text-gray-700">
          <th className="px-6 py-3 text-sm font-semibold">Date (working days)</th>
          <th className="px-6 py-3 text-sm font-semibold">Present Days</th>
          <th className="px-6 py-3 text-sm font-semibold">Absent Days</th>
          <th className="px-6 py-3 text-sm font-semibold">Leave Days</th>
          <th className="px-6 py-3 text-sm font-semibold">Late Days</th>
        </tr>
      </thead>
      <tbody>
        {data?.length > 0 ? (
          data?.map((row, index) => (
            <tr key={index}>
              <td className="px-6 py-4 text-sm text-gray-700">{row.date}</td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`w-5 h-5 border-2 rounded-md flex justify-center items-center ${row.present ? "bg-green-500 text-white" : "border-gray-300"}`}
                >
                  {row.present && "✓"}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`w-5 h-5 border-2 rounded-md flex justify-center items-center ${row.absent ? "bg-red-500 text-white" : "border-gray-300"}`}
                >
                  {row.absent && "✓"}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`w-5 h-5 border-2 rounded-md flex justify-center items-center ${row.leave ? "bg-gray-500 text-white" : "border-gray-300"}`}
                >
                  {row.leave && "✓"}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`w-5 h-5 border-2 rounded-md flex justify-center items-center ${row.late ? "bg-yellow-500 text-white" : "border-gray-300"}`}
                >
                  {row.late && "✓"}
                </span>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan="7"
              className="px-6 py-4 text-sm text-center text-gray-500"
            >
              No data found for the selected criteria.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

  );
}
