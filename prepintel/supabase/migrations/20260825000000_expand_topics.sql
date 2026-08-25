-- Add topic_category and subtopics to topics table
ALTER TABLE topics ADD COLUMN IF NOT EXISTS topic_category TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS subtopics TEXT[] DEFAULT '{}';

-- Upsert the 28 top-level topics
INSERT INTO topics (name, slug, topic_category, subtopics) VALUES
('Arrays & Matrices', 'arrays', 'Linear DS', ARRAY['Basic array techniques', 'Subarray techniques', '2D arrays / matrices', 'Famous algorithms/patterns']),
('Linked List', 'linked-list', 'Linear DS', ARRAY['Singly Linked List', 'Doubly Linked List', 'Fast/Slow Pointer', 'Merge sorted lists']),
('Stacks & Queues', 'stacks-queues', 'Linear DS', ARRAY['Monotonic stack', 'Parentheses matching', 'Queue', 'Deque']),
('Hashing', 'hashing', 'Linear DS', ARRAY['Frequency map', 'Hash table', 'Rolling hash', 'Prefix Sum + HashMap']),
('Intervals', 'intervals', 'Linear DS', ARRAY['Merge Intervals', 'Interval Intersection', 'Sweep Line']),
('Sorting', 'sorting', 'Sorting & Searching', ARRAY['Merge Sort', 'Quick Sort', 'Counting Sort', 'Cyclic Sort']),
('Binary Search', 'binary-search', 'Sorting & Searching', ARRAY['Classic Binary Search', 'Lower Bound', 'Binary Search on Answer']),
('Two Pointers', 'two-pointers', 'Sorting & Searching', ARRAY['Opposite-direction', 'Same-direction', 'Fast/slow pointers']),
('Sliding Window', 'sliding-window', 'Sorting & Searching', ARRAY['Fixed window', 'Variable window', 'Longest valid window']),
('Strings', 'strings', 'Strings', ARRAY['String reversal', 'Palindrome', 'String matching', 'KMP']),
('Binary Trees & BST', 'trees-bst', 'Trees', ARRAY['Binary Tree', 'Tree properties', 'LCA', 'BST']),
('Advanced Trees (Trie, Segment)', 'advanced-trees', 'Trees', ARRAY['Trie', 'Segment Tree', 'Fenwick Tree']),
('Heap / Priority Queue', 'heap-pq', 'Trees', ARRAY['Min Heap', 'Max Heap', 'Top K']),
('Graph Fundamentals & Traversal', 'graphs', 'Graphs', ARRAY['BFS', 'DFS', 'Connected Components']),
('Shortest Paths', 'shortest-paths', 'Graphs', ARRAY['Dijkstra', 'Bellman-Ford', 'Floyd-Warshall']),
('Minimum Spanning Tree', 'mst', 'Graphs', ARRAY['Prim', 'Kruskal', 'DSU-based MST']),
('DSU / Union Find', 'dsu', 'Graphs', ARRAY['Path Compression', 'Union by Rank', 'Dynamic connectivity']),
('Advanced Graph Theory', 'advanced-graphs', 'Graphs', ARRAY['SCC', 'Max Flow', 'Bipartite Matching']),
('Backtracking & Recursion', 'recursion-backtracking', 'Algorithmic Paradigms', ARRAY['Permutations', 'Combinations', 'Constraint problems']),
('Divide and Conquer', 'divide-conquer', 'Algorithmic Paradigms', ARRAY['Merge Sort', 'Quick Sort', 'Divide-and-conquer DP']),
('Greedy', 'greedy', 'Algorithmic Paradigms', ARRAY['Activity Selection', 'Interval Scheduling', 'Jump Game']),
('DP Fundamentals', '1d-dp', 'Dynamic Programming', ARRAY['1D DP', 'Grid DP', 'Knapsack']),
('Advanced DP', 'advanced-dp', 'Dynamic Programming', ARRAY['String DP', 'Tree DP', 'Bitmask DP']),
('Bit Manipulation', 'bit-manipulation', 'Foundations', ARRAY['AND', 'OR', 'XOR', 'Bitmask']),
('Math & Number Theory', 'math', 'Foundations', ARRAY['Prime numbers', 'GCD', 'Modular arithmetic']),
('Combinatorics & Probability', 'combinatorics', 'Foundations', ARRAY['Permutations', 'Combinations', 'Expected value']),
('Game Theory', 'game-theory', 'Advanced', ARRAY['Nim', 'Minimax', 'Sprague-Grundy']),
('Computational Geometry', 'geometry', 'Advanced', ARRAY['Points', 'Lines', 'Convex hull'])
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  topic_category = EXCLUDED.topic_category,
  subtopics = EXCLUDED.subtopics;
