import { useState } from "react";
import { useGraphData } from "@/hooks/useGraphData";
import GraphVisualization from "@/components/GraphVisualization";
import NodeDetailPanel from "@/components/NodeDetailPanel";
import ChatPanel from "@/components/ChatPanel";
import type { GraphNode } from "@/lib/graphTypes";
import { Database, Loader2 } from "lucide-react";

export default function Index() {
  const { graphData, loading } = useGraphData();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());

  if (loading || !graphData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading graph data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Graph area */}
      <div className="flex-1 relative">
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
          <Database size={14} className="text-primary" />
          <span className="text-xs text-muted-foreground font-mono">
            {graphData.nodes.length} nodes · {graphData.edges.length} edges
          </span>
        </div>
        <GraphVisualization
          graphData={graphData}
          onNodeSelect={setSelectedNode}
          highlightNodes={highlightNodes}
        />
        {selectedNode && (
          <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </div>

      {/* Chat panel */}
      <div className="w-96 flex-shrink-0">
        <ChatPanel onHighlightNodes={setHighlightNodes} />
      </div>
    </div>
  );
}
