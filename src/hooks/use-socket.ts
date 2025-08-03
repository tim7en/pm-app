"use client"

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { io, Socket } from 'socket.io-client'

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  notificationCount: number
  setNotificationCount: (count: number) => void
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0) // Start with 0, not -1
  const { user } = useAuth()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    if (!user?.id) return

    // Initialize socket connection
    const socketInstance = io({
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      upgrade: true,
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id)
      setIsConnected(true)
      reconnectAttempts.current = 0
      
      // Join user room for real-time notifications
      socketInstance.emit('join-user', user.id)
      
      // Request current notification count from server to sync
      socketInstance.emit('get-notification-count', user.id)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setIsConnected(false)
      
      // Auto-reconnect logic
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        socketInstance.connect()
      }
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
      
      reconnectAttempts.current++
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
        socketInstance.disconnect()
      }
    })

    // Notification event handlers
    socketInstance.on('notification', (notification) => {
      console.log('New notification received:', notification)
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icons/notification.png',
          tag: notification.id // Prevent duplicate notifications
        })
      }
      
      // Trigger custom event for components to listen to
      window.dispatchEvent(new CustomEvent('newNotification', { 
        detail: notification 
      }))
    })

    socketInstance.on('notification-count', (data) => {
      console.log('Notification count updated via socket:', data.count)
      setNotificationCount(data.count)
    })

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      if (user?.id) {
        socketInstance.emit('leave-user', user.id)
      }
      socketInstance.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [user?.id])

  // Fetch initial notification count when user changes (only if socket is not connected)
  useEffect(() => {
    const fetchInitialCount = async () => {
      if (!user?.id) {
        setNotificationCount(0)
        return
      }

      // If socket is connected, let it handle the count
      if (socket && isConnected) {
        console.log('Socket connected, skipping initial API count fetch')
        return
      }

      try {
        const response = await fetch('/api/notifications/count', {
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && typeof data.count === 'number') {
            setNotificationCount(data.count)
            console.log('Initial notification count loaded from database via API:', data.count)
          }
        } else {
          console.error('Failed to fetch notification count:', response.status)
          setNotificationCount(0)
        }
      } catch (error) {
        console.error('Failed to fetch initial notification count:', error)
        setNotificationCount(0)
      }
    }

    // Only fetch from API if socket is not connected or user changed
    if (user?.id && (!socket || !isConnected)) {
      fetchInitialCount()
    } else if (!user?.id) {
      setNotificationCount(0)
    }
  }, [user?.id, socket, isConnected])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission)
      })
    }
  }, [])

  return {
    socket,
    isConnected,
    notificationCount,
    setNotificationCount
  }
}
