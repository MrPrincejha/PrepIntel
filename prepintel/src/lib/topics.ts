import * as Icons from 'lucide-react';

export const TOPIC_CATEGORIES = [
  {
    category: "Linear DS",
    topics: [
      { id: "arrays", name: "Arrays & Matrices", icon: "Hash" },
      { id: "linked-list", name: "Linked List", icon: "GitBranch" },
      { id: "stacks-queues", name: "Stacks & Queues", icon: "Layers" },
      { id: "hashing", name: "Hashing", icon: "Search" },
      { id: "intervals", name: "Intervals", icon: "GitCommit" }
    ]
  },
  {
    category: "Sorting & Searching",
    topics: [
      { id: "sorting", name: "Sorting", icon: "ArrowDownUp" },
      { id: "binary-search", name: "Binary Search", icon: "Component" },
      { id: "two-pointers", name: "Two Pointers", icon: "MoveHorizontal" },
      { id: "sliding-window", name: "Sliding Window", icon: "Maximize2" }
    ]
  },
  {
    category: "Strings",
    topics: [
      { id: "strings", name: "Strings", icon: "Type" }
    ]
  },
  {
    category: "Trees",
    topics: [
      { id: "trees-bst", name: "Binary Trees & BST", icon: "Network" },
      { id: "advanced-trees", name: "Advanced Trees (Trie, Segment)", icon: "FolderTree" },
      { id: "heap-pq", name: "Heap / Priority Queue", icon: "Database" }
    ]
  },
  {
    category: "Graphs",
    topics: [
      { id: "graphs", name: "Graph Fundamentals & Traversal", icon: "Share2" },
      { id: "shortest-paths", name: "Shortest Paths", icon: "Map" },
      { id: "mst", name: "Minimum Spanning Tree", icon: "Activity" },
      { id: "dsu", name: "DSU / Union Find", icon: "Combine" },
      { id: "advanced-graphs", name: "Advanced Graph Theory", icon: "Cpu" }
    ]
  },
  {
    category: "Algorithmic Paradigms",
    topics: [
      { id: "recursion-backtracking", name: "Backtracking & Recursion", icon: "RotateCcw" },
      { id: "divide-conquer", name: "Divide and Conquer", icon: "Scissors" },
      { id: "greedy", name: "Greedy", icon: "Zap" }
    ]
  },
  {
    category: "Dynamic Programming",
    topics: [
      { id: "1d-dp", name: "DP Fundamentals", icon: "Box" },
      { id: "advanced-dp", name: "Advanced DP", icon: "Boxes" }
    ]
  },
  {
    category: "Foundations",
    topics: [
      { id: "bit-manipulation", name: "Bit Manipulation", icon: "Binary" },
      { id: "math", name: "Math & Number Theory", icon: "Calculator" },
      { id: "combinatorics", name: "Combinatorics & Probability", icon: "Dices" }
    ]
  },
  {
    category: "Advanced",
    topics: [
      { id: "game-theory", name: "Game Theory", icon: "Gamepad2" },
      { id: "geometry", name: "Computational Geometry", icon: "Shapes" }
    ]
  }
];

export const TOPICS = TOPIC_CATEGORIES.flatMap(c => c.topics);

const CATEGORY_COLORS: Record<string, { bg: string, color: string, hex: string }> = {
  "Linear DS": { bg: "bg-blue-500/20", color: "text-blue-400", hex: "#60a5fa" },
  "Sorting & Searching": { bg: "bg-cyan-500/20", color: "text-cyan-400", hex: "#22d3ee" },
  "Strings": { bg: "bg-pink-500/20", color: "text-pink-400", hex: "#f472b6" },
  "Trees": { bg: "bg-green-500/20", color: "text-green-400", hex: "#4ade80" },
  "Graphs": { bg: "bg-fuchsia-500/20", color: "text-fuchsia-400", hex: "#e879f9" },
  "Algorithmic Paradigms": { bg: "bg-amber-500/20", color: "text-amber-400", hex: "#fbbf24" },
  "Dynamic Programming": { bg: "bg-violet-500/20", color: "text-violet-400", hex: "#a78bfa" },
  "Foundations": { bg: "bg-orange-500/20", color: "text-orange-400", hex: "#fb923c" },
  "Advanced": { bg: "bg-red-500/20", color: "text-red-400", hex: "#f87171" }
};

export const TOPIC_STYLES: Record<string, any> = {};

TOPIC_CATEGORIES.forEach(c => {
  c.topics.forEach(t => {
    // @ts-ignore
    const IconComponent = Icons[t.icon] || Icons.Hash;
    TOPIC_STYLES[t.id] = {
      name: t.name,
      bg: CATEGORY_COLORS[c.category].bg,
      color: CATEGORY_COLORS[c.category].color,
      hex: CATEGORY_COLORS[c.category].hex,
      icon: IconComponent
    };
  });
});

// Adding some fallbacks just in case the backend returns something unexpected
TOPIC_STYLES["simulation"] = { name: "Simulation", bg: "bg-rose-500/20", color: "text-rose-400", hex: "#fb7185", icon: Icons.Layers };
TOPIC_STYLES["dfs"] = { name: "DFS", bg: "bg-pink-500/20", color: "text-pink-400", hex: "#f472b6", icon: Icons.Network };
TOPIC_STYLES["bfs"] = { name: "BFS", bg: "bg-fuchsia-500/20", color: "text-fuchsia-400", hex: "#e879f9", icon: Icons.Network };
