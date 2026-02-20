import React, { useEffect, useMemo, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import {
    Pencil,
    Trash2,
    CheckCircle2,
    Clock,
    X,
    AlertTriangle
} from "lucide-react";

const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
];
const STATUS_VALUES = STATUS_OPTIONS.map((option) => option.value);

const COUNTRY_CODES = [
    {
        country: "Pakistan",
        dialCode: "+92",
        maxLength: 10,
        placeholder: "3001234567",
    },
    {
        country: "Bangladesh",
        dialCode: "+880",
        maxLength: 10,
        placeholder: "1700123456",
    },
    {
        country: "India",
        dialCode: "+91",
        maxLength: 10,
        placeholder: "9000012345",
    },
    {
        country: "Nepal",
        dialCode: "+977",
        maxLength: 10,
        placeholder: "9800012345",
    },
    {
        country: "Sri Lanka",
        dialCode: "+94",
        maxLength: 9,
        placeholder: "701234567",
    },
    {
        country: "Other",
        dialCode: "+00",
        maxLength: 12,
        placeholder: "1234567890",
    },
];

const EMPTY_FORM = {
    patientName: "",
    bloodGroup: "",
    hospital: "",
    countryCode: COUNTRY_CODES[0].dialCode,
    contactNumber: "",
    requiredTime: "",
    status: STATUS_OPTIONS[0].value,
    notes: "",
};

const normalizeStatus = (value) => {
    const normalized = (value ?? "").toString().trim().toLowerCase();
    return STATUS_VALUES.includes(normalized)
        ? normalized
        : STATUS_OPTIONS[0].value;
};

const getCountryMeta = (code) =>
    COUNTRY_CODES.find((option) => option.dialCode === code) || COUNTRY_CODES[0];

const sanitizePhone = (value, maxLength) =>
    (value || "").replace(/\D/g, "").slice(0, maxLength);

const normalizeRecord = (record) => {
    const countryMeta = getCountryMeta(record?.countryCode);
    return {
        id: record?.id || record?._id,
        patientName: record?.patientName || "",
        bloodGroup: record?.bloodGroup || "",
        hospital: record?.hospital || "",
        countryCode: countryMeta.dialCode,
        contactNumber: sanitizePhone(
            record?.contactNumber || "",
            countryMeta.maxLength
        ),
        status: normalizeStatus(record?.status),
        notes: record?.notes || "",
        requiredTime: record?.requiredTime || "",
        createdAt: record?.createdAt || new Date().toISOString(),
        createdBy: record?.createdBy || "",
    };
};

