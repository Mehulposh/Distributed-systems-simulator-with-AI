import mongoose from 'mongoose';

const presetSchema = new mongoose.Schema(
  {
    name: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    difficulty: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced'], 
        default: 'beginner' 
    },
    nodes: { 
        type: mongoose.Schema.Types.Mixed, 
        default: [] 
    },
    edges: { 
        type: mongoose.Schema.Types.Mixed, 
        default: [] 
    },
    popularity: { 
        type: Number, 
        default: 0 
    },
    tags: [String],
  },
  { timestamps: true }
);

export default mongoose.model('Preset', presetSchema);