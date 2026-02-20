import React, { useState, useEffect, Fragment } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  Users,
  Shield,
  UserPlus,
  Heart,
  TrendingUp,
  Calendar,
  MapPin,
  Filter,
  Edit2,
  Trash2,
  X,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { Dialog, Transition, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import DonationModals from "./DonationModals";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#ef4444", "#f43f5e", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6", "#6366f1"];

export default function SuperAdminDashboard() {
  const { token } = useAuth();
  const [dateFilter, setDateFilter] = useState("month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      totalUsers: 0,
      totalAdmins: 0,
      activeDonors: 0,
      totalDonations: 0
    },
    bloodGroupData: [],
    cityData: [],
    recentActivities: [],
    donationData: [],
    universityData: [],
    unassignedDonors: []
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [donationToEdit, setDonationToEdit] = useState(null);
  const [donationToDelete, setDonationToDelete] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats/superadmin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const statsData = await res.json();
        setData(statsData);
      }
    } catch (err) {
      console.error("Failed to fetch superadmin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [isUniversityModalOpen, setIsUniversityModalOpen] = useState(false);

  const openEditModal = (donation) => {
    setDonationToEdit(donation);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (donation) => {
    setDonationToDelete(donation);
    setIsDeleteModalOpen(true);
  };

  const openUniversityModal = (uni) => {
    setSelectedUniversity(uni);
    setIsUniversityModalOpen(true);
  };

  const statCards = [
    {
      title: "Total Users",
      value: data.stats.totalUsers.toString(),
      change: "+0",
      icon: Users,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Admins",
      value: data.stats.totalAdmins.toString(),
      change: "+0",
      icon: Shield,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
    },
    {
      title: "Active Donors",
      value: data.stats.activeDonors.toString(),
      change: `+${data.stats.activeDonors}`,
      icon: Heart,
      color: "text-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Total Donations",
      value: data.stats.totalDonations.toString(),
      change: "+0",
      icon: TrendingUp,
      color: "text-pink-500",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-red-100 mb-2">
            Super Admin Dashboard
          </h2>
          <p className="text-red-700 dark:text-red-300 text-sm md:text-base">
            Manage admins, users, and monitor the entire platform
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-red-900/50 border border-red-300 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 text-sm focus:border-red-500 focus:ring-red-500 focus:outline-none"
          >
            <option value="week">Last Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(statCards || []).map((stat) => (
          <Card
            key={stat.title}
            className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
              </div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-xs md:text-sm text-red-700 dark:text-red-400 mb-1">
                {stat.title}
              </p>
              <p className="text-xl md:text-2xl font-bold text-red-900 dark:text-red-100">
                {stat.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100">
              Donation Trends
            </h3>
            <Filter className="w-4 h-4 text-red-600" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.donationData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" />
              <XAxis dataKey="month" stroke="#991b1b" />
              <YAxis stroke="#991b1b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #fecdd3",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="donations"
                stroke="#ef4444"
                strokeWidth={2}
                name="Donations"
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#ec4899"
                strokeWidth={2}
                name="New Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4">
            Blood Group Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.bloodGroupData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(data.bloodGroupData || []).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #fecdd3",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Top Cities
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data.cityData || []}
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" vertical={false} />
              <XAxis
                dataKey="city"
                stroke="#991b1b"
                fontSize={11}
                interval={0}
                angle={-90}
                textAnchor="end"
                height={100}
              />
              <YAxis
                stroke="#991b1b"
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #fecdd3",
                  borderRadius: "8px",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar
                dataKey="donors"
                fill="#ef4444"
                name="Donors"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="donations"
                fill="#ec4899"
                name="Donations"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Donors by University
          </h3>
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.universityData || []}
                layout="vertical"
                onClick={(d) => d && d.activePayload && openUniversityModal(d.activePayload[0].payload)}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" />
                <XAxis type="number" stroke="#991b1b" />
                <YAxis
                  dataKey="university"
                  type="category"
                  width={100}
                  stroke="#991b1b"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #fecdd3",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="donors"
                  fill="#ec4899"
                  name="Donors"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-red-200 dark:divide-red-800">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-red-900 dark:text-red-100 uppercase tracking-wider">University</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-red-900 dark:text-red-100 uppercase tracking-wider">Count</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-red-900 dark:text-red-100 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100 dark:divide-red-900">
                  {(data.universityData || []).map((uni) => (
                    <tr key={uni.university} className="hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-red-900 dark:text-red-100">{uni.university}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-red-700 dark:text-red-300">{uni.donors}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40"
                          onClick={() => openUniversityModal(uni)}
                        >
                          View List
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* University Donors Modal */}
        <Transition show={isUniversityModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50 focus:outline-none"
            onClose={() => setIsUniversityModalOpen(false)}
          >
            <DialogBackdrop className="fixed inset-0 bg-red-900/20 backdrop-blur-sm transition-opacity" />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-red-950 p-6 text-left align-middle shadow-xl transition-all border border-red-200 dark:border-red-900">
                    <div className="flex justify-between items-center mb-6">
                      <DialogTitle as="h3" className="text-xl font-bold text-red-900 dark:text-red-100">
                        Donors at {selectedUniversity?.university}
                      </DialogTitle>
                      <button
                        onClick={() => setIsUniversityModalOpen(false)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="overflow-x-auto max-h-[60vh]">
                      <table className="min-w-full divide-y divide-red-200 dark:divide-red-800">
                        <thead className="sticky top-0 bg-white dark:bg-red-950 z-10">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-red-900 dark:text-red-100 uppercase tracking-wider">Donor Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-red-900 dark:text-red-100 uppercase tracking-wider">Blood Group</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-red-900 dark:text-red-100 uppercase tracking-wider">Phone</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100 dark:divide-red-900">
                          {selectedUniversity?.donorDetails?.map((donor, idx) => (
                            <tr key={idx} className="hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-900 dark:text-red-100">{donor.name}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-xs font-bold ring-1 ring-red-200 dark:ring-red-800">
                                  {donor.bloodGroup}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-red-700 dark:text-red-300">
                                <a href={`tel:${donor.phone}`} className="hover:underline text-red-600 dark:text-red-400">
                                  {donor.phone}
                                </a>
                              </td>
                            </tr>
                          ))}
                          {(!selectedUniversity?.donorDetails || selectedUniversity.donorDetails.length === 0) && (
                            <tr>
                              <td colSpan="3" className="px-4 py-8 text-center text-red-500 italic">No donor details available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Button
                        onClick={() => setIsUniversityModalOpen(false)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6"
                      >
                        Close
                      </Button>
                    </div>
                  </DialogPanel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4">
            Recent Activities
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {(!data.recentActivities || data.recentActivities.length === 0) ? (
              <p className="text-center text-red-500 py-4">No recent activity</p>
            ) : (
              (data.recentActivities || []).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${activity.type === "admin"
                      ? "bg-pink-500"
                      : activity.type === "donation"
                        ? "bg-red-500"
                        : "bg-red-400"
                      }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      {activity.action}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {activity.user}
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                  {activity.type === 'donation' && (
                    <div className="flex gap-1 self-center">
                      <button
                        onClick={() => openEditModal(activity)}
                        className="p-1.5 text-red-600 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-md transition-colors"
                        title="Edit Donation"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(activity)}
                        className="p-1.5 text-rose-600 hover:bg-rose-200 dark:hover:bg-rose-800/50 rounded-md transition-colors"
                        title="Delete Donation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {data.unassignedDonors && data.unassignedDonors.length > 0 && (
        <Card className="p-4 md:p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Pending Assignments ({data.unassignedDonors.length})
            </h3>
            <Link to="/donors">
              <Button variant="ghost" size="sm" className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40">
                View All
              </Button>
            </Link>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
            These donors signed up without providing a university. Please assign them to a university or administrator.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.unassignedDonors.slice(0, 6).map((donor) => (
              <Card key={donor._id} className="p-3 bg-white dark:bg-amber-900/10 border-amber-200 dark:border-amber-900 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">{donor.name}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">{donor.email}</p>
                    <p className="text-xs text-amber-600 mt-1">{donor.city}</p>
                  </div>
                  <Link to="/donors">
                    <Button size="sm" variant="outline" className="h-8 border-amber-300 text-amber-700 hover:bg-amber-50">
                      Assign
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-red-500 to-pink-500 text-white">
          <UserPlus className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Create Admin</h3>
          <p className="text-sm opacity-90 mb-4">
            Add new admin accounts to manage the platform
          </p>
          <Link to="/create-admin" className="block">
            <Button className="bg-white text-red-600 hover:bg-red-50 w-full font-semibold">
              Create Now
            </Button>
          </Link>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <UserPlus className="w-8 h-8 text-red-600 mb-3" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Add User
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            Register new donors to the platform
          </p>
          <Link to="/add-user" className="block">
            <Button
              variant="outline"
              className="w-full border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50"
            >
              Add User
            </Button>
          </Link>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <Users className="w-8 h-8 text-red-600 mb-3" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            View All Donors
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            Browse and manage all registered donors
          </p>
          <Link to="/donors" className="block">
            <Button
              variant="outline"
              className="w-full border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50"
            >
              View Donors
            </Button>
          </Link>
        </Card>
      </div>

      <DonationModals
        token={token}
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        donationToEdit={donationToEdit}
        donationToDelete={donationToDelete}
        onSuccess={fetchStats}
      />
    </div>
  );
}
