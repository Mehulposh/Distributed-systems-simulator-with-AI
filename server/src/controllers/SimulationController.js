/**
 * Controller for simulation log storage and retrieval.
 */
import Simulationlog  from "../models/SimulationlogModel.js";

/**
 * Persist a simulation log for the current user.
 * @param { Request} req
 * @param { Response} res
 */
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
         // Keep User.totalSimulations in sync
        await User.findByIdAndUpdate(req.user._id, { $inc: { totalSimulations: 1 } });
         console.log(`[simulation/log] Saved log ${log._id} for user ${req.user._id}`);
        res.status(201).json(log);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


/**
 * Return recent simulation logs for the authenticated user.
 * @param { Request} req
 * @param { Response} res
 */
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


/**
 * Return a single simulation log by id for the authenticated user.
 * @param { Request} req
 * @param { Response} res
 */
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