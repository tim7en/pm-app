import { NextResponse } from "next/server";
import { dbUtils } from '@/lib/database';

export async function GET() {
  try {
    // Check database connection using our centralized database layer
    const dbHealth = await dbUtils.healthCheck();
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const health = {
      status: dbHealth.status === 'healthy' ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
      },
      database: dbHealth.status,
      environment: process.env.NODE_ENV,
      node_version: process.version
    };

    // Return 503 if database is unhealthy
    if (dbHealth.status === 'unhealthy') {
      return NextResponse.json(health, { status: 503 });
    }
    
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({ 
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Health check failed",
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}