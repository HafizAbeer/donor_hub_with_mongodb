import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { X, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DonationModals({
    token,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    donationToEdit,
    donationToDelete,
    onSuccess
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [editForm, setEditForm] = useState({
        location: "",
        date: "",
        notes: ""
    });

    useEffect(() => {
        if (isEditModalOpen && donationToEdit) {
            setEditForm({
                location: donationToEdit.location || "",
                date: donationToEdit.date ? new Date(donationToEdit.date).toISOString().split('T')[0] : "",
                notes: donationToEdit.notes || ""
            });
            setErrorMessage("");
        }
    }, [isEditModalOpen, donationToEdit]);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!donationToEdit || !token) return;

        setIsSubmitting(true);
        setErrorMessage("");
        try {
            const res = await fetch(`/api/donations/${donationToEdit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                setSuccessMessage("Donation record updated successfully.");
                setIsEditModalOpen(false);
                setShowSuccess(true);
                if (onSuccess) onSuccess();
                setTimeout(() => {
                    setShowSuccess(false);
                }, 2000);
            } else {
                const err = await res.json();
                setErrorMessage(err.message || "Failed to update donation");
            }
        } catch (error) {
            console.error("Edit donation error:", error);
            setErrorMessage("An error occurred during update");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        if (!donationToDelete || !token) return;

        setIsSubmitting(true);
        setErrorMessage("");
        try {
            const res = await fetch(`/api/donations/${donationToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                setSuccessMessage("Donation record deleted successfully.");
                setIsDeleteModalOpen(false);
                setShowSuccess(true);
                if (onSuccess) onSuccess();
                setTimeout(() => {
                    setShowSuccess(false);
                }, 2000);
            } else {
                const err = await res.json();
                setErrorMessage(err.message || "Failed to delete donation");
            }
        } catch (error) {
            console.error("Delete donation error:", error);
            setErrorMessage("An error occurred during deletion");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Transition appear show={isEditModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50 focus:outline-none" onClose={() => !isSubmitting && setIsEditModalOpen(false)}>
                    <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

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
                                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-red-950 p-6 text-left align-middle shadow-xl transition-all border border-red-100 dark:border-red-900 max-h-[90vh] overflow-y-auto">
                                    <div className="flex items-center justify-between mb-6">
                                        <DialogTitle as="h3" className="text-xl font-bold text-red-900 dark:text-red-100">
                                            Edit Donation
                                        </DialogTitle>
                                        <button
                                            onClick={() => setIsEditModalOpen(false)}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                            disabled={isSubmitting}
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleEditSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-location">Location (Hospital/Center)</Label>
                                            <Input
                                                id="edit-location"
                                                value={editForm.location}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                                className="border-red-200 focus:ring-red-500"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-date">Donation Date</Label>
                                            <Input
                                                id="edit-date"
                                                type="date"
                                                value={editForm.date}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                                                className="border-red-200 focus:ring-red-500"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-notes">Notes</Label>
                                            <Input
                                                id="edit-notes"
                                                value={editForm.notes}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                                className="border-red-200 focus:ring-red-500"
                                            />
                                        </div>

                                        {errorMessage && (
                                            <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-2 rounded border border-rose-100">
                                                {errorMessage}
                                            </p>
                                        )}

                                        <div className="pt-4 flex gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsEditModalOpen(false)}
                                                className="flex-1 border-red-200"
                                                disabled={isSubmitting}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                {isSubmitting ? "Updating..." : "Save Changes"}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogPanel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={isDeleteModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50 focus:outline-none" onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}>
                    <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

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
                                <DialogPanel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white dark:bg-red-950 p-6 text-left align-middle shadow-xl transition-all border border-red-100 dark:border-red-900">
                                    <div className="flex items-center gap-3 mb-4 text-rose-600">
                                        <AlertTriangle className="w-8 h-8" />
                                        <DialogTitle as="h3" className="text-xl font-bold">Delete Record?</DialogTitle>
                                    </div>
                                    <p className="text-sm text-red-700 dark:text-red-300 mb-6">
                                        Are you sure you want to delete this donation record for{" "}
                                        <span className="font-bold">{donationToDelete?.donor}</span>? This will also update the donor's total donation count.
                                    </p>

                                    {errorMessage && (
                                        <p className="text-sm text-rose-600 mb-4">{errorMessage}</p>
                                    )}

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsDeleteModalOpen(false)}
                                            className="flex-1"
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleDeleteSubmit}
                                            disabled={isSubmitting}
                                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                                        >
                                            {isSubmitting ? "Deleting..." : "Yes, Delete"}
                                        </Button>
                                    </div>
                                </DialogPanel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={showSuccess} as={Fragment}>
                <Dialog as="div" className="relative z-[60] focus:outline-none" onClose={() => setShowSuccess(false)}>
                    <DialogBackdrop className="fixed inset-0 bg-black/25 backdrop-blur-sm transition-opacity" />

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <DialogPanel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-center shadow-xl transition-all border border-red-100">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">Success!</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{successMessage}</p>
                            </DialogPanel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}
