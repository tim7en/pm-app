import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return NextResponse.json({ 
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
      },
      database: "connected",
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    return NextResponse.json({ 
      status: "unhealthy",
      error: "Database connection failed",
      timestamp: new Date().toISOString()
    }, { status: 503 });
  } finally {
    await db.$disconnect();
  }
}