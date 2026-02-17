import React, { useState, useEffect, Fragment } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, Transition } from '@headlessui/react';
import {
    Calendar,
    MapPin,
    Trash2,
    Plus,
    Pencil,
    X,
    CheckCircle,
    AlertTriangle,
    Info
} from 'lucide-react';

export default function EventsManager() {
    const { token } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [editingEvent, setEditingEvent] = useState(null);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        location: ''
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/events');
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingEvent(null);
        setFormData({ title: '', description: '', date: '', location: '' });
        setErrorMessage('');
        setIsFormModalOpen(true);
    };

    const openEditModal = (event) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description,
            date: new Date(event.date).toISOString().split('T')[0],
            location: event.location
        });
        setErrorMessage('');
        setIsFormModalOpen(true);
    };

    const openDeleteModal = (event) => {
        setEventToDelete(event);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!eventToDelete || !token) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/events/${eventToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setEvents(events.filter(e => e._id !== eventToDelete._id));
                setSuccessMessage('Event deleted successfully');
                setShowSuccess(true);
                setTimeout(() => {
                    setIsDeleteModalOpen(false);
                    setShowSuccess(false);
                }, 2000);
            } else {
                setErrorMessage('Failed to delete event');
            }
        } catch (err) {
            console.error(err);
            setErrorMessage('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsSubmitting(true);

        const url = editingEvent ? `/api/events/${editingEvent._id}` : '/api/events';
        const method = editingEvent ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const savedEvent = await res.json();
                if (editingEvent) {
                    setEvents(events.map(e => e._id === savedEvent._id ? savedEvent : e));
                    setSuccessMessage('Event updated successfully');
                } else {
                    setEvents([...events, savedEvent]);
                    setSuccessMessage('Event created successfully');
                }
                setShowSuccess(true);
                setTimeout(() => {
                    setIsFormModalOpen(false);
                    setShowSuccess(false);
                }, 2000);
            } else {
                const data = await res.json();
                setErrorMessage(data.message || 'Failed to save event');
            }
        } catch (err) {
            console.error(err);
            setErrorMessage('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                <p className="text-red-700 font-medium">Loading events...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-red-100 dark:border-red-900/50 pb-5">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-red-900 dark:text-red-100 mb-1">Manage Events</h2>
                    <p className="text-red-600/80 dark:text-red-400/80 text-sm">Create and organize blood donation campaigns</p>
                </div>
                <Button onClick={openAddModal} className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 dark:shadow-none">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Event
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {events.length === 0 ? (
                    <div className="lg:col-span-2 flex flex-col items-center justify-center py-12 px-4 bg-white/50 dark:bg-red-950/20 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/50">
                        <Calendar className="w-12 h-12 text-red-300 mb-4" />
                        <p className="text-red-900 dark:text-red-100 font-medium text-lg text-center">No upcoming events found</p>
                        <p className="text-red-500 text-sm text-center mt-1">Start by adding your first blood donation drive or awareness campaign.</p>
                        <Button variant="outline" onClick={openAddModal} className="mt-6 border-red-200 text-red-600 hover:bg-red-50">
                            Create First Event
                        </Button>
                    </div>
                ) : (
                    events.map(event => (
                        <Card key={event._id} className="p-5 bg-white dark:bg-red-950/40 border-red-100 dark:border-red-900/50 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded">Upcoming</span>
                                        <h3 className="text-lg font-bold text-red-900 dark:text-red-100 line-clamp-1">{event.title}</h3>
                                    </div>
                                    <p className="text-sm text-red-700/70 dark:text-red-300/70 mb-4 line-clamp-2 min-h-[40px]">{event.description}</p>

                                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium">
                                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/20 px-2 py-1 rounded">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-red-500 bg-red-50/50 dark:bg-red-900/20 px-2 py-1 rounded">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {event.location}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 ml-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditModal(event)}
                                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openDeleteModal(event)}
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Transition appear show={isFormModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !isSubmitting && setIsFormModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
                                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all border border-red-100 dark:border-red-900">
                                    {showSuccess ? (
                                        <div className="py-8 text-center space-y-4">
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                                <CheckCircle className="h-10 w-10 text-green-600" />
                                            </div>
                                            <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white">
                                                {successMessage}
                                            </Dialog.Title>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">The events list has been updated.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-6">
                                                <Dialog.Title as="h3" className="text-xl font-bold text-red-900 dark:text-white flex items-center gap-2">
                                                    <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                                        {editingEvent ? <Pencil className="w-5 h-5 text-red-600" /> : <Plus className="w-5 h-5 text-red-600" />}
                                                    </div>
                                                    {editingEvent ? 'Edit Event' : 'Add New Event'}
                                                </Dialog.Title>
                                                <button
                                                    onClick={() => setIsFormModalOpen(false)}
                                                    className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <form onSubmit={handleSubmit} className="space-y-5">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="title" className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">Event Title</Label>
                                                        <Input
                                                            id="title"
                                                            placeholder="e.g., Annual Mega Blood Drive"
                                                            value={formData.title}
                                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                            required
                                                            className="bg-gray-50/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-red-500 focus:border-red-500"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="date" className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">Date</Label>
                                                            <Input
                                                                id="date"
                                                                type="date"
                                                                value={formData.date}
                                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                                required
                                                                className="bg-gray-50/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-red-500 focus:border-red-500"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="location" className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">Location</Label>
                                                            <Input
                                                                id="location"
                                                                placeholder="e.g., GC University"
                                                                value={formData.location}
                                                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                                required
                                                                className="bg-gray-50/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-red-500 focus:border-red-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">Description</Label>
                                                        <Textarea
                                                            id="description"
                                                            placeholder="Describe the event goals, timing, and requirements..."
                                                            value={formData.description}
                                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                            required
                                                            rows={4}
                                                            className="bg-gray-50/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 focus:ring-red-500 focus:border-red-500"
                                                        />
                                                    </div>
                                                </div>

                                                {errorMessage && (
                                                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/50">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        {errorMessage}
                                                    </div>
                                                )}

                                                <div className="flex gap-3 pt-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setIsFormModalOpen(false)}
                                                        className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 dark:shadow-none"
                                                    >
                                                        {isSubmitting ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                Saving...
                                                            </div>
                                                        ) : editingEvent ? 'Update Event' : 'Create Event'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={isDeleteModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all border border-red-100 dark:border-red-900">
                                    {showSuccess ? (
                                        <div className="py-4 space-y-4">
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                                <CheckCircle className="h-10 w-10 text-green-600" />
                                            </div>
                                            <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white">
                                                {successMessage}
                                            </Dialog.Title>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-5">
                                                <Trash2 className="h-10 w-10 text-red-600" />
                                            </div>
                                            <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                Delete Event?
                                            </Dialog.Title>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                                                Are you sure you want to delete <span className="font-semibold text-red-600">"{eventToDelete?.title}"</span>? This action cannot be undone and the event will be removed from all user dashboards.
                                            </p>

                                            <div className="flex gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsDeleteModalOpen(false)}
                                                    className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleDelete}
                                                    disabled={isSubmitting}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 dark:shadow-none"
                                                >
                                                    {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
