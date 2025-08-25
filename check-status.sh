#!/bin/bash

# PM-App Production Status Check Script
# Quick status overview for production deployment

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_URL="https://198.163.207.39"
PROJECT_DIR="/opt/pm-app"

echo -e "${BLUE}=== PM-App Production Status Check ===${NC}"
echo "Timestamp: $(date)"
echo "Server IP: 198.163.207.39"
echo ""

# Check if we're in the right directory
if [[ ! -f "$PROJECT_DIR/docker-compose.caddy.yml" ]]; then
    echo -e "${RED}❌ PM-App not found at $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

# 1. System Status
echo -e "${BLUE}🖥️  System Status:${NC}"
echo "  Uptime: $(uptime -p)"
echo "  Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo "  Disk Usage: $(df -h / | awk 'NR==2{printf "%s/%s (%s)", $3, $2, $5}')"
echo "  Memory Usage: $(free -h | awk 'NR==2{printf "%s/%s (%.1f%%)", $3, $2, $3*100/$2}')"
echo ""

# 2. Docker Status
echo -e "${BLUE}🐳 Docker Status:${NC}"
if systemctl is-active --quiet docker; then
    echo -e "  Docker Service: ${GREEN}✅ Running${NC}"
else
    echo -e "  Docker Service: ${RED}❌ Not Running${NC}"
fi

echo "  Docker Version: $(docker --version | cut -d' ' -f3 | tr -d ',')"
echo ""

# 3. PM-App Service Status
echo -e "${BLUE}🚀 PM-App Service:${NC}"
if systemctl is-active --quiet pm-app; then
    echo -e "  PM-App Service: ${GREEN}✅ Active${NC}"
else
    echo -e "  PM-App Service: ${RED}❌ Inactive${NC}"
fi

# 4. Container Status
echo -e "${BLUE}📦 Container Status:${NC}"
if docker-compose -f docker-compose.caddy.yml ps | grep -q "Up"; then
    echo -e "  Containers: ${GREEN}✅ Running${NC}"
    docker-compose -f docker-compose.caddy.yml ps --format "table" | while IFS= read -r line; do
        if [[ $line == *"Up"* ]]; then
            echo -e "    ${GREEN}✅${NC} $line"
        elif [[ $line == *"Exit"* ]]; then
            echo -e "    ${RED}❌${NC} $line"
        else
            echo "    $line"
        fi
    done
else
    echo -e "  Containers: ${RED}❌ Not Running${NC}"
fi
echo ""

# 5. Health Checks
echo -e "${BLUE}🏥 Health Checks:${NC}"

# Application Health
if curl -f -s "$APP_URL/api/health" > /dev/null 2>&1; then
    echo -e "  Application: ${GREEN}✅ Healthy${NC}"
    
    # Get detailed health info
    HEALTH_DATA=$(curl -s "$APP_URL/api/health" 2>/dev/null)
    if [[ -n "$HEALTH_DATA" ]]; then
        echo "    Status: $(echo "$HEALTH_DATA" | jq -r '.status' 2>/dev/null || echo "Unknown")"
        echo "    Uptime: $(echo "$HEALTH_DATA" | jq -r '.uptime' 2>/dev/null || echo "Unknown")"
        echo "    Memory: $(echo "$HEALTH_DATA" | jq -r '.memory.rss' 2>/dev/null || echo "Unknown")"
        echo "    Database: $(echo "$HEALTH_DATA" | jq -r '.database' 2>/dev/null || echo "Unknown")"
    fi
else
    echo -e "  Application: ${RED}❌ Unhealthy${NC}"
    
    # Try internal health check
    if docker-compose -f docker-compose.caddy.yml exec -T pm-app curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "    Internal: ${YELLOW}⚠️  Internal OK, External Failing${NC}"
    else
        echo -e "    Internal: ${RED}❌ Also Failing${NC}"
    fi
fi

# HTTPS Check
if curl -f -s -I "$APP_URL" | grep -q "HTTP.*200"; then
    echo -e "  HTTPS Access: ${GREEN}✅ Working${NC}"
else
    echo -e "  HTTPS Access: ${RED}❌ Failed${NC}"
fi

# HTTP Redirect Check
if curl -s -I "http://198.163.207.39" | grep -q "301\|302"; then
    echo -e "  HTTP Redirect: ${GREEN}✅ Working${NC}"
else
    echo -e "  HTTP Redirect: ${YELLOW}⚠️  Not Working${NC}"
