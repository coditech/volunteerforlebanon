import React from 'react'
import { links } from '../data/links'
import { NavLink } from 'react-router-dom'

export const Nav = () => 
  <nav className="demo">
    <NavLink to="/" className="brand">
      <span>Projects</span>
    </NavLink>
    <input id="bmenub" type="checkbox" className="show"/>
    <label htmlFor="bmenub" className="burger pseudo button">
      <span>menu</span>
    </label>

    <div className="menu">
      { links.map(link=><NavLink {...link}/>)}
    </div>
  </nav>