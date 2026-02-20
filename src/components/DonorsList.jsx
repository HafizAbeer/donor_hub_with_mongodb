import React, { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Users,
  Search,
  Droplet,
  Phone,
  Mail,
  MapPin,
  Filter,
  Download,
  BarChart3,
  Edit2,
  Trash2,
  Clock,
  X,
  CheckCircle2,
  AlertTriangle,
  User,
  Heart,
  Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DEPARTMENTS } from "@/constants/universityData";
import { fetchUniversities, addUniversity as addNewUniversityApi } from "@/services/universityService";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#ef4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
];

const MS_IN_DAY = 1000 * 60 * 60 * 24;
const DAYS_UNAVAILABLE = 90;

const safeISODate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

const evaluateAvailability = (isoDate) => {
  if (!isoDate) {
    return { isAvailable: true, daysSince: Infinity };
  }
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / MS_IN_DAY));
  return {
    isAvailable: diffDays >= DAYS_UNAVAILABLE,
    daysSince: diffDays,
  };
};

const formatRelativeDonation = (isoDate) => {
  if (!isoDate) return "No donation yet";

  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / MS_IN_DAY));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
};

const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const enrichDonorRecord = (donor) => {
  const isoDate = safeISODate(donor.lastDonationDate);
  const { isAvailable, daysSince } = evaluateAvailability(isoDate);
  return {
    ...donor,
    lastDonationDate: isoDate,
    lastDonationDisplay: formatRelativeDonation(isoDate),
    isAvailable,
    availabilityLabel: isAvailable ? "Available" : "Not Available",
    daysSinceDonation: daysSince,
    hostelite: Boolean(donor.hostelite),
    age: calculateAge(donor.dateOfBirth),
  };
};