fi
echo ""

# 6. Resource Usage
echo -e "${BLUE}📊 Resource Usage:${NC}"
if command -v docker &> /dev/null && docker-compose -f docker-compose.caddy.yml ps | grep -q "Up"; then
    echo "  Container Resources:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" $(docker-compose -f docker-compose.caddy.yml ps -q) 2>/dev/null | head -10
fi
echo ""

# 7. Log Summary
echo -e "${BLUE}📄 Recent Logs:${NC}"
echo "  Last 5 Application Errors:"
if docker-compose -f docker-compose.caddy.yml logs --tail=100 pm-app 2>/dev/null | grep -i "error" | tail -5 | grep -q .; then
    docker-compose -f docker-compose.caddy.yml logs --tail=100 pm-app 2>/dev/null | grep -i "error" | tail -5 | sed 's/^/    /'
else
    echo -e "    ${GREEN}✅ No recent errors${NC}"
fi

echo ""
echo "  Last 3 Caddy Logs:"
docker-compose -f docker-compose.caddy.yml logs --tail=10 caddy 2>/dev/null | tail -3 | sed 's/^/    /' || echo "    No Caddy logs available"
echo ""

# 8. Certificate Status
echo -e "${BLUE}🔒 SSL Certificate:${NC}"
if command -v openssl &> /dev/null; then
    CERT_INFO=$(echo | openssl s_client -servername 198.163.207.39 -connect 198.163.207.39:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    if [[ -n "$CERT_INFO" ]]; then
        echo "  Certificate Status: ${GREEN}✅ Valid${NC}"
        echo "$CERT_INFO" | sed 's/^/    /'
        
        # Check expiration
        EXPIRY_DATE=$(echo "$CERT_INFO" | grep "notAfter" | cut -d= -f2)
        if [[ -n "$EXPIRY_DATE" ]]; then
            DAYS_TO_EXPIRY=$(( ($(date -d "$EXPIRY_DATE" +%s) - $(date +%s)) / 86400 ))
            if [[ $DAYS_TO_EXPIRY -lt 30 ]]; then
                echo -e "    ${YELLOW}⚠️  Expires in $DAYS_TO_EXPIRY days${NC}"
            else
                echo -e "    ${GREEN}✅ Expires in $DAYS_TO_EXPIRY days${NC}"
            fi
        fi
    else
        echo -e "  Certificate Status: ${RED}❌ Not Available${NC}"
    fi
else
    echo -e "  Certificate Status: ${YELLOW}⚠️  Cannot Check (openssl not available)${NC}"
fi
echo ""

# 9. Backup Status
echo -e "${BLUE}💾 Backup Status:${NC}"
BACKUP_DIR="/opt/pm-app-backups"
if [[ -d "$BACKUP_DIR" ]]; then
    LATEST_BACKUP=$(find "$BACKUP_DIR" -name "*.tar.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    if [[ -n "$LATEST_BACKUP" ]]; then
        BACKUP_DATE=$(stat -c %y "$LATEST_BACKUP" 2>/dev/null | cut -d' ' -f1)
        echo -e "  Latest Backup: ${GREEN}✅ $BACKUP_DATE${NC}"
        echo "    File: $(basename "$LATEST_BACKUP")"
        echo "    Size: $(du -h "$LATEST_BACKUP" 2>/dev/null | cut -f1)"
    else
        echo -e "  Latest Backup: ${YELLOW}⚠️  No backups found${NC}"
    fi
else
    echo -e "  Backup Directory: ${RED}❌ Not Found${NC}"
fi
echo ""

# 10. Quick Actions
echo -e "${BLUE}🛠️  Quick Actions:${NC}"
echo "  View live logs: sudo docker-compose -f $PROJECT_DIR/docker-compose.caddy.yml logs -f"
echo "  Restart app: sudo docker-compose -f $PROJECT_DIR/docker-compose.caddy.yml restart pm-app"
echo "  Check detailed health: curl -s $APP_URL/api/health | jq"
echo "  Update deployment: sudo $PROJECT_DIR/deploy-quick.sh"
echo ""

# Overall Status
if curl -f -s "$APP_URL/api/health" > /dev/null 2>&1 && systemctl is-active --quiet pm-app; then
    echo -e "${GREEN}🎉 Overall Status: HEALTHY${NC}"
    exit 0
else
    echo -e "${RED}💥 Overall Status: UNHEALTHY - Requires Attention${NC}"
    exit 1
fi
