import Simulationlog  from "../models/SimulationlogModel.js";

// POST /api/simulation/log — save a simulation run
const saveLog = async (req,res) => {
    try {
        const { architectureId, config, summary, events } = req.body;
        const log = await Simulationlog.create({
            architectureId,
            userId: req.user._id,
            config,
            summary,
            events: events || [],
        });
        res.status(201).json(log);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// GET /api/simulation/logs — user's simulation history
const getLogsHistory = async (req,res) => {
    try {
        const logs = await Simulationlog.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('architectureId', 'name');

        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// GET /api/simulation/logs/:id
const getLogByID = async (req,res) => {
    try {
        const log = await Simulationlog.findOne({ _id: req.params.id, userId: req.user._id });
        if (!log) return res.status(404).json({ error: 'Log not found' });
        res.json(log);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


export {
    getLogByID,
    getLogsHistory,
    saveLog
}