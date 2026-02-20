import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users,
  Heart,
  UserPlus,
  Activity,
  TrendingUp,
  MapPin,
  Filter,
  Edit2,
  Trash2,
} from "lucide-react";
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

export default function AdminDashboard() {
  const { token } = useAuth();
  const [dateFilter, setDateFilter] = useState("month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      totalDonors: 0,
      activeDonors: 0,
      newThisMonth: 0,
      totalDonations: 0,
      activeDonorsThisMonth: 0,
      donationsThisMonth: 0
    },
    bloodGroupData: [],
    monthlyTrend: [],
    recentDonations: [],
    universityData: [],
    cityData: []
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
      const res = await fetch("/api/stats/admin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const statsData = await res.json();
        setData(statsData);
      }
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = React.useMemo(() => [
    {
      title: "Total Donors",
      value: (data.stats.totalDonors || 0).toString(),
      change: `+${data.stats.newThisMonth || 0}`,
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Active Donors",
      value: (data.stats.activeDonors || 0).toString(),
      change: `+${data.stats.activeDonorsThisMonth || 0}`,
      icon: Users,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
    },
    {
      title: "New This Month",
      value: (data.stats.newThisMonth || 0).toString(),
      change: `+${data.stats.newThisMonth || 0}`,
      icon: UserPlus,
      color: "text-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Total Donations",
      value: (data.stats.totalDonations || 0).toString(),
      change: `+${data.stats.donationsThisMonth || 0}`,
      icon: Activity,
      color: "text-pink-500",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
    },
  ], [data]);

  const openEditModal = (donation) => {
    setDonationToEdit(donation);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (donation) => {
    setDonationToDelete(donation);
    setIsDeleteModalOpen(true);
  };

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
            Admin Dashboard
          </h2>
          <p className="text-red-700 dark:text-red-300 text-sm md:text-base">
            Manage donors and monitor donation activities
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
              Monthly Trends
            </h3>
            <Filter className="w-4 h-4 text-red-600" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyTrend || []}>
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
              <Bar dataKey="donations" fill="#ef4444" name="Donations" radius={[8, 8, 0, 0]} />
              <Bar dataKey="donors" fill="#ec4899" name="New Donors" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4">
            Blood Group Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.bloodGroupData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(data.bloodGroupData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #fecdd3", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Donors by City
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
              <YAxis stroke="#991b1b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #fecdd3", borderRadius: "8px" }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="donors" fill="#ef4444" name="Donors" radius={[4, 4, 0, 0]} />
              <Bar dataKey="donations" fill="#ec4899" name="Donations" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4">
            Recent Donations
          </h3>
          <div className="space-y-3 max-h-[250px] overflow-y-auto">
            {(!data.recentDonations || data.recentDonations.length === 0) ? (
              <p className="text-center text-red-500 py-4">No recent donations found</p>
            ) : (
              (data.recentDonations || []).map((donation) => (
                <div key={donation.id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                    {donation.donor.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">{donation.donor}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">{donation.bloodGroup}</span>
                      <span className="text-xs text-red-500 dark:text-red-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {donation.location}
                      </span>
                    </div>
                    <p className="text-xs text-red-500 dark:text-red-500 mt-1">{donation.dateDisplay}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(donation)} className="p-1.5 text-red-600 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-md transition-colors tooltip"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => openDeleteModal(donation)} className="p-1.5 text-rose-600 hover:bg-rose-200 dark:hover:bg-rose-800/50 rounded-md transition-colors tooltip"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-red-500 to-pink-500 text-white">
          <Activity className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Record Donation</h3>
          <p className="text-sm opacity-90 mb-4">Log a new blood donation entry manually</p>
          <Link to="/patient-history" className="block"><Button className="bg-white text-red-600 hover:bg-red-50 w-full font-semibold">Go to Records</Button></Link>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <Users className="w-8 h-8 text-red-600 mb-3" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">View All Donors</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">Browse and manage all registered donors</p>
          <Link to="/donors" className="block"><Button variant="outline" className="w-full border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50">View Donors</Button></Link>
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
