import React from 'react'
import { Nav } from './Nav'

export const Page = ({ children }) => 
  <div>
    <div>
      { children }
    </div>
    <Nav/>
  </div>