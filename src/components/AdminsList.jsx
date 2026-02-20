import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Shield,
    Search,
    Mail,
    Phone,
    User,
    Settings,
    Trash2,
    Edit2,
    X,
    CheckCircle2,
    AlertTriangle,
    Droplet,
    FileText,
    MapPin,
    Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUniversities, addUniversity as addNewUniversityApi } from "@/services/universityService";
import { fetchDepartments, addDepartment as addNewDepartmentApi } from "@/services/departmentService";

const AdminsList = () => {
    const { token, user: currentUser } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("");

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [adminToEdit, setAdminToEdit] = useState(null);
    const [adminToDelete, setAdminToDelete] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [universities, setUniversities] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [showNewUniversityInput, setShowNewUniversityInput] = useState(false);
    const [newUniversityName, setNewUniversityName] = useState('');
    const [showNewDepartmentInput, setShowNewDepartmentInput] = useState(false);
    const [newDepartmentName, setNewDepartmentName] = useState('');

    useEffect(() => {
        const loadInitialData = async () => {
            const [uniData, deptData] = await Promise.all([
                fetchUniversities(),
                fetchDepartments()
            ]);
            setUniversities(uniData);
            setDepartments(deptData);
        };
        loadInitialData();
    }, []);

    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        phone: "",
        role: "",
        permissions: {
            manageUsers: false,
            manageDonors: false,
            viewReports: false,
        },
        university: "",
        department: "",
        bloodGroup: "",
        cnic: "",
    });

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/users?role=admin", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const res2 = await fetch("/api/users?role=superadmin", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok && res2.ok) {
                const adminData = await res.json();
                const superAdminData = await res2.json();
                setAdmins([...adminData, ...superAdminData]);
            }
        } catch (err) {
            console.error("Failed to fetch admins:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchAdmins();
    }, [token]);

    const filteredAdmins = admins.filter((admin) => {
        const matchesSearch =
            admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !filterRole || admin.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const openEditModal = (admin) => {
        setAdminToEdit(admin);
        setEditForm({
            name: admin.name,
            email: admin.email,
            phone: admin.phone ? admin.phone.replace('+92', '') : "",
            role: admin.role,
            permissions: admin.permissions || {
                manageUsers: false,
                manageDonors: false,
                viewReports: false,
            },
            university: admin.university || "",
            department: admin.department || "",
            bloodGroup: admin.bloodGroup || "",
            cnic: admin.cnic || "",
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");
        try {
            let finalUniversity = editForm.university;
            let finalDepartment = editForm.department;

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

            if (showNewDepartmentInput && newDepartmentName.trim()) {
                try {
                    const addedDept = await addNewDepartmentApi(newDepartmentName.trim(), token);
                    finalDepartment = addedDept.name;
                } catch (err) {
                    setErrorMessage(err.message || "Failed to add new department");
                    setIsSubmitting(false);
                    return;
                }
            }

            const res = await fetch(`/api/users/${adminToEdit._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...editForm,
                    phone: `+92${editForm.phone}`,
                    university: finalUniversity,
                    department: finalDepartment,
                }),
            });

            if (res.ok) {
                setSuccessMessage("Admin updated successfully!");
                setShowSuccess(true);
                fetchAdmins();
                setTimeout(() => {
                    setIsEditModalOpen(false);
                    setShowSuccess(false);
                }, 2000);
            } else {
                const data = await res.json();
                setErrorMessage(data.message || "Failed to update admin");
            }
        } catch (err) {
            setErrorMessage("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteModal = (admin) => {
        if (admin._id === currentUser._id) {
            setErrorMessage("You cannot delete yourself!");
            setTimeout(() => setErrorMessage(""), 3000);
            return;
        }
        setAdminToDelete(admin);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/users/${adminToDelete._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setSuccessMessage("Admin deleted successfully!");
                setShowSuccess(true);
                fetchAdmins();
                setTimeout(() => {
                    setIsDeleteModalOpen(false);
                    setShowSuccess(false);
                }, 2000);
            }
        } catch (err) {
            setErrorMessage("An error occurred");
        } finally {
            setIsSubmitting(false);
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-red-100 flex items-center gap-2">
                        <Shield className="w-8 h-8 text-red-600" />
                        All Admins
                    </h2>
                    <p className="text-red-700 dark:text-red-300">View and manage system administrators</p>
                </div>
            </div>

            <Card className="p-4 md:p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-600 w-5 h-5" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white dark:bg-red-900/30 border-red-300 dark:border-red-800"
                        />
                    </div>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-red-900/50 border border-red-300 dark:border-red-800 rounded-md text-red-900 dark:text-red-100"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAdmins.map((admin) => (
                        <Card key={admin._id} className="p-4 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-900">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                        {admin.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-red-900 dark:text-red-100">{admin.name}</h3>
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                            {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                                        </span>
                                    </div>
                                </div>
                                {admin._id !== currentUser._id && (
                                    <div className="flex gap-1">
                                        <button onClick={() => openEditModal(admin)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                        <button onClick={() => openDeleteModal(admin)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
                                <div className="flex items-center gap-2"><Mail size={14} /> {admin.email}</div>
                                <div className="flex items-center gap-2"><Phone size={14} /> {admin.phone}</div>
                                {admin.university && <div className="flex items-center gap-2"><MapPin size={14} /> {admin.university}</div>}
                                {admin.department && <div className="flex items-center gap-2"><Shield size={14} className="w-3.5 h-3.5" /> {admin.department}</div>}
                                {admin.cnic && <div className="flex items-center gap-2 text-[11px] opacity-70"><FileText size={12} /> {admin.cnic}</div>}
                                <div className="flex items-center gap-2"><Droplet size={14} className="text-red-600" /> <span className="font-bold">{admin.bloodGroup || 'N/A'}</span></div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-red-100 dark:border-red-900/50">
                                <p className="text-xs font-bold text-red-900 dark:text-red-100 mb-2 uppercase">Permissions:</p>
                                <div className="flex flex-wrap gap-1">
                                    {admin.permissions?.manageUsers && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">Users</span>}
                                    {admin.permissions?.manageDonors && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">Donors</span>}
                                    {admin.permissions?.viewReports && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">Reports</span>}
                                    {!admin.permissions?.manageUsers && !admin.permissions?.manageDonors && !admin.permissions?.viewReports && <span className="text-[10px] text-gray-500">No special permissions</span>}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </Card>

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md p-6 bg-white dark:bg-red-950 border-red-200 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-500"><X /></button>
                        {showSuccess ? (
                            <div className="text-center py-8">
                                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">Success!</h3>
                                <p>{successMessage}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <h3 className="text-xl font-bold flex items-center gap-2"><Edit2 size={20} /> Edit Admin</h3>
                                <div>
                                    <Label>Name</Label>
                                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                                </div>
                                <div>
                                    <Label>Phone Number</Label>
                                    <div className="flex items-center bg-white dark:bg-red-950/30 border border-slate-200 dark:border-red-800 rounded-md focus-within:ring-1 focus-within:ring-red-500">
                                        <div className="flex items-center gap-1.5 px-3 py-2 border-r border-slate-200 dark:border-red-800">
                                            <span className="text-sm font-medium text-red-900 dark:text-red-100">+92</span>
                                        </div>
                                        <Input
                                            value={editForm.phone}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                if (val.length <= 10) {
                                                    setEditForm({ ...editForm, phone: val });
                                                }
                                            }}
                                            placeholder="3000000000"
                                            className="border-0 focus:ring-0 shadow-none bg-transparent"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Account Role</Label>
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                        className="w-full h-10 px-3 bg-white dark:bg-red-950/30 border border-slate-200 dark:border-red-800 rounded-md text-red-900 dark:text-red-100"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="superadmin">Super Admin</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Blood Group</Label>
                                        <select
                                            value={editForm.bloodGroup}
                                            onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                                            className="w-full h-10 px-3 bg-white dark:bg-red-950/30 border border-slate-200 dark:border-red-800 rounded-md text-red-900 dark:text-red-100"
                                            required
                                        >
                                            <option value="">Select Blood Group</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>CNIC</Label>
                                        <Input
                                            value={editForm.cnic}
                                            onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })}
                                            placeholder="35202-XXXXXXX-X"
                                            className="bg-white dark:bg-red-950/30 border-slate-200 dark:border-red-800 text-red-900 dark:text-red-100"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>University</Label>
                                        <select
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
                                            className="w-full h-10 px-3 bg-white dark:bg-red-950/30 border border-slate-200 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:outline-none focus:ring-1 focus:ring-red-500"
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
                                                        className="pr-10 bg-white dark:bg-red-950/50 border-red-400 focus:border-red-600"
                                                        autoFocus
                                                    />
                                                    <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                                </div>
                                                <p className="text-[10px] text-red-600 mt-1 italic">* Global update</p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Label>Department</Label>
                                        <select
                                            value={showNewDepartmentInput ? 'addNew' : editForm.department}
                                            onChange={(e) => {
                                                if (e.target.value === 'addNew') {
                                                    setShowNewDepartmentInput(true);
                                                    setEditForm({ ...editForm, department: '' });
                                                } else {
                                                    setShowNewDepartmentInput(false);
                                                    setEditForm({ ...editForm, department: e.target.value });
                                                }
                                            }}
                                            className="w-full h-10 px-3 bg-white dark:bg-red-950/30 border border-slate-200 dark:border-red-800 rounded-md text-red-900 dark:text-red-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept._id || dept.name} value={dept.name}>{dept.name}</option>
                                            ))}
                                            <option value="addNew" className="font-bold text-red-600">+ Add New Department</option>
                                        </select>

                                        {showNewDepartmentInput && (
                                            <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="relative">
                                                    <Input
                                                        type="text"
                                                        placeholder="Type new department name..."
                                                        value={newDepartmentName}
                                                        onChange={(e) => setNewDepartmentName(e.target.value)}
                                                        className="pr-10 bg-white dark:bg-red-950/50 border-red-400 focus:border-red-600"
                                                        autoFocus
                                                    />
                                                    <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                                                </div>
                                                <p className="text-[10px] text-red-600 mt-1 italic">* Global update</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label>Permissions</Label>
                                    {Object.keys(editForm.permissions).map(perm => (
                                        <label key={perm} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editForm.permissions[perm]}
                                                onChange={(e) => setEditForm({
                                                    ...editForm,
                                                    permissions: { ...editForm.permissions, [perm]: e.target.checked }
                                                })}
                                                className="rounded accent-red-600"
                                            />
                                            <span className="text-sm capitalize">{perm.replace(/([A-Z])/g, ' $1')}</span>
                                        </label>
                                    ))}
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700">
                                    {isSubmitting ? "Updating..." : "Save Changes"}
                                </Button>
                            </form>
                        )}
                    </Card>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-sm p-6 bg-white dark:bg-red-950 border-red-200">
                        {showSuccess ? (
                            <div className="text-center py-8">
                                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <p>{successMessage}</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                <h3 className="text-xl font-bold mb-2">Delete Admin?</h3>
                                <p className="text-sm text-gray-500 mb-6">Are you sure you want to remove <strong>{adminToDelete?.name}</strong>? This action cannot be undone.</p>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="flex-1">Cancel</Button>
                                    <Button onClick={handleDeleteConfirm} disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700">
                                        {isSubmitting ? "Deleting..." : "Delete"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {errorMessage && (
                <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-[100]">
                    <AlertTriangle size={20} />
                    <span>{errorMessage}</span>
                </div>
            )}
        </div>
    );
};

export default AdminsList;
