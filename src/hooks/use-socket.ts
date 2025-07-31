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
  const [notificationCount, setNotificationCount] = useState(0)
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
      forceNew: true
    })

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id)
      setIsConnected(true)
      reconnectAttempts.current = 0
      
      // Join user room for real-time notifications
      socketInstance.emit('join-user', user.id)
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
      console.log('Notification count updated:', data.count)
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
