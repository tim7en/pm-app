"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  notificationCount: number
  setNotificationCount: (count: number) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocketContext = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socketData = useSocket()

  return (
    <SocketContext.Provider value={socketData}>
      {children}
    </SocketContext.Provider>
  )
}
