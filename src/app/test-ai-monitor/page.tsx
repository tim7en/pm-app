import { AIWorkspaceMonitor } from '@/components/dashboard/ai-workspace-monitor'

export default function TestAIMonitor() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">AI Workspace Monitor Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">With Mock Workspace ID</h2>
          <AIWorkspaceMonitor workspaceId="test123" />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Without Workspace ID</h2>
          <AIWorkspaceMonitor />
        </div>
      </div>
    </div>
  )
}
