import BloodRequest from '../models/BloodRequest.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

const getRequests = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            query.createdBy = req.user._id;
        }

        const requests = await BloodRequest.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('getRequests error:', error);
        res.status(500).json({ message: error.message });
    }
};

const createRequest = async (req, res) => {
    console.log('Incoming Blood Request:', JSON.stringify(req.body, null, 2));
    const { patientName, bloodGroup, hospital, countryCode, contactNumber, requiredTime, status, notes } = req.body;

    try {
        const request = new BloodRequest({
            patientName,
            bloodGroup,
            hospital,
            countryCode,
            contactNumber,
            requiredTime,
            status,
            notes,
            createdBy: req.user._id,
        });

        const createdRequest = await request.save();
        await createdRequest.populate('createdBy', 'name');

        try {
            const matchingDonors = await User.find({
                bloodGroup: bloodGroup,
                emailNotifications: true,
                _id: { $ne: req.user._id }
            });

            if (matchingDonors.length > 0) {
                const donorEmails = matchingDonors.map(d => d.email);
                const message = `
                    Urgent Blood Requirement!
                    
                    Patient: ${patientName}
                    Blood Group: ${bloodGroup}
                    Hospital: ${hospital}
                    Required Time: ${requiredTime}
                    Contact: ${countryCode}${contactNumber}
                    Notes: ${notes || 'N/A'}
                    
                    Please contact if you can help.
                `;

                for (const email of donorEmails) {
                    await sendEmail({
                        email,
                        subject: `Urgent ${bloodGroup} Blood Request - Donor Hub`,
                        message,
                    });
                }
                console.log(`Notifications sent to ${matchingDonors.length} donors.`);
            }
        } catch (notifError) {
            console.error('Notification error (non-fatal):', notifError.message);
        }

        res.status(201).json(createdRequest);
    } catch (error) {
        console.error('createRequest error Detail:', error.message);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

const updateRequest = async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);

        if (request) {
            if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && request.createdBy.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            request.status = req.body.status || request.status;
            request.patientName = req.body.patientName || request.patientName;
            request.bloodGroup = req.body.bloodGroup || request.bloodGroup;
            request.hospital = req.body.hospital || request.hospital;
            request.requiredTime = req.body.requiredTime || request.requiredTime;
            request.contactNumber = req.body.contactNumber || request.contactNumber;
            request.notes = req.body.notes || request.notes;

            const updatedRequest = await request.save();
            await updatedRequest.populate('createdBy', 'name');
            res.json(updatedRequest);
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        console.error('updateRequest error:', error);
        res.status(500).json({ message: error.message });
    }
};

const deleteRequest = async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);

        if (request) {
            if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && request.createdBy.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            await request.deleteOne();
            res.json({ message: 'Request removed' });
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        console.error('deleteRequest error:', error);
        res.status(500).json({ message: error.message });
    }
};

export { getRequests, createRequest, updateRequest, deleteRequest };
