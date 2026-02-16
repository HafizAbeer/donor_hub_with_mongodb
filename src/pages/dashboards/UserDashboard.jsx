import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  Plus,
  X,
  CheckCircle2,
  Edit2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function UserDashboard() {
  const { user, token } = useAuth();
  const [dateFilter, setDateFilter] = useState("year");
  const [myDonations, setMyDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);
  const [donationForm, setDonationForm] = useState({
    date: new Date().toISOString().split('T')[0],
    location: "",
    bloodGroup: user?.bloodGroup || "",
    notes: "",
  });



  // Calculate stats and charts from real data
  const userDonations = myDonations.length;
  const pointsEarned = userDonations * 50;

  // Calculate change for donations (e.g., this month)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const donationsThisMonth = myDonations.filter(d => new Date(d.date) >= firstDayOfMonth).length;

  // Calculate Days Until Next Donation
  let daysUntilNext = "N/A";
  let statusChange = "Ready";

  if (myDonations.length > 0) {
    // Sort donations by date descending to get the latest
    const sortedDonations = [...myDonations].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastDonation = new Date(sortedDonations[0].date);
    const nextDonationDate = new Date(lastDonation);
    nextDonationDate.setDate(lastDonation.getDate() + 90); // 90 days waiting period

    const diffTime = nextDonationDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      daysUntilNext = diffDays.toString();
      statusChange = "On Track";
    } else {
      daysUntilNext = "0";
      statusChange = "Ready Now";
    }
  } else {
    daysUntilNext = "0";
    statusChange = "Ready Now";
  }

  const stats = [
    {
      title: "My Donations",
      value: userDonations.toString(),
      change: `+${donationsThisMonth}`,
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Days Until Next",
      value: daysUntilNext,
      change: statusChange,
      icon: Calendar,
      color: "text-red-500",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Points Earned",
      value: pointsEarned.toString(),
      change: `+${donationsThisMonth * 50}`,
      icon: Award,
      color: "text-pink-500",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
    },
  ];

  // Process myDonations for Charts
  // 1. Donation History (Donations in last 6 months)
  const processDonationHistory = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const history = [];
    const now = new Date();

    // Create last 6 months range
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = `${months[d.getMonth()]} ${d.getFullYear()}`;

      // Count donations for this specific month/year
      const count = myDonations.filter(donation => {
        const donDate = new Date(donation.date);
        return donDate.getMonth() === d.getMonth() && donDate.getFullYear() === d.getFullYear();
      }).length;

      history.push({ date: monthLabel, donations: count });
    }

    return history;
  };

  const donationHistory = processDonationHistory();

  // 2. Points Progress (Cumulative points)
  const processPointsHistory = () => {
    // Sort by date ascending
    const sorted = [...myDonations].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cumulativePoints = 0;

    const data = sorted.map(donation => {
      cumulativePoints += 50;
      const d = new Date(donation.date);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return {
        month: months[d.getMonth()],
        points: cumulativePoints
      };
    });

    // Return waiting data or empty standard structure if no data
    if (data.length === 0) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      return months.map(m => ({ month: m, points: 0 }));
    }

    return data;
  };

  const pointsHistory = processPointsHistory();

  React.useEffect(() => {
    fetchEvents();
    if (user) {
      fetchDonations();
    }
  }, [user]);

  const fetchDonations = async () => {
    try {
      if (!token) return;
      const res = await fetch('/api/donations/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMyDonations(data.map(d => ({
          id: d._id,
          date: d.date, // for display
          rawDate: d.date, // for editing
          bloodGroup: d.bloodGroup,
          location: d.location,
          points: 50,
          notes: d.notes,
          amount: d.amount
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDonations(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        // Get only top 3 upcoming events
        setEvents(data.slice(0, 3));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleRecordDonation = async (e) => {
    e.preventDefault();
    if (!token) return;

    // Future date validation
    const selectedDate = new Date(donationForm.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow today

    if (selectedDate > today) {
      setErrorMessage("Donation date cannot be in the future!");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const url = editingDonation ? `/api/donations/${editingDonation.id}` : '/api/donations';
      const method = editingDonation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(donationForm)
      });

      if (res.ok) {
        setSuccessMessage(editingDonation ? "Donation record updated!" : "Your donation has been recorded.");
        setShowSuccess(true);
        setErrorMessage("");
        setDonationForm({
          date: new Date().toISOString().split('T')[0],
          location: "",
          bloodGroup: user?.bloodGroup || "",
          notes: "",
        });
        setEditingDonation(null);
        fetchDonations();

        // Don't auto-close if it's a new record, let user choose "Add Another" or "Close"
        // If it was an edit, we can auto-close
        if (editingDonation) {
          setTimeout(() => {
            setIsDonationModalOpen(false);
            setShowSuccess(false);
          }, 2000);
        }
      } else {
        const data = await res.json();
        setErrorMessage(data.message || 'Failed to save donation');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDonationForm = () => {
    setDonationForm({
      date: new Date().toISOString().split('T')[0],
      location: "",
      bloodGroup: user?.bloodGroup || "",
      notes: "",
    });
    setEditingDonation(null);
    setShowSuccess(false);
    setErrorMessage("");
  };

  const openDonationModal = () => {
    resetDonationForm();
    setIsDonationModalOpen(true);
  };

  const openEditModal = (donation) => {
    setEditingDonation(donation);
    setDonationForm({
      date: new Date(donation.rawDate).toISOString().split('T')[0],
      location: donation.location,
      bloodGroup: donation.bloodGroup,
      notes: donation.notes || "",
    });
    setShowSuccess(false);
    setErrorMessage("");
    setIsDonationModalOpen(true);
  };

  const handleDeleteDonation = async () => {
    if (!donationToDelete || !token) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/donations/${donationToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setSuccessMessage("Donation record deleted.");
        setShowSuccess(true);
        fetchDonations();

        // Close delete modal first
        setIsDeleteModalOpen(false);

        // Show success for 2 seconds then reset
        setTimeout(() => {
          setShowSuccess(false);
          setDonationToDelete(null);
        }, 2000);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete donation');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (donation) => {
    setDonationToDelete(donation);
    setShowSuccess(false);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-red-100 mb-2">
            Donor Dashboard
          </h2>
          <p className="text-red-700 dark:text-red-300 text-sm md:text-base">
            Welcome! Find donors and track your donation history
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={openDonationModal}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Record Donation
          </Button>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-red-900/50 border border-red-300 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 text-sm focus:border-red-500 focus:ring-red-500 focus:outline-none"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
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
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            Donation History
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={donationHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" />
              <XAxis dataKey="date" stroke="#991b1b" />
              <YAxis stroke="#991b1b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #fecdd3",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="donations"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
                name="Donations"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-red-600" />
            Points Progress
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pointsHistory}>
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
              <Line
                type="monotone"
                dataKey="points"
                stroke="#ec4899"
                strokeWidth={3}
                name="Points"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4">
            My Donation History
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {myDonations.map((donation) => (
              <div
                key={donation.id}
                className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-red-900 dark:text-red-100">
                        {donation.bloodGroup}
                      </span>
                      <span className="text-xs text-red-600 dark:text-red-400">
                        +{donation.points} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(donation)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                        title="Edit Donation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(donation)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete Donation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-red-900 dark:text-red-100 mb-1">
                    {donation.location}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-red-600 dark:text-red-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(donation.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
          <h3 className="text-lg md:text-xl font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" />
            Upcoming Events
          </h3>
          <div className="space-y-3">
            {loadingEvents ? (
              <p className="text-sm text-gray-500">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming events.</p>
            ) : (
              events.map((event) => (
                <div
                  key={event._id}
                  className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/50 flex flex-col items-center justify-center text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800 flex-shrink-0">
                    <span className="text-xs font-bold uppercase">
                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 truncate">
                      {event.title}
                    </h4>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 line-clamp-1">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-red-500 dark:text-red-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>•</span>
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Record Donation Modal */}
      {isDonationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-red-950 border-red-200 dark:border-red-900 relative">
            <button
              onClick={() => setIsDonationModalOpen(false)}
              className="absolute top-4 right-4 text-red-700 dark:text-red-400 hover:text-red-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">Success!</h3>
                <p className="text-red-700 dark:text-red-300">
                  {successMessage}
                  {!successMessage.includes("deleted") && (
                    <>
                      <br />
                      <span className="text-green-600 font-semibold">+50 points earned</span>
                    </>
                  )}
                </p>
                <div className="flex gap-3 mt-6 w-full">
                  {!editingDonation && !successMessage.includes("deleted") && (
                    <Button
                      variant="outline"
                      onClick={() => setShowSuccess(false)}
                      className="flex-1 border-red-200 dark:border-red-800"
                    >
                      Add Another
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsDonationModalOpen(false)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-6 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-600" />
                  {editingDonation ? "Edit Donation Record" : "Record New Donation"}
                </h3>
                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-md border border-red-200 dark:border-red-800">
                    {errorMessage}
                  </div>
                )}
                <form onSubmit={handleRecordDonation} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Donation Date</Label>
                    <Input
                      id="date"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={donationForm.date}
                      onChange={(e) => setDonationForm({ ...donationForm, date: e.target.value })}
                      required
                      className="bg-white dark:bg-red-900/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <select
                      id="bloodGroup"
                      value={donationForm.bloodGroup}
                      onChange={(e) => setDonationForm({ ...donationForm, bloodGroup: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md focus:border-red-500 focus:outline-none text-sm"
                    >
                      <option value="">Select Blood Group</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location / Hospital</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Allied Hospital Faisalabad"
                      value={donationForm.location}
                      onChange={(e) => setDonationForm({ ...donationForm, location: e.target.value })}
                      required
                      className="bg-white dark:bg-red-900/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional details..."
                      value={donationForm.notes}
                      onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                      className="bg-white dark:bg-red-900/30 min-h-[100px]"
                    />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDonationModalOpen(false)}
                      className="flex-1 border-red-200 dark:border-red-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isSubmitting ? "Saving..." : "Record Donation"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-red-950 border-red-200 dark:border-red-900 relative">
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">Deleted!</h3>
                <p className="text-red-700 dark:text-red-300 whitespace-pre-line">
                  {successMessage}
                </p>
                <Button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="mt-6 w-full bg-red-600 hover:bg-red-700"
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4 text-red-600">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-red-900 dark:text-red-100">Delete Record?</h3>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6 border border-red-100 dark:border-red-900/50">
                  <p className="text-sm text-red-900 dark:text-red-100 mb-2">
                    Are you sure you want to delete this donation record?
                  </p>
                  <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
                    <span>{donationToDelete?.bloodGroup}</span>
                    <span>•</span>
                    <span>{new Date(donationToDelete?.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="truncate">{donationToDelete?.location}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 border-red-200 dark:border-red-800"
                    disabled={isSubmitting}
                  >
                    No, Keep it
                  </Button>
                  <Button
                    onClick={handleDeleteDonation}
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isSubmitting ? "Deleting..." : "Yes, Delete"}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
