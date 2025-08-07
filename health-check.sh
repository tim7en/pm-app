#!/bin/bash

# Server Monitoring Script for PM-App
# Run this script to check system health and application status

echo "🔍 PM-App Server Health Check"
echo "=============================="
echo ""

# System Information
echo "📊 System Information:"
echo "----------------------"
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime -p)"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

# Memory Usage
echo "💾 Memory Usage:"
echo "----------------"
free -h
echo ""

# Disk Usage
echo "💿 Disk Usage:"
echo "--------------"
df -h | grep -E "(Filesystem|/dev/)"
echo ""

# CPU Usage
echo "⚡ CPU Usage (last 5 seconds):"
echo "------------------------------"
top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}'% | sed 's/%/% CPU usage/'
echo ""

# PM2 Status
echo "🚀 Application Status (PM2):"
echo "----------------------------"
if command -v pm2 &> /dev/null; then
    pm2 status
else
    echo "PM2 not installed or not in PATH"
fi
echo ""

# Nginx Status
echo "🌐 Web Server Status (Nginx):"
echo "-----------------------------"
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
    nginx -t 2>&1 | grep -E "(test is successful|syntax is ok)" && echo "✅ Nginx configuration is valid" || echo "❌ Nginx configuration has errors"
else
    echo "❌ Nginx is not running"
fi
echo ""

# Port Check
echo "🔌 Port Status:"
echo "---------------"
if netstat -tuln | grep -q ":3000 "; then
    echo "✅ Port 3000 (App) is listening"
else
    echo "❌ Port 3000 (App) is not listening"
fi

if netstat -tuln | grep -q ":80 "; then
    echo "✅ Port 80 (HTTP) is listening"
else
    echo "❌ Port 80 (HTTP) is not listening"
fi

if netstat -tuln | grep -q ":443 "; then
    echo "✅ Port 443 (HTTPS) is listening"
else
    echo "❌ Port 443 (HTTPS) is not listening"
fi
echo ""

# Application Health Check
echo "🏥 Application Health Check:"
echo "----------------------------"
health_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$health_response" = "200" ]; then
    echo "✅ Application health check passed"
    curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || echo "Health data not in JSON format"
else
    echo "❌ Application health check failed (HTTP $health_response)"
fi
echo ""

# SSL Certificate Check (if applicable)
echo "🔒 SSL Certificate Status:"
echo "--------------------------"
if command -v openssl &> /dev/null; then
    ssl_info=$(openssl s_client -connect hollow-gray-snipe-carey-swknu.app.uztelecom.uz:443 -servername hollow-gray-snipe-carey-swknu.app.uztelecom.uz 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "✅ SSL certificate is valid"
        echo "$ssl_info"
    else
        echo "❌ SSL certificate check failed or not configured"
    fi
else
    echo "OpenSSL not available for certificate check"
fi
echo ""

# Recent Logs
echo "📝 Recent Application Logs (last 20 lines):"
echo "--------------------------------------------"
if [ -f "/var/www/pm-app/logs/combined.log" ]; then
    tail -20 /var/www/pm-app/logs/combined.log
else
    echo "Log file not found at /var/www/pm-app/logs/combined.log"
    if command -v pm2 &> /dev/null; then
        echo "Showing PM2 logs instead:"
        pm2 logs --lines 10 --nostream
    fi
fi
echo ""

echo "🎯 Health Check Complete!"
echo "========================"
