import express from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'llama3'; // or mistral, qwen3, deepseek-r1

const SYSTEM_PROMPT = `You are ArchAI, an expert distributed systems architect and educator embedded in a visual system design simulator. You help users:
1. Analyze their architecture diagrams for bottlenecks, single points of failure, and scalability issues
2. Explain distributed systems concepts clearly with concrete examples
3. Suggest improvements with specific metrics estimates
4. Generate architecture descriptions for common patterns
5. Answer system design interview questions

When analyzing architectures, be specific about:
- Which nodes are bottlenecks and why
- Estimated latency improvements from suggested changes  
- CAP theorem tradeoffs
- Real-world examples (Netflix, Uber, Twitter, etc.)

Keep responses concise but informative. Use bullet points for lists. Include rough metric estimates where possible.`;


async function askOllama(prompt, system = '') {
  const response = await axios.post(OLLAMA_URL, {
    model: MODEL,
    prompt: `${system}\n\n${prompt}`,
    stream: false
  });

  return response.data.response;
}

// POST /api/ai/analyze
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { nodes, edges, metrics } = req.body;

    const archDescription = buildArchDescription(nodes, edges, metrics);

    const analysis = await askOllama(
    `Analyze this distributed system architecture:
    
        ${archDescription}`,
        SYSTEM_PROMPT
    );

    res.json({ analysis });
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/chat — general assistant with streaming
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { messages, context } = req.body;

    const conversation = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const reply = await askOllama(
      conversation,
      context
        ? `${SYSTEM_PROMPT}\n\nArchitecture:\n${context}`
        : SYSTEM_PROMPT
    );

    res.json({ reply });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// POST /api/ai/generate-preset
router.post('/generate-preset', authenticate, async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await askOllama(
        `Generate a distributed system architecture for:

        ${prompt}

        Respond ONLY with valid JSON.`,
        `${SYSTEM_PROMPT}

        Return JSON in this format:
        {
            "name": "",
            "description": "",
            "nodes": [],
            "edges": [],
            "explanation": ""
        }`
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        return res.status(500).json({
            error: 'Could not parse architecture'
        });
    }

    const architecture = JSON.parse(jsonMatch[0]);

    res.json(architecture);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/explain-component
router.post('/explain-component', authenticate, async (req, res) => {
  try {
    const { componentType, label, metrics } = req.body;

    const explanation = await askOllama(
        `Explain this component:

        Component type: ${componentType}
        Label: ${label}
        Metrics: ${JSON.stringify(metrics || {})}

        Give a 2-3 sentence explanation.`,
        SYSTEM_PROMPT
    );

    res.json({ explanation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function buildArchDescription(nodes, edges, metrics) {
  const nodeList = nodes
    .map((n) => {
      const m = metrics?.find((x) => x.nodeId === n.id);
      const mStr = m
        ? ` [latency: ${m.latency}ms, throughput: ${m.throughput} rps, errors: ${(m.errorRate * 100).toFixed(2)}%]`
        : '';
      return `- ${n.data?.label || n.type} (${n.type})${mStr}`;
    })
    .join('\n');

  const edgeList = edges
    .map((e) => {
      const src = nodes.find((n) => n.id === e.source);
      const tgt = nodes.find((n) => n.id === e.target);
      return `- ${src?.data?.label || e.source} → ${tgt?.data?.label || e.target}`;
    })
    .join('\n');

  return `Nodes:\n${nodeList}\n\nConnections:\n${edgeList}`;
}

export default router;