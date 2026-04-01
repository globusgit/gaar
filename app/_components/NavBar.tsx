'use client'
import { Bell, Menu } from 'lucide-react'
import React from 'react'

const NavBar = () => {
  return (
    <div className='flex justify-between items-center w-full mb-7'>
      {/* Leftside */}
      <div className='flex justify-between items-center gap-5'>
        <button className='px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100' onClick={()=> {}}>
          <Menu className='w-4 h4'/>
        </button>
        <div className='relative'>
        <input type="search" placeholder='Start type to search product' className='pl-10 pr-4 py-3 w-50 border-2 border-gray-300 bg-white rounded-lg focus:outline-none focus:border-blue-500 px:[0.4rem] py-1 text-xs font-smibold leading' />
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <Bell className='text-gray-500 size={20}' />
        </div>
      </div>
      </div>
      {/*Right side*/}
      <div className='flex justify-between items-center gap-5'>
        <div className='hidden md:flex justify-between items-center gap-5'>
          <div className='relative'>
            <Bell className='cursor-pointer text-gray-500' size={24} />
            <span className='absolute -top-2 -right-2 inline-flex items-center justify-center px-[0.4rem] py-1 text-xs font-semibold leading-none text-red-100 bg-red-400 rounded-full'>
              3
            </span>
          </div>
          <div className='flex items-center gap-3 cursor-pointer'>
            <div className='w-9 h-9 '> Image</div>
            <span className='font-semibold'>{localStorage.getItem("username")} </span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default NavBar