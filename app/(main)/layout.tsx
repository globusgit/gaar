"use client";

import React from 'react'
import SideNav from '../_components/SideNav'
import NavBar from '../_components/NavBar'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { NotificationProvider } from '../_components/NotificationContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ErrorBoundary } from '../_components/ErrorBoundary'
import ProtectedRoute from '../_components/ProtectedRoute'

const layout = ({children} : {children: React.ReactNode}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <NotificationProvider>
      <div className="h-screen flex">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <div className={`
          fixed inset-y-0 left-0 z-50 w-[16%] md:w-[8%] lg:w-[16%] xl:w-[14%] bg-cyan-900
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <SideNav/>
        </div>
        
        <div className="flex-1 overflow-scroll">
          <NavBar />
          {sidebarOpen === false && (
            <div className="lg:hidden p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white hover:bg-cyan-100 hover:text-black"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          )}
          <ErrorBoundary>
            <ProtectedRoute>
              {children}
            </ProtectedRoute>
          </ErrorBoundary>
        </div>
      </div>   
    </NotificationProvider>
  )
}

export default layout