export default function BloodRequest() {
    const { user, isAdmin, isSuperAdmin, token } = useAuth();
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [records, setRecords] = useState([]);
    const [activeTab, setActiveTab] = useState("pending");
    const userEmail = user?.email || "anonymous@user.com";
    const canViewAllRecords = isAdmin || isSuperAdmin;
    const [loading, setLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [token]);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/requests', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setRecords(data.map(r => ({
                    ...r,
                    id: r._id,
                    hospital: r.hospital || "",
                    notes: r.notes || "",
                    contactNumber: r.contactNumber || "",
                    requiredTime: r.requiredTime || ""
                })));
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoading(false);
        }
    };

    const selectedCountry = useMemo(() => {
        return getCountryMeta(formData.countryCode);
    }, [formData.countryCode]);

    const scopedRecords = useMemo(() => {
        return records;
    }, [records]);

    const pendingCount = useMemo(
        () => scopedRecords.filter((record) => record.status === "pending").length,
        [scopedRecords]
    );
    const completedCount = useMemo(
        () =>
            scopedRecords.filter((record) => record.status === "completed").length,
        [scopedRecords]
    );

    const filteredRecords = useMemo(
        () => scopedRecords.filter((record) => record.status === activeTab),
        [scopedRecords, activeTab]
    );

    const handleChange = (event) => {
        const { name, value } = event.target;
        if (name === "countryCode") {
            const meta = getCountryMeta(value);
            setFormData((prev) => ({
                ...prev,
                countryCode: value,
                contactNumber: prev.contactNumber.slice(0, meta.maxLength),
            }));
            return;
        }
        const nextValue = name === "status" ? normalizeStatus(value) : value;
        setFormData((prev) => ({ ...prev, [name]: nextValue }));
    };

    const handleContactChange = (event) => {
        const digitsOnly = sanitizePhone(
            event.target.value,
            selectedCountry.maxLength
        );
        setFormData((prev) => ({
            ...prev,
            contactNumber: digitsOnly,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (
            !formData.patientName?.trim() ||
            !formData.bloodGroup?.trim() ||
            !formData.hospital?.trim() ||
            !formData.contactNumber?.trim() ||
            !formData.requiredTime?.trim()
        ) {
            setErrorMessage("Please fill all mandatory fields marked with (*)");
            setIsErrorModalOpen(true);
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const newRecord = await res.json();
                setRecords(prev => [{ ...newRecord, id: newRecord._id }, ...prev]);
                setFormData({ ...EMPTY_FORM });
                setActiveTab(formData.status || "pending");

                setSuccessMessage("Blood request has been saved successfully.");
                setIsSuccessModalOpen(true);
                setTimeout(() => setIsSuccessModalOpen(false), 3000);
            }
        } catch (error) {
            console.error("Failed to create request", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (record) => {
        setSelectedRecord(record);
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedRecord) return;

        try {
            setIsSubmitting(true);
            const res = await fetch(`/api/requests/${selectedRecord.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(selectedRecord)
            });

            if (res.ok) {
                const updated = await res.json();
                setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...updated, id: updated._id } : r));
                setIsEditModalOpen(false);
                setSuccessMessage("Request updated successfully.");
                setIsSuccessModalOpen(true);
                setTimeout(() => setIsSuccessModalOpen(false), 2000);
            }
        } catch (error) {
            console.error("Failed to update request", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteModal = (record) => {
        setSelectedRecord(record);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedRecord) return;
        try {
            setIsSubmitting(true);
            const res = await fetch(`/api/requests/${selectedRecord.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                setRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
                setIsDeleteModalOpen(false);
                setSuccessMessage("Request deleted successfully.");
                setIsSuccessModalOpen(true);
                setTimeout(() => setIsSuccessModalOpen(false), 2000);
            }
        } catch (error) {
            console.error("Failed to delete", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        const nextStatus = normalizeStatus(status);

        try {
            const res = await fetch(`/api/requests/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: nextStatus })
            });

            if (res.ok) {
                setRecords((prev) =>
                    prev.map((item) =>
                        item.id === id
                            ? { ...item, status: nextStatus }
                            : item
                    )
                );
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleClearAll = async () => {
        setIsBulkDeleteModalOpen(true);
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            setIsSubmitting(true);
            const res = await fetch('/api/requests/action/bulk-delete', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setRecords([]);
                setIsBulkDeleteModalOpen(false);
                setSuccessMessage("All blood requests deleted successfully.");
                setIsSuccessModalOpen(true);
                setTimeout(() => setIsSuccessModalOpen(false), 2000);
            } else {
                const data = await res.json();
                console.error("Bulk delete error response:", data);
                setErrorMessage(data.message || "Failed to delete all requests");
                setIsErrorModalOpen(true);
                setIsBulkDeleteModalOpen(false);
            }
        } catch (error) {
            console.error("Failed to clear all - unexpected error:", error);
            setErrorMessage("An unexpected network error occurred.");
            setIsErrorModalOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`/api/requests/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                setRecords(prev => prev.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-red-200 bg-white/70 backdrop-blur">
                <CardHeader>
                    <CardTitle className="text-red-900">Add Blood Request</CardTitle>
                    <CardDescription>
                        Track patients who currently need blood so the team can follow up
                        quickly.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="patientName">Patient Name *</Label>
                            <Input
                                id="patientName"
                                name="patientName"
                                value={formData.patientName}
                                onChange={handleChange}
                                placeholder="Enter patient name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bloodGroup">Blood Group *</Label>
                            <select
                                id="bloodGroup"
                                name="bloodGroup"
                                value={formData.bloodGroup}
                                onChange={handleChange}
                                required
                                className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                            >
                                <option value="">Select Blood Group</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hospital">Hospital / Location *</Label>
                            <Input
                                id="hospital"
                                name="hospital"
                                value={formData.hospital}
                                onChange={handleChange}
                                placeholder="Civil Hospital, Faisalabad"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="requiredTime">Time Required *</Label>
                            <Input
                                id="requiredTime"
                                name="requiredTime"
                                type="time"
                                value={formData.requiredTime || ""}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactNumber">Contact Number</Label>
                            <div className="flex gap-2">
                                <select
                                    id="countryCode"
                                    name="countryCode"
                                    value={formData.countryCode}
                                    onChange={handleChange}
                                    className="rounded-md border border-red-200 bg-white px-2 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                                >
                                    {COUNTRY_CODES.map((option) => (
                                        <option key={option.dialCode} value={option.dialCode}>
                                            {option.country} ({option.dialCode})
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    id="contactNumber"
                                    name="contactNumber"
                                    value={formData.contactNumber || ""}
                                    onChange={handleContactChange}
                                    placeholder={selectedCountry.placeholder}
                                    inputMode="numeric"
                                    pattern="\d*"
                                    maxLength={selectedCountry.maxLength}
                                    className="flex-1"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows="3"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Urgency, blood units required, additional contact, etc."
                                className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                            />
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row">
                            <Button
                                type="submit"
                                className="bg-red-600 hover:bg-red-700 text-white flex-1"
                            >
                                Save Blood Request
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormData(EMPTY_FORM)}
                            >
                                Reset Form
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-red-200 bg-white/70 backdrop-blur">
                <CardHeader className="space-y-4">
                    <div>
                        <CardTitle className="text-red-900">Blood Requests</CardTitle>
                        <CardDescription>
                            Review active blood requests and update the fulfilment status.
                        </CardDescription>
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="inline-flex items-center rounded-full bg-red-50 p-1 text-sm font-semibold text-red-600 dark:bg-red-900/20">
                            <button
                                type="button"
                                onClick={() => setActiveTab("pending")}
                                className={`rounded-full px-4 py-1 transition ${activeTab === "pending"
                                    ? "bg-white text-red-700 shadow"
                                    : "text-red-500"
                                    }`}
                            >
                                Pending ({pendingCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("completed")}
                                className={`rounded-full px-4 py-1 transition ${activeTab === "completed"
                                    ? "bg-white text-red-700 shadow"
                                    : "text-red-500"
                                    }`}
                            >
                                Completed ({completedCount})
                            </button>
                        </div>
                        {canViewAllRecords && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-100"
                                onClick={handleClearAll}
                            >
                                Clear All
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {filteredRecords.length === 0 ? (
                        <p className="text-sm text-red-700/80 text-center py-6">
                            No {activeTab} blood requests yet. Use the form above to add a
                            new request.
                        </p>
                    ) : (
                        filteredRecords.map((record) => (
                            <div
                                key={record.id}
                                className="rounded-lg border border-red-100 bg-white/80 p-4 shadow-sm space-y-3"
                            >
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-red-900">
                                            {record.patientName}
                                        </p>
                                        <p className="text-xs text-red-600">
                                            Blood Group: {record.bloodGroup}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs uppercase text-red-500 tracking-wide">
                                            Status
                                        </span>
                                        <select
                                            value={record.status}
                                            onChange={(event) =>
                                                handleStatusChange(record.id, event.target.value)
                                            }
                                            className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                                        >
                                            {STATUS_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="flex items-center gap-1 ml-2 border-l border-red-100 pl-2">
                                            <button
                                                onClick={() => openEditModal(record)}
                                                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                                title="Edit Request"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(record)}
                                                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                                title="Delete Request"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-2 text-sm md:grid-cols-3">
                                    {record.hospital && (
                                        <p className="text-red-700">
                                            <span className="font-semibold">Hospital:</span>{" "}
                                            {record.hospital}
                                        </p>
                                    )}
                                    {record.requiredTime && (
                                        <p className="text-red-700">
                                            <span className="font-semibold">Time:</span>{" "}
                                            {record.requiredTime}
                                        </p>
                                    )}
                                    {(record.countryCode || record.contactNumber) && (
                                        <p className="text-red-700">
                                            <span className="font-semibold">Contact:</span>{" "}
                                            {`${record.countryCode || ""} ${record.contactNumber || ""
                                                }`.trim()}
                                        </p>
                                    )}
                                </div>
                                {record.notes && (
                                    <p className="text-sm text-red-800 bg-red-50 rounded-md p-2">
                                        {record.notes}
                                    </p>
                                )}
                                <Separator />
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-red-50 dark:border-red-900/30">
                                    <p className="text-xs font-medium text-red-600/80">
                                        Added by: <span className="font-bold">
                                            {record.createdBy?.name ||
                                                ((record.createdBy === user?._id || record.createdBy?._id === user?._id) ? "You" : "Team member")}
                                        </span>
                                    </p>
                                    <p className="text-xs text-red-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(record.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {
                isSuccessModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                        <Card className="w-full max-w-sm p-8 bg-white dark:bg-red-950 border-red-200 text-center shadow-2xl">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <CheckCircle2 className="w-12 h-12 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-red-900 mb-2">Success!</h3>
                            <p className="text-red-700">{successMessage}</p>
                        </Card>
                    </div>
                )
            }

            {
                isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-md p-6 bg-white border-red-200 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-red-900 text-left">Confirm Deletion</h3>
                                    <p className="text-sm text-red-600 text-left">This action cannot be undone.</p>
                                </div>
                            </div>
                            <p className="text-red-800 mb-6 text-sm">
                                Are you sure you want to delete the blood request for <span className="font-bold underline text-red-900">{selectedRecord?.patientName}</span>?
                            </p>
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteConfirm}
                                    disabled={isSubmitting}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {isSubmitting ? "Deleting..." : "Yes, Delete Record"}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )
            }

            {
                isBulkDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-md p-6 bg-white border-red-200 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-red-900 text-left">Clear All Requests?</h3>
                                    <p className="text-sm text-red-600 text-left">This action cannot be undone.</p>
                                </div>
                            </div>
                            <p className="text-red-800 mb-6 text-sm">
                                Are you sure you want to delete <span className="font-bold underline text-red-900">ALL</span> blood requests? This will permanently remove all records from the system.
                            </p>
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsBulkDeleteModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleBulkDeleteConfirm}
                                    disabled={isSubmitting}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {isSubmitting ? "Clearing..." : "Yes, Clear Everything"}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )
            }

            {
                isErrorModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                        <Card className="w-full max-w-sm p-8 bg-white dark:bg-red-950 border-red-200 text-center shadow-2xl">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-12 h-12 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-red-900 mb-2">Error</h3>
                            <p className="text-red-700 mb-6">{errorMessage}</p>
                            <Button
                                onClick={() => setIsErrorModalOpen(false)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                            >
                                Close
                            </Button>
                        </Card>
                    </div>
                )
            }

            {
                isEditModalOpen && selectedRecord && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-lg p-6 bg-white border-red-200 shadow-2xl relative overflow-y-auto max-h-[90vh]">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-xl font-bold text-red-900 mb-6 flex items-center gap-2">
                                <Pencil className="w-5 h-5" />
                                Edit Blood Request
                            </h3>

                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-name">Patient Name *</Label>
                                        <Input
                                            id="edit-name"
                                            value={selectedRecord.patientName}
                                            onChange={(e) => setSelectedRecord({ ...selectedRecord, patientName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-blood">Blood Group *</Label>
                                        <select
                                            id="edit-blood"
                                            value={selectedRecord.bloodGroup}
                                            onChange={(e) => setSelectedRecord({ ...selectedRecord, bloodGroup: e.target.value })}
                                            required
                                            className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                                        >
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-hospital">Hospital *</Label>
                                        <Input
                                            id="edit-hospital"
                                            value={selectedRecord.hospital}
                                            onChange={(e) => setSelectedRecord({ ...selectedRecord, hospital: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-time">Time Required *</Label>
                                        <Input
                                            id="edit-time"
                                            type="time"
                                            value={selectedRecord.requiredTime}
                                            onChange={(e) => setSelectedRecord({ ...selectedRecord, requiredTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="edit-contact">Contact Number *</Label>
                                        <Input
                                            id="edit-contact"
                                            value={selectedRecord.contactNumber}
                                            onChange={(e) => setSelectedRecord({ ...selectedRecord, contactNumber: e.target.value.replace(/\D/g, "") })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="edit-notes">Notes</Label>
                                        <textarea
                                            id="edit-notes"
                                            value={selectedRecord.notes}
                                            onChange={(e) => setSelectedRecord({ ...selectedRecord, notes: e.target.value })}
                                            rows="3"
                                            className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditModalOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
                                    >
                                        {isSubmitting ? "Saving..." : "Update Request"}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )
            }
        </div >
    );
}
