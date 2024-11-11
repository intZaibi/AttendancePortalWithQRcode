"use client";
import React, { useEffect, useState } from "react";

export default function LeaveRequestTable() {
  const [data, setData] = useState([]);
  const [message, setMessage] = useState({});

  useEffect(() => {
    const fetchPendingConfirmations = async () => {
      const response = await fetch(
        "/api/admin/confirmations?type=leaveRequest",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      console.log(data.data);
      setData(data.data);
    };

    fetchPendingConfirmations();
  }, []);

  const handleApprove = async (user_id, start_date, end_date) => {
    try {
      const res = await fetch("/api/admin/confirmations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "leaveRequest",
          start_date,
          end_date,
          user_id,
          status: "approved",
        }),
      });
      const response = await res.json();
      console.log(response.message);
      if (res.ok) {
        setData((prevData) =>
          prevData.filter(
            (item) =>
              !(
                item.user_id == user_id &&
                item.start_date == start_date &&
                item.end_date == end_date
              )
          )
        );
        setMessage({ type: "success", text: "Leave request approved." });

        setTimeout(() => {
          setMessage({});
        }, 2500);
      } else throw response.message;
    } catch (error) {
      console.log(error);
      setMessage({ type: "error", text: error });

      setTimeout(() => {
        setMessage({});
      }, 2500);
    }
  };

  const handleReject = async (user_id, start_date, end_date) => {
    try {
      const res = await fetch("/api/admin/confirmations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "leaveRequest",
          start_date,
          end_date,
          user_id,
          status: "rejected",
        }),
      });
      const response = await res.json();
      console.log(response.message);
      if (res.ok) {
        setData((prevData) =>
          prevData.filter(
            (item) =>
              !(
                item.user_id == user_id &&
                item.start_date == start_date &&
                item.end_date == end_date
              )
          )
        );
        setMessage({ type: "success", text: "Leave request rejected." });

        setTimeout(() => {
          setMessage({});
        }, 2500);
      } else throw response.message;
    } catch (error) {
      console.log(error);
      setMessage({ type: "error", text: error });

      setTimeout(() => {
        setMessage({});
      }, 2500);
    }
  };

  return (
    <div className="overflow-x-auto p-2">
      {message && (
        <p
          className={`mb-4 ${
            message.type === "error" ? "text-red-500" : "text-green-500"
          }`}
        >
          {message.text}
        </p>
      )}

      <table className="min-w-[75vw] bg-white shadow-[0_4px_20px_#080f341a] rounded-lg">
        <thead>
          <tr className="text-left font-semibold text-gray-700">
            <th className="px-6 py-3">Student Name</th>
            <th className="px-6 py-3">Starting Date</th>
            <th className="px-6 py-3">Ending Date</th>
            <th className="px-6 py-3">Reason</th>
            <th className="lg:pl-16 py-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map((student, key) => (
            <tr key={key} className="border-t hover:bg-gray-50">
              <td className="px-6 py-5 text-gray-800">{student.name}</td>
              <td className="px-6 py-5 text-gray-600">{student.start_date}</td>
              <td className="px-6 py-5 text-gray-600">{student.end_date}</td>
              <td className="px-6 py-5 text-gray-600">{student.reason}</td>
              <td className="px-6 py-5">
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      handleApprove(
                        student.user_id,
                        student.start_date,
                        student.end_date
                      )
                    }
                    className="px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleReject(
                        student.user_id,
                        student.start_date,
                        student.end_date
                      )
                    }
                    className="px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
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
