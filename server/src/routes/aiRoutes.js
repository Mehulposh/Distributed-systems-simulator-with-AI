/**
 * AI-powered routes for architecture analysis, generation, and explanations.
 */
import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { GoogleGenAI } from "@google/genai";
import { randomUUID } from 'crypto';

const router = express.Router();


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


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Send a prompt to Gemini and return the generated text.
 * @param {string} prompt
 * @param {string} [system='']
 * @returns {Promise<string>}
 */
async function askGemini(prompt, system = '') {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${system}\n\n${prompt}`,
  });

  return response.text;
}

// POST /api/ai/analyze
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { nodes, edges, metrics } = req.body;

    const archDescription = buildArchDescription(nodes, edges, metrics);

    const analysis = await askGemini(
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

    const reply = await askGemini(
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

    const Response = await ai.models.generateContent({
      model: "gemini-2.5-flash",

      contents: `
        Generate a distributed system architecture for:

        ${prompt}

        Return JSON only.

        Node types allowed:
        server
        database
        cache
        queue
        loadbalancer
        cdn
        storage

        Each node must be:

        {
          "name": "API Gateway",
          "nodeType": "loadbalancer"
        }

        Each edge must be:

        {
          "source": "API Gateway",
          "target": "User Service"
        }

        Do not generate IDs.
        Do not generate coordinates.
        `,

      config: {
        responseMimeType: "application/json",

        responseSchema: {
          type: "object",
          properties: {
            name: { type: "string" },

            description: { type: "string" },

            explanation: { type: "string" },

            nodes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  nodeType: { type: "string" }
                },
                required: ["name", "nodeType"]
              }
            },

            edges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source: { type: "string" },
                  target: { type: "string" }
                },
                required: ["source", "target"]
              }
            }
          }
        }
      }
    });

    const architecture = JSON.parse(Response.text);

    const nodeMap = new Map();

      const rfNodes = architecture.nodes.map((node, index) => {
        const id = randomUUID();

        nodeMap.set(node.name, id);

        return {
          id,
          type: 'simNode',

          position: {
            x: 250 * (index % 4),
            y: 180 * Math.floor(index / 4)
          },

          data: {
            type: [
              'server',
              'database',
              'cache',
              'queue',
              'loadbalancer',
              'cdn',
              'storage'
            ].includes(node.nodeType)
              ? node.nodeType
              : 'server',

            label: node.name
          }
        };
      });

      const rfEdges = architecture.edges
        .filter(
          edge =>
            nodeMap.has(edge.source) &&
            nodeMap.has(edge.target)
        )
        .map(edge => ({
          id: randomUUID(),
          source: nodeMap.get(edge.source),
          target: nodeMap.get(edge.target),
          type: 'smoothstep'
        }));
    
    console.log(
      JSON.stringify(
        {
          nodes: rfNodes,
          edges: rfEdges
        },
        null,
        2
      )
    );
   if (
      !architecture.nodes ||
      architecture.nodes.some(
        (n) => !n.name || !n.nodeType
      )
    ) {
      throw new Error("Invalid architecture returned by AI");
    }

    if (
      !architecture.edges ||
      architecture.edges.some(
        (e) => !e.source || !e.target
      )
    ) {
      throw new Error("Invalid edges returned by AI");
    }

    res.json({
      name: architecture.name,
      description: architecture.description,
      explanation: architecture.explanation,
      nodes: rfNodes,
      edges: rfEdges
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/explain-component
router.post('/explain-component', authenticate, async (req, res) => {
  try {
    const { componentType, label, metrics } = req.body;

    const explanation = await askGemini(
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

/**
 * Build a text description of the architecture and metrics for AI analysis.
 * @param {Array} nodes
 * @param {Array} edges
 * @param {Array} metrics
 * @returns {string}
 */
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