export default function DonorsList() {
  const { isUser, isAdmin, isSuperAdmin, token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBloodGroup, setFilterBloodGroup] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showHosteliteOnly, setShowHosteliteOnly] = useState(false);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [donorToShow, setDonorToShow] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [admins, setAdmins] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [showNewUniversityInput, setShowNewUniversityInput] = useState(false);
  const [newUniversityName, setNewUniversityName] = useState('');
  const [isMarkingDonated, setIsMarkingDonated] = useState(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [donationLocation, setDonationLocation] = useState("");
  const [donorForDonation, setDonorForDonation] = useState(null);
  const [donorToEdit, setDonorToEdit] = useState(null);
  const [donorToDelete, setDonorToDelete] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    bloodGroup: "",
    hostelite: false,
    university: "",
    department: "",
    addedBy: "",
    cnic: "",
    province: "",
    gender: "",
    dateOfBirth: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalConditions: "",
    allergies: "",
  });

  useEffect(() => {
    if (isSuperAdmin && token) {
      const fetchAdmins = async () => {
        try {
          const res = await fetch('/api/users?role=admin', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setAdmins(data);
          }
        } catch (error) {
          console.error("Fetch admins error:", error);
        }
      };
      fetchAdmins();
    }
  }, [isSuperAdmin, token]);

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch('/api/users', { headers });
        if (res.ok) {
          const data = await res.json();
          setDonors(data.map(donor => enrichDonorRecord(donor)));
        }
      } catch (error) {
        console.error("Failed to fetch donors", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDonors();
  }, [token]);

  useEffect(() => {
    const getUniversities = async () => {
      const data = await fetchUniversities();
      setUniversities(data);
    };
    getUniversities();
  }, []);

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const cities = useMemo(
    () => [...new Set(donors.map((d) => d.city))].sort(),
    [donors]
  );

  const restrictToAvailable = showAvailableOnly || Boolean(filterBloodGroup);

  const filteredDonors = donors.filter((donor) => {
    const matchesSearch =
      donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBloodGroup =
      !filterBloodGroup || donor.bloodGroup === filterBloodGroup;
    const matchesCity = !filterCity || donor.city === filterCity;
    const matchesAvailability =
      !restrictToAvailable || (restrictToAvailable && donor.isAvailable);
    const matchesHostelite = !showHosteliteOnly || donor.hostelite;
    const matchesUnassigned = !showUnassignedOnly || !donor.university || donor.university.trim() === "";

    return (
      matchesSearch &&
      matchesBloodGroup &&
      matchesCity &&
      matchesAvailability &&
      matchesHostelite &&
      matchesUnassigned
    );
  });

  const bloodGroupStats = useMemo(
    () =>
      bloodGroups
        .map((bg) => ({
          name: bg,
          value: donors.filter((d) => d.bloodGroup === bg).length,
        }))
        .filter((item) => item.value > 0),
    [bloodGroups, donors]
  );

  const cityStats = useMemo(
    () =>
      cities.map((city) => ({
        city: city,
        donors: donors.filter((d) => d.city === city).length,
      })),
    [cities, donors]
  );

  const handleToggleAvailabilityFilter = () => {
    setShowAvailableOnly((prev) => !prev);
  };

  const openEditModal = (donor) => {
    setDonorToEdit(donor);
    setEditForm({
      name: donor.name,
      phone: donor.phone,
      city: donor.city,
      address: donor.address || "",
      bloodGroup: donor.bloodGroup,
      hostelite: donor.hostelite,
      university: donor.university || "",
      department: donor.department || "",
      addedBy: donor.addedBy || "",
      cnic: donor.cnic || "",
      province: donor.province || "Punjab",
      gender: donor.gender || "",
      dateOfBirth: donor.dateOfBirth ? new Date(donor.dateOfBirth).toISOString().split('T')[0] : "",
      emergencyContact: donor.emergencyContact || "",
      emergencyPhone: donor.emergencyPhone || "",
      medicalConditions: donor.medicalConditions || "",
      allergies: donor.allergies || "",
    });
    setErrorMessage("");
    setShowSuccess(false);
    setIsEditModalOpen(true);
  };

  const openDetailsModal = (donor) => {
    setDonorToShow(donor);
    setIsDetailsModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!donorToEdit || !token) return;

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      let finalUniversity = editForm.university;

      if (showNewUniversityInput && newUniversityName.trim()) {
        try {
          const addedUni = await addNewUniversityApi(newUniversityName.trim(), token);
          finalUniversity = addedUni.name;
        } catch (err) {
          setErrorMessage(err.message || "Failed to add new university");
          setIsSubmitting(false);
          return;
        }
      }

      const res = await fetch(`/api/users/${donorToEdit._id || donorToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editForm,
          university: finalUniversity,
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setDonors((prev) =>
          prev.map((item) =>
            (item._id || item.id) === (donorToEdit._id || donorToEdit.id)
              ? enrichDonorRecord(updatedUser)
              : item
          )
        );
        setSuccessMessage(`${updatedUser.name}'s profile has been updated.`);
        setShowSuccess(true);
        setTimeout(() => {
          setIsEditModalOpen(false);
          setShowSuccess(false);
        }, 2000);
      } else {
        const err = await res.json();
        setErrorMessage(err.message || "Failed to update donor");
      }
    } catch (error) {
      console.error("Edit donor error:", error);
      setErrorMessage("An error occurred during update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (donor) => {
    setDonorToDelete(donor);
    setErrorMessage("");
    setShowSuccess(false);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!donorToDelete || !token) return;

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/users/${donorToDelete._id || donorToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setDonors((prev) => prev.filter((donor) => (donor._id || donor.id) !== (donorToDelete._id || donorToDelete.id)));
        setSuccessMessage("Donor record has been deleted.");
        setShowSuccess(true);
        setTimeout(() => {
          setIsDeleteModalOpen(false);
          setShowSuccess(false);
        }, 2000);
      } else {
        const err = await res.json();
        setErrorMessage(err.message || "Failed to delete donor");
      }
    } catch (error) {
      console.error("Delete donor error:", error);
      setErrorMessage("An error occurred during deletion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDonatedToday = (donor) => {
    setDonorForDonation(donor);
    setDonationLocation("");
    setIsDonationModalOpen(true);
  };

  const confirmDonation = async () => {
    if (!donorForDonation || !donationLocation.trim()) {
      setErrorMessage("Please enter a hospital name");
      return;
    }

    const donorId = donorForDonation._id || donorForDonation.id;
    const todayISO = new Date().toISOString();

    setIsDonationModalOpen(false);
    setIsMarkingDonated(donorId);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          donor: donorId,
          date: todayISO,
          location: donationLocation,
          bloodGroup: donorForDonation.bloodGroup,
          notes: "Marked as donated via Donor List shortcut"
        }),
      });

      if (res.ok) {
        const userRes = await fetch(`/api/users/${donorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (userRes.ok) {
          const updatedUser = await userRes.json();
          setDonors((prev) =>
            prev.map((d) =>
              (d._id || d.id) === donorId
                ? enrichDonorRecord(updatedUser)
                : d
            )
          );
          setSuccessMessage(`${updatedUser.name} has been marked as donated at ${donationLocation}!`);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      } else {
        const err = await res.json();
        setErrorMessage(err.message || "Failed to record donation");
      }
    } catch (error) {
      console.error("Mark donated error:", error);
      setErrorMessage("An error occurred during update");
    } finally {
      setIsMarkingDonated(null);
      setDonorForDonation(null);
    }
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
          <h2 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
            {isUser ? "Find Donors" : "All Donors"}
          </h2>
          <p className="text-red-700 dark:text-red-300 text-sm md:text-base">
            {isUser
              ? "Search and connect with available donors"
              : "Manage and view all registered donors"}
          </p>
        </div>
        {!isUser && (
          <Button
            variant="outline"
            className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </div>

      {!isUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-600" />
              Blood Group Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={bloodGroupStats}
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
                  {bloodGroupStats.map((entry, index) => (
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

          <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              Donors by City
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={cityStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#fecdd3" vertical={false} />
                <XAxis
                  dataKey="city"
                  stroke="#991b1b"
                  fontSize={10}
                  interval={0}
                  angle={-90}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#991b1b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #fecdd3",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="donors"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  name="Donors"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-600 w-4 h-4 md:w-5 md:h-5" />
            <Input
              type="text"
              placeholder="Search by name, email, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 md:pl-10 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-red-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Droplet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-600 w-4 h-4" />
              <select
                value={filterBloodGroup}
                onChange={(e) => setFilterBloodGroup(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 text-sm focus:border-red-500 focus:ring-red-500 focus:outline-none"
              >
                <option value="">All Blood Groups</option>
                {bloodGroups.map((bg, index) => (
                  <option key={bg || index} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-600 w-4 h-4" />
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 text-sm focus:border-red-500 focus:ring-red-500 focus:outline-none"
              >
                <option value="">All Cities</option>
                {cities.map((city, index) => (
                  <option key={city || `city-${index}`} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={() => setShowAvailableOnly(!showAvailableOnly)}
                className="h-4 w-4 accent-red-600"
              />
              Available
            </label>
            <label className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showHosteliteOnly}
                onChange={() => setShowHosteliteOnly(!showHosteliteOnly)}
                className="h-4 w-4 accent-red-600"
              />
              Hostelites
            </label>
            {isSuperAdmin && (
              <label className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnassignedOnly}
                  onChange={() => setShowUnassignedOnly(!showUnassignedOnly)}
                  className="h-4 w-4 accent-red-600"
                />
                Unassigned
              </label>
            )}
            {(filterBloodGroup || filterCity || searchTerm) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterBloodGroup("");
                  setFilterCity("");
                  setShowAvailableOnly(false);
                  setShowHosteliteOnly(false);
                  setShowUnassignedOnly(false);
                }}
                className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4 text-sm text-red-700 dark:text-red-300">
          Showing <span className="font-semibold">{filteredDonors.length}</span>{" "}
          of <span className="font-semibold">{donors.length}</span> donors
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonors.map((donor) => (
            <Card
              key={donor._id || donor.id}
              className="p-4 md:p-5 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-900 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-semibold text-red-900 dark:text-red-100 truncate">
                    {donor.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Droplet className="w-4 h-4 text-red-600 shrink-0" />
                    <span className="text-red-700 dark:text-red-300 font-medium">
                      {donor.bloodGroup}
                    </span>
                    {!isUser && (
                      <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">
                        {donor.donations} donations
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${donor.hostelite
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                      }`}
                  >
                    {donor.hostelite ? "Hostelite" : "Non-Hostelite"}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${donor.isAvailable
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                      }`}
                  >
                    {donor.availabilityLabel}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{donor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{donor.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{donor.city}{donor.province ? `, ${donor.province}` : ''}</span>
                </div>
                <div className="flex items-center gap-3 pt-1 border-t border-red-100 dark:border-red-900/50 mt-1">
                  <span className="text-xs bg-red-100/50 dark:bg-red-900/30 px-2 py-0.5 rounded text-red-700 dark:text-red-300">
                    {donor.gender || 'N/A'}
                  </span>
                  {donor.age && (
                    <span className="text-xs bg-red-100/50 dark:bg-red-900/30 px-2 py-0.5 rounded text-red-700 dark:text-red-300">
                      {donor.age} Years Old
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <Clock className="w-4 h-4 shrink-0" />
                  Last donation: {donor.lastDonationDisplay}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(isAdmin || isSuperAdmin) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(donor)}
                      className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-200"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(donor)}
                      className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-200"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  onClick={() => handleMarkDonatedToday(donor)}
                  disabled={isMarkingDonated === (donor._id || donor.id)}
                  className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  {isMarkingDonated === (donor._id || donor.id) ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    "Mark as donated today"
                  )}
                </Button>
              </div>

              {!isUser && (
                <Button
                  onClick={() => openDetailsModal(donor)}
                  className="mt-3 w-full bg-linear-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm"
                >
                  View Details
                </Button>
              )}
              {isUser && (
                <Button
                  variant="outline"
                  className="mt-3 w-full border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50 text-sm"
                >
                  Contact
                </Button>
              )}
            </Card>
          ))}
        </div>

        {filteredDonors.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <p className="text-red-700 dark:text-red-300">No donors found</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              Try adjusting your filters
            </p>
          </div>
        )}
      </Card>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-red-950 border-red-200 dark:border-red-900 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
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
                <p className="text-red-700 dark:text-red-300">{successMessage}</p>
                <Button
                  onClick={() => setIsEditModalOpen(false)}
                  className="mt-6 w-full bg-red-600 hover:bg-red-700"
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-6 flex items-center gap-2">
                  <Edit2 className="w-6 h-6 text-red-600" />
                  Edit Donor Profile
                </h3>
                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-md border border-red-200 dark:border-red-800">
                    {errorMessage}
                  </div>
                )}
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name</Label>
                    <Input
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-blood">Blood Group</Label>
                      <select
                        id="edit-blood"
                        value={editForm.bloodGroup}
                        onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                        className="w-full h-10 px-3 bg-white dark:bg-red-900/30 border border-slate-200 dark:border-slate-800 rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
                      >
                        {bloodGroups.map((bg, idx) => <option key={bg || idx} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-city">City</Label>
                      <Input
                        id="edit-city"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone Number</Label>
                      <Input
                        id="edit-phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-cnic">CNIC</Label>
                      <Input
                        id="edit-cnic"
                        value={editForm.cnic}
                        onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })}
                        placeholder="35201-XXXXXXX-X"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-university">University</Label>
                      <select
                        id="edit-university"
                        value={showNewUniversityInput ? 'addNew' : editForm.university}
                        onChange={(e) => {
                          if (e.target.value === 'addNew') {
                            setShowNewUniversityInput(true);
                            setEditForm({ ...editForm, university: '' });
                          } else {
                            setShowNewUniversityInput(false);
                            setEditForm({ ...editForm, university: e.target.value });
                          }
                        }}
                        className="w-full h-10 px-3 bg-white dark:bg-red-900/30 border border-slate-200 dark:border-slate-800 rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Select University</option>
                        {universities.map(uni => (
                          <option key={uni._id || uni.name} value={uni.name}>{uni.name}</option>
                        ))}
                        <option value="addNew" className="font-bold text-red-600">+ Add New University</option>
                      </select>

                      {showNewUniversityInput && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="relative">
                            <Input
                              type="text"
                              placeholder="Type new university name..."
                              value={newUniversityName}
                              onChange={(e) => setNewUniversityName(e.target.value)}
                              className="pr-10 bg-white dark:bg-red-900/50 border-red-400 focus:border-red-600"
                              autoFocus
                            />
                            <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                          </div>
                          <p className="text-[10px] text-red-600 mt-1 italic">* Global update</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-department">Department</Label>
                      <select
                        id="edit-department"
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        className="w-full h-10 px-3 bg-white dark:bg-red-900/30 border border-slate-200 dark:border-slate-800 rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Home Address</Label>
                    <Input
                      id="edit-address"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-conditions">Medical Conditions</Label>
                      <Input
                        id="edit-conditions"
                        value={editForm.medicalConditions}
                        onChange={(e) => setEditForm({ ...editForm, medicalConditions: e.target.value })}
                        placeholder="e.g. None"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-allergies">Allergies</Label>
                      <Input
                        id="edit-allergies"
                        value={editForm.allergies}
                        onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                        placeholder="e.g. Penicillin"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-red-50 dark:border-red-900/30">
                    <div className="space-y-2">
                      <Label htmlFor="edit-econtact">Emergency Contact Name</Label>
                      <Input
                        id="edit-econtact"
                        value={editForm.emergencyContact}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-ephone">Emergency Phone</Label>
                      <Input
                        id="edit-ephone"
                        value={editForm.emergencyPhone}
                        onChange={(e) => setEditForm({ ...editForm, emergencyPhone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <input
                      type="checkbox"
                      id="edit-hostelite"
                      checked={editForm.hostelite}
                      onChange={(e) => setEditForm({ ...editForm, hostelite: e.target.checked })}
                      className="w-4 h-4 accent-red-600"
                    />
                    <Label htmlFor="edit-hostelite" className="cursor-pointer">Hostelite Donor</Label>
                  </div>

                  {isSuperAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-admin">Assigned Administrator</Label>
                      <select
                        id="edit-admin"
                        value={editForm.addedBy}
                        onChange={(e) => setEditForm({ ...editForm, addedBy: e.target.value })}
                        className="w-full h-10 px-3 bg-white dark:bg-red-900/30 border border-slate-200 dark:border-slate-800 rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">No Admin Assigned</option>
                        {admins.map((admin) => (
                          <option key={admin._id} value={admin._id}>
                            {admin.name} ({admin.university || 'No University'})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-red-600 dark:text-red-400 italic">
                        * SuperAdmins can manually assign donors to specific university admins.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 border-red-200 dark:border-red-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isSubmitting ? "Saving..." : "Update Profile"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-red-950 border-red-200 dark:border-red-900 relative">
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">Deleted!</h3>
                <p className="text-red-700 dark:text-red-300">{successMessage}</p>
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
                  <h3 className="text-xl font-bold text-red-900 dark:text-red-100">Delete Donor?</h3>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6 border border-red-100 dark:border-red-900/50">
                  <p className="text-sm text-red-900 dark:text-red-100 mb-2">
                    Are you sure you want to delete this donor record? This action cannot be undone.
                  </p>
                  {donorToDelete && (
                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium font-bold">
                      <span>{donorToDelete.name}</span>
                      <span>•</span>
                      <span>{donorToDelete.bloodGroup}</span>
                      <span>•</span>
                      <span>{donorToDelete.city}</span>
                    </div>
                  )}
                </div>
                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-md border border-red-200 dark:border-red-800">
                    {errorMessage}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 border-red-200 dark:border-red-800"
                    disabled={isSubmitting}
                  >
                    No, Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isSubmitting ? "Deleting..." : "Yes, Delete Record"}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
      <Transition appear show={isDetailsModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsDetailsModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                  {donorToShow && (
                    <div className="relative">
                      <div className="h-32 bg-gradient-to-r from-red-600 to-pink-600 relative">
                        <button
                          onClick={() => setIsDetailsModalOpen(false)}
                          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <div className="absolute -bottom-10 left-8">
                          <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center border-4 border-white dark:border-slate-800">
                            <div className="text-center">
                              <Droplet className="w-6 h-6 text-red-600 mx-auto" />
                              <span className="text-2xl font-black text-red-600 uppercase leading-none">
                                {donorToShow.bloodGroup}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-14 pb-8 px-8">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                          <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                              {donorToShow.name}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                              <Mail className="w-4 h-4" />
                              {donorToShow.email}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${donorToShow.isAvailable
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                              }`}>
                              {donorToShow.availabilityLabel}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${donorToShow.hostelite
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
                              }`}>
                              {donorToShow.hostelite ? "Hostelite" : "Non-Hostelite"}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Personal Details
                            </h3>
                            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Phone</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{donorToShow.phone}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">City</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{donorToShow.city}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">CNIC</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{donorToShow.cnic || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Address</span>
                                <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[150px] truncate" title={donorToShow.address}>
                                  {donorToShow.address || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">University</span>
                                <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[150px] truncate">
                                  {donorToShow.university || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Department</span>
                                <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[150px] truncate">
                                  {donorToShow.department || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                              <Heart className="w-4 h-4" />
                              Medical Profile
                            </h3>
                            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Total Donations</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{donorToShow.donations} times</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Last Donation</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{donorToShow.lastDonationDisplay}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Conditions</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{donorToShow.medicalConditions || 'None'}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Allergies</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{donorToShow.allergies || 'None'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-2 space-y-4">
                            <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Emergency Contact Information
                            </h3>
                            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-red-600 font-bold uppercase tracking-tight leading-none mb-1">Contact Person</p>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                                    {donorToShow.emergencyContact || 'Not Specified'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                  <Phone className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-red-600 font-bold uppercase tracking-tight leading-none mb-1">Phone Number</p>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                                    {donorToShow.emergencyPhone || 'Not Specified'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                          <Button
                            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
                            onClick={() => setIsDetailsModalOpen(false)}
                          >
                            Close Details
                          </Button>
                          {(isAdmin || isSuperAdmin) && (
                            <Button
                              variant="outline"
                              className="h-12 border-red-200 dark:border-red-800 text-red-600 font-bold rounded-xl"
                              onClick={() => {
                                setIsDetailsModalOpen(false);
                                openEditModal(donorToShow);
                              }}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Profile
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {isDonationModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-sm p-6 bg-white dark:bg-red-950 border-red-200 dark:border-red-900 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-red-600" />
              Donation Location
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4 font-medium">
              Please enter the name of the Hospital or Blood Center where blood was donated.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hospital-name" className="text-red-900 dark:text-red-100">Hospital Name</Label>
                <Input
                  id="hospital-name"
                  placeholder="e.g. Allied Hospital, Faisalabad"
                  value={donationLocation}
                  onChange={(e) => setDonationLocation(e.target.value)}
                  className="bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100 focus:ring-red-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDonationModalOpen(false)}
                  className="flex-1 border-red-200 dark:border-red-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDonation}
                  disabled={!donationLocation.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                >
                  Confirm Donation
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Transition appear show={showSuccess || !!errorMessage} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[70]"
          onClose={() => {
            setShowSuccess(false);
            setErrorMessage("");
          }}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
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
                <Dialog.Panel className={`w-full max-w-sm transform overflow-hidden rounded-3xl p-6 text-center shadow-2xl transition-all border ${errorMessage
                  ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900'
                  : 'bg-white dark:bg-slate-900 border-red-100 dark:border-red-900'
                  }`}>
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${errorMessage ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                    {errorMessage ? (
                      <AlertTriangle className="w-10 h-10 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    )}
                  </div>

                  <h3 className={`text-xl font-bold mb-2 ${errorMessage ? 'text-rose-900 dark:text-rose-100' : 'text-red-900 dark:text-red-100'
                    }`}>
                    {errorMessage ? 'Error' : 'Success!'}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-medium">
                    {errorMessage || successMessage}
                  </p>

                  <Button
                    onClick={() => {
                      setShowSuccess(false);
                      setErrorMessage("");
                    }}
                    className={`w-full h-11 font-bold rounded-xl ${errorMessage
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                  >
                    Continue
                  </Button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
