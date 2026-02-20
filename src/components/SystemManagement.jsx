import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, University, Building2, Trash2, Plus, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUniversities, deleteUniversity } from '@/services/universityService';
import { fetchDepartments, deleteDepartment } from '@/services/departmentService';

export default function SystemManagement() {
    const { token, user } = useAuth();
    const [universities, setUniversities] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uniSearch, setUniSearch] = useState('');
    const [deptSearch, setDeptSearch] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [uniData, deptData] = await Promise.all([
                fetchUniversities(),
                fetchDepartments()
            ]);
            setUniversities(uniData);
            setDepartments(deptData);
        } catch (err) {
            setError('Failed to load system data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDeleteUniversity = async (id) => {
        if (!window.confirm('Are you sure you want to delete this university? This may affect users who have it selected.')) return;

        try {
            await deleteUniversity(id, token);
            setSuccess('University deleted successfully');
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to delete university');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDeleteDepartment = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department? This may affect users who have it selected.')) return;

        try {
            await deleteDepartment(id, token);
            setSuccess('Department deleted successfully');
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to delete department');
            setTimeout(() => setError(''), 3000);
        }
    };

    const filteredUnis = universities.filter(u => u.name.toLowerCase().includes(uniSearch.toLowerCase()));
    const filteredDepts = departments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase()));

    if (user?.role !== 'superadmin') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-900">Access Denied</h2>
                <p className="text-gray-600">Only SuperAdmins can access this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-red-900 dark:text-red-100 flex items-center gap-2">
                        <Settings className="w-8 h-8 text-red-600 animate-spin-slow" />
                        System Management
                    </h2>
                    <p className="text-red-700 dark:text-red-300">Manage global system options like Universities and Departments</p>
                </div>
            </div>

            {(error || success) && (
                <div className="fixed top-24 right-6 z-50 space-y-2">
                    {error && (
                        <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-in slide-in-from-right">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-in slide-in-from-right">
                            <CheckCircle className="w-5 h-5" />
                            <span>{success}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Universities Management */}
                <Card className="p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900 shadow-xl overflow-hidden rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-red-900 dark:text-red-100 flex items-center gap-2">
                            <University className="w-6 h-6 text-red-600" />
                            Universities
                            <span className="text-sm font-normal text-red-500 ml-2">({universities.length})</span>
                        </h3>
                    </div>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search universities..."
                            value={uniSearch}
                            onChange={(e) => setUniSearch(e.target.value)}
                            className="pl-10 bg-white/50 border-red-100"
                        />
                    </div>

                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {loading ? (
                            <p className="text-center py-8 text-gray-500 italic">Loading...</p>
                        ) : filteredUnis.length > 0 ? (
                            filteredUnis.map((uni) => (
                                <div key={uni._id} className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-100">
                                    <span className="font-medium text-red-900 dark:text-red-100">{uni.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteUniversity(uni._id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-8 text-gray-500 italic">No universities found</p>
                        )}
                    </div>
                </Card>

                {/* Departments Management */}
                <Card className="p-6 bg-white/80 dark:bg-red-950/50 backdrop-blur-sm border-red-200 dark:border-red-900 shadow-xl overflow-hidden rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-red-900 dark:text-red-100 flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-red-600" />
                            Departments
                            <span className="text-sm font-normal text-red-500 ml-2">({departments.length})</span>
                        </h3>
                    </div>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search departments..."
                            value={deptSearch}
                            onChange={(e) => setDeptSearch(e.target.value)}
                            className="pl-10 bg-white/50 border-red-100"
                        />
                    </div>

                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {loading ? (
                            <p className="text-center py-8 text-gray-500 italic">Loading...</p>
                        ) : filteredDepts.length > 0 ? (
                            filteredDepts.map((dept) => (
                                <div key={dept._id} className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-100">
                                    <span className="font-medium text-red-900 dark:text-red-100">{dept.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteDepartment(dept._id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-8 text-gray-500 italic">No departments found</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
