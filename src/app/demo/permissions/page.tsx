import PermissionDemo from '@/components/demo/permission-demo'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PermissionDemoPage() {
  // Real project and task IDs from the database
  const sampleProjectId = "cmdv8dy0e0005sbutvt8jth3x" // start adb project
  const sampleTaskId = "cmdv8dy20000bsbutgiavfpnk"     // Problem Analysis and Context Study task

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Permission System Demo</h1>
          <p className="text-muted-foreground">
            Interactive demonstration of the role-based permission system
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <PermissionDemo 
        projectId={sampleProjectId}
        taskId={sampleTaskId}
      />
    </div>
  )
}
