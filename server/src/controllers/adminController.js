import User          from '../models/userModel.js';
import Architecture  from '../models/architectureModel.js';
import SimulationLog from '../models/SimulationlogModel.js';
import Preset        from '../models/PresetModel.js';


const getStats = async (req,res) => {
    try {
        const [
            totalUsers,
            totalArchitectures,
            publicArchitectures,
            totalSimulations,
            totalPresets,
            newUsersToday,
            newArchsToday,
        ] = await Promise.all([
            User.countDocuments(),
            Architecture.countDocuments(),
            Architecture.countDocuments({ isPublic: true }),
            SimulationLog.countDocuments(),
            Preset.countDocuments(),
            User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86400000) } }),
            Architecture.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86400000) } }),
        ]);
    
        // Signups per day for last 14 days
        const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);
        const signupTrend = await User.aggregate([
            { $match: { createdAt: { $gte: fourteenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
    
        // Architectures created per day for last 14 days
        const archTrend = await Architecture.aggregate([
            { $match: { createdAt: { $gte: fourteenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
    
        // Most used node types across all architectures
        const nodeTypeStats = await Architecture.aggregate([
            { $unwind: '$nodes' },
            { $group: { _id: '$nodes.data.type', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 9 },
        ]);
    
        // Top forked architectures
        const topForked = await Architecture.find({ isPublic: true })
        .sort({ forkCount: -1 })
        .limit(5)
        .populate('userId', 'name')
        .select('name forkCount userId createdAt');
    
        res.json({
            kpis: {
                totalUsers,
                totalArchitectures,
                publicArchitectures,
                totalSimulations,
                totalPresets,
                newUsersToday,
                newArchsToday,
            },
            signupTrend,
            archTrend,
            nodeTypeStats,
            topForked,
        });
    } catch (error) {
        
    }
}


const getUsers = async (req,res) => {
    try {
        const { page = 1, limit = 20, search = '', role = '' } = req.query;
        const filter = {};
        if (search) filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        ];
        if (role) filter.role = role;
    
        const [users, total] = await Promise.all([
        User.find(filter)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit)),
        User.countDocuments(filter),
        ]);
    
        // Attach architecture count per user
        const userIds = users.map(u => u._id);
        const archCounts = await Architecture.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        ]);
        const archMap = Object.fromEntries(archCounts.map(a => [a._id.toString(), a.count]));
    
        const enriched = users.map(u => ({
        ...u.toJSON(),
        archCount: archMap[u._id.toString()] || 0,
        }));
    
        res.json({ users: enriched, total, page: Number(page) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


const updateRole = async (req,res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role))
            return res.status(400).json({ error: 'Invalid role' });
        
        if (req.params.id === req.user._id.toString())
            return res.status(400).json({ error: 'Cannot change your own role' });
    
        const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
        ).select('-passwordHash');
    
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


const deleteUser = async (req,res) => {
    try {
        if (req.params.id === req.user._id.toString())
            return res.status(400).json({ error: 'Cannot delete your own account' });
    
        await Promise.all([
            User.findByIdAndDelete(req.params.id),
            Architecture.deleteMany({ userId: req.params.id }),
            SimulationLog.deleteMany({ userId: req.params.id }),
        ]);

        res.json({ message: 'User and their data deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


const getArchitecture = async (req,res) => {
    try {
        const { page = 1, limit = 20, search = '', isPublic = '' } = req.query;
        
        const filter = {};
        
        if (search) filter.name = { $regex: search, $options: 'i' };
        
        if (isPublic !== '') filter.isPublic = isPublic === 'true';
    
        const [archs, total] = await Promise.all([
            Architecture.find(filter)
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit))
                .select('name isPublic forkCount tags createdAt userId nodes edges'),
            Architecture.countDocuments(filter),
        ]);
    
        res.json({ architectures: archs, total, page: Number(page) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


const updateVisibility = async (req,res) => {
    try {
        const { isPublic } = req.body;
        
        const arch = await Architecture.findByIdAndUpdate(
        req.params.id,
        { isPublic },
        { new: true }
        );
        
        if (!arch) return res.status(404).json({ error: 'Not found' });
        
        res.json(arch);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


const deleteArchitecture = async (req,res) => {
    try {
        await Architecture.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


const getPresets = async (req,res) => {
    try {
        const presets = await Preset.find().sort({ popularity: -1 });
        res.json(presets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


const deletePresets = async (req,res) => {
    try {
        await Preset.findByIdAndDelete(req.params.id);
        res.json({ message: 'Preset deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// ── POST /api/admin/make-first-admin ─────────────────────────────────────────
// One-time bootstrap: promotes the first registered user to admin
const Promote = async (req,res) => {
    try {
        const { email, secret } = req.body;
        if (secret !== (process.env.ADMIN_SECRET || 'distsim-admin-secret'))
            return res.status(403).json({ error: 'Invalid secret' });
    
        const user = await User.findOneAndUpdate(
        { email },
        { role: 'admin' },
        { new: true }
        ).select('-passwordHash');
    
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: `${user.email} promoted to admin`, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


export {
    getArchitecture,
    getPresets,
    getStats,
    getUsers,
    updateRole,
    updateVisibility,
    deleteArchitecture,
    deletePresets,
    deleteUser,
    Promote
}