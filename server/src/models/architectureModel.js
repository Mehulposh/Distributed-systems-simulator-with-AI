import mongoose from 'mongoose';

/**
 * Schema describing individual nodes in an architecture.
 */
const nodeSchema = new mongoose.Schema({
  id: String,
  type: String,
  position: { x: Number, y: Number },
  data: mongoose.Schema.Types.Mixed,
});

/**
 * Schema describing connections between architecture nodes.
 */
const edgeSchema = new mongoose.Schema({
  id: String,
  source: String,
  target: String,
  type: String,
  data: mongoose.Schema.Types.Mixed,
});

/**
 * Schema for user-created distributed system architectures.
 */
const architectureSchema = new mongoose.Schema(
  {
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    nodes: [nodeSchema],
    edges: [edgeSchema],
    isPublic: { 
        type: Boolean, 
        default: false 
    },
    tags: [String],
    forkCount: { 
        type: Number, 
        default: 0 
    },
    forkedFrom: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Architecture' 
    },
    thumbnail: { 
        type: String 
    },
  },
  { timestamps: true }
);

architectureSchema.index({ userId: 1, updatedAt: -1 });
architectureSchema.index({ isPublic: 1, forkCount: -1 });

export default mongoose.model('Architecture', architectureSchema);