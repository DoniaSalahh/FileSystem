"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCheck, FiX, FiEye, FiUserPlus, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";

export default function RequestsPage() {
  const [employees, setEmployees] = useState([]);
  const [folders, setFolders] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isGiveAccessModalOpen, setIsGiveAccessModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [accessData, setAccessData] = useState({
    folderId: "",
    employeeId: "",
    reason: "",
  });

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://file-system-black.vercel.app/user/employees",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEmployees(response.data.employees);
      // console.log("Fetched employees:", response.data.employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      Swal.fire("Error!", "Failed to load employees.", "error");
    }
  };

  const fetchAllFolders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://file-system-black.vercel.app/file/getAllFolders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAllFolders(response.data.folders);
      // console.log("Fetched all folders:", response.data.folders);
    } catch (error) {
      console.error("Error fetching all folders:", error);
      Swal.fire("Error!", "Failed to load folders and files.", "error");
    }
  };

  // Fetch folders and their requests from API
  const fetchFoldersWithRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://file-system-black.vercel.app/access/get-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const foldersData = response.data?.folders || [];

      setFolders(foldersData);
      // console.log("Fetched folders:", foldersData);

      // Extract all access requests from all folders
      const allRequests = foldersData.flatMap((folder) =>
        (folder.accessRequests || []).map((request) => ({
          ...request,
          folderId: folder.id,
          folderName: folder.name,
          requestId: request.requestId,
        }))
      );
      // console.log("Extracted requests:", allRequests);

      setRequests(allRequests);
    } catch (error) {
      console.error("Error fetching folders:", error);
      Swal.fire("Error!", "Failed to load folders and requests.", "error");
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoldersWithRequests();
    fetchEmployees();
    fetchAllFolders();
  }, []);

  // Open view modal
  const openViewModal = (request) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  // Close view modal
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedRequest(null);
  };

  // Open give access modal
  const openGiveAccessModal = () => {
    setIsGiveAccessModalOpen(true);
  };

  // Close give access modal
  const closeGiveAccessModal = () => {
    setIsGiveAccessModalOpen(false);
    setAccessData({
      folderId: "",
      employeeId: "",
      reason: "",
    });
  };

  // Handle input change for give access form
  const handleAccessInputChange = (e) => {
    const { name, value } = e.target;
    setAccessData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Delete request
  const deleteRequest = async (requestId) => {
    Swal.fire({
      title: "Delete Request?",
      text: "Are you sure you want to delete this request?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(
            `https://file-system-black.vercel.app/access/access-requests/${requestId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setRequests(requests.filter((request) => request.requestId !== requestId));

          Swal.fire("Deleted!", "Request has been deleted.", "success");
        } catch (error) {
          console.error("Error deleting request:", error);
          Swal.fire(
            "Error!",
            error.response?.data?.message || "Failed to delete request.",
            "error"
          );
        }
      }
    });
  };

  // Accept request
  const acceptRequest = async (requestId) => {
    Swal.fire({
      title: "Accept Request?",
      text: "Are you sure you want to accept this request?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, accept it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `https://file-system-black.vercel.app/access/update-request/${requestId}`,
            { status: "approved" },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          setRequests(
            requests.map((request) =>
              request.requestId === requestId
                ? { ...request, status: "approved" }
                : request
            )
          );

          Swal.fire("Accepted!", "Request has been accepted.", "success");
        } catch (error) {
          console.error("Error accepting request:", error);
          Swal.fire(
            "Error!",
            error.response?.data?.message || "Failed to accept request.",
            "error"
          );
        }
      }
    });
  };

  // Reject request
  const rejectRequest = async (requestId) => {
    // console.log("Rejecting request with ID:", requestId);
    Swal.fire({
      title: "Reject Request?",
      text: "Are you sure you want to reject this request?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, reject it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `https://file-system-black.vercel.app/access/update-request/${requestId}`,
            { status: "rejected" },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          setRequests(
            requests.map((request) =>
              request.requestId === requestId
                ? { ...request, status: "rejected" }
                : request
            )
          );

          Swal.fire("Rejected!", "Request has been rejected.", "success");
        } catch (error) {
          console.error("Error rejecting request:", error);
          Swal.fire(
            "Error!",
            error.response?.data?.message || "Failed to reject request.",
            "error"
          );
        }
      }
    });
  };

  // Give access to employee
  const giveAccessToEmployee = async () => {
  try {
    // Validate inputs
    if (!accessData.folderId || !accessData.employeeId || !accessData.reason) {
      Swal.fire("Error!", "Please fill in all fields.", "error");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("Error!", "Authentication token not found.", "error");
      return;
    }

    // console.log("Submitting access data:", accessData); // Debug log

    const response = await axios.post(
      "https://file-system-black.vercel.app/access/GiveAccess",
      {
        folderId: accessData.folderId,
        employeeId: accessData.employeeId,
        reason: accessData.reason
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    // console.log("API Response:", response.data); // Debug log

    if (response.data && response.data.msg === "Folder access granted to employee") {
      await fetchFoldersWithRequests(); // Refresh the requests list
      closeGiveAccessModal();
      Swal.fire("Success!", "Access has been granted.", "success");
    } else {
      throw new Error("Unexpected response from server");
    }
  } catch (error) {
    console.error("Error giving access:", error);
    
    let errorMessage = "Failed to grant access";
    if (error.response) {
      // Server responded with a status code outside 2xx
      errorMessage = error.response.data?.message || error.response.statusText;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = "No response from server";
    }
    
    Swal.fire("Error!", errorMessage, "error");
  }
};

  return (
    <AdminLayout>
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pending Requests
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                View, accept, or reject file access requests from users
              </p>
            </div>
            <button
              onClick={openGiveAccessModal}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <FiUserPlus className="mr-2 h-4 w-4" />
              Give Access
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                No requests found
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                There are currently no access requests to display.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-y-auto" style={{ maxHeight: "500px" }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Folder Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Instructor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <motion.tr
                        key={request.requestId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.folderName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                          {request.employee?.username || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openViewModal(request)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              <FiEye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteRequest(request.requestId)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete Request"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>

                            {request.status === "pending" && (
                              <>
                                <button
                                  onClick={() => acceptRequest(request.requestId)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Accept Request"
                                >
                                  <FiCheck className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => rejectRequest(request.requestId)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Reject Request"
                                >
                                  <FiX className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View Request Modal */}
          {isViewModalOpen && selectedRequest && (
            <div className="fixed inset-0 bg-Wadi bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center border-b px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Request Details
                  </h3>
                  <button
                    onClick={closeViewModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Folder Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRequest.folderName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Instructor
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRequest.employee
                        ? `${selectedRequest.employee.username} (${selectedRequest.employee.email})`
                        : "--"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedRequest.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : selectedRequest.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedRequest.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reason
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRequest.reason}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedRequest.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 px-6 py-4 border-t">
                  <button
                    onClick={closeViewModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {selectedRequest.status === "pending" && (
                    <>
                      <button
                        onClick={() => {
                          acceptRequest(selectedRequest.requestId);
                          closeViewModal();
                        }}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <FiCheck className="inline mr-2 h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          rejectRequest(selectedRequest.requestId);
                          closeViewModal();
                        }}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FiX className="inline mr-2 h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Give Access Modal */}
          {isGiveAccessModalOpen && (
            <div className="fixed inset-0 bg-Wadi bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center border-b px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Give Access to Instructor
                  </h3>
                  <button
                    onClick={closeGiveAccessModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Instructor
                    </label>
                    <select
                      name="employeeId"
                      value={accessData.employeeId}
                      onChange={handleAccessInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Instructor</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee._id}>
                          {employee.username || employee.email || employee._id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Folder
                    </label>
                    <select
                      name="folderId"
                      value={accessData.folderId}
                      onChange={(e) => {
                        setAccessData({
                          ...accessData,
                          folderId: e.target.value,
                        });
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Folder</option>
                      {allFolders.map((folder) => (
                        <option key={folder._id} value={folder._id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reason
                    </label>
                    <textarea
                      name="reason"
                      value={accessData.reason}
                      onChange={handleAccessInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter reason for access"
                      rows={3}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 px-6 py-4 border-t">
                  <button
                    onClick={closeGiveAccessModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={giveAccessToEmployee}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FiUserPlus className="inline mr-2 h-4 w-4" />
                    Give Access
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}