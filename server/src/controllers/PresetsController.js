import Preset from '../models/PresetModel.js'
import SEED_PRESETS from '../constants/seedPresets.js'

// GET /api/presets
const getPresets = async (req,res) => {
    try {
        let presets = await Preset.find().sort({ popularity: -1 });
        // Seed if empty
        if (!presets.length) {
            presets = await Preset.insertMany(SEED_PRESETS);
        }

        res.json(presets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
 

// GET /api/presets/:id
const getPresetsById = async (req,res) => {
    try {
        const preset = await Preset.findById(req.params.id);
        
        if (!preset) return res.status(404).json({ error: 'Preset not found' });
        
        preset.popularity += 1;
        
        await preset.save();
        
        res.json(preset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export {
    getPresets,
    getPresetsById
}