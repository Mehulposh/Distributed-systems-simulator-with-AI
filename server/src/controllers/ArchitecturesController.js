import Architecture from '../models/architectureModel.js'

// ── Sanitise nodes before saving to MongoDB ─────────────────────────────────
const TYPE_ALIAS = {
  loadbalancer: 'loadBalancer', load_balancer: 'loadBalancer',
  queue: 'messageQueue', mq: 'messageQueue', kafka: 'messageQueue',
  redis: 'cache', memcached: 'cache',
  db: 'database', postgres: 'database', mysql: 'database', mongodb: 'database', storage: 'database',
  dbreplica: 'replica', read_replica: 'replica',
  gateway: 'apiGateway', api_gateway: 'apiGateway',
  shards: 'shard', partition: 'shard',
  app: 'server', service: 'server', microservice: 'server', worker: 'server',
  simnode: 'server',
};
const VALID_TYPES = new Set([
  'loadBalancer','cache','database','replica','messageQueue','apiGateway','cdn','shard','server'
]);
function normaliseNodeType(raw = '') {
  const key = raw.toString().toLowerCase().trim();
  if (VALID_TYPES.has(raw)) return raw;
  return TYPE_ALIAS[key] || 'server';
}
function sanitiseNodes(nodes = []) {
  return nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      type: normaliseNodeType(n.data?.type || ''),
    },
  }));
}
// ────────────────────────────────────────────────────────────────────────────

// GET /api/architectures — user's saved architectures
const getArchitectures = async (req,res) => {
    try {
        const archs = await Architecture.find({ userId: req.user._id }).sort({ updatedAt: -1 });
        res.json(archs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// GET /api/architectures/public — public gallery
const getPublicArchitectures = async (req,res) => {
    try {
        const { page = 1, limit = 12, tag } = req.query;
        const filter = { isPublic: true };
        if (tag) filter.tags = tag;
    
        const archs = await Architecture.find(filter)
        .populate('userId', 'name')
        .sort({ forkCount: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));
    
        const total = await Architecture.countDocuments(filter);
        res.json({ architectures: archs, total, page: Number(page) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// GET /api/architectures/:id
const getArchitectureById = async (req,res) => {
    try {
        const arch = await Architecture.findById(req.params.id).populate('userId', 'name');
        if (!arch) return res.status(404).json({ error: 'Architecture not found' });
        if (!arch.isPublic && (!req.user || arch.userId._id.toString() !== req.user._id.toString()))
            return res.status(403).json({ error: 'Access denied' });
        res.json(arch);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// POST /api/architectures
const createArchitecture = async (req,res) => {
    try {
        const { name, description, nodes, edges, isPublic, tags } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });
    
        const arch = await Architecture.create({
            userId: req.user._id,
            name,
            description,
            nodes: sanitiseNodes(nodes || []),
            edges: edges || [],
            isPublic: isPublic || false,
            tags: tags || [],
        });
        res.status(201).json(arch);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// PUT /api/architectures/:id
const editArchitecture = async (req,res) => {
    try {
       const arch = await Architecture.findOne({ _id: req.params.id, userId: req.user._id });
        if (!arch) return res.status(404).json({ error: 'Architecture not found' });
    
        const updateData = { ...req.body };
        if (updateData.nodes) updateData.nodes = sanitiseNodes(updateData.nodes);
        Object.assign(arch, updateData);
        await arch.save();
        res.json(arch);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// DELETE /api/architectures/:id
const deleteArchitecutre = async (req,res) => {
    try {
        const arch = await Architecture.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!arch) return res.status(404).json({ error: 'Architecture not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// POST /api/architectures/:id/fork
const forkArchitecture = async (req,res) => {
    try {
        const original = await Architecture.findById(req.params.id);
        if (!original || !original.isPublic) return res.status(404).json({ error: 'Not found' });
    
        const fork = await Architecture.create({
            userId: req.user._id,
            name: `${original.name} (fork)`,
            description: original.description,
            nodes: original.nodes,
            edges: original.edges,
            isPublic: false,
            tags: original.tags,
            forkedFrom: original._id,
        });
    
        original.forkCount += 1;
        await original.save();
        res.status(201).json(fork);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


export {
    forkArchitecture,
    deleteArchitecutre,
    createArchitecture,
    editArchitecture,
    getArchitectureById,
    getArchitectures,
    getPublicArchitectures

}