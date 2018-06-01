import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { ScrollToTopOnPageChange } from './Components'
import { Articles, Events, NotFound } from './Pages'
import { ToastContainer } from 'react-toastify';
import './styles/App.css'

export const App = () =>
  <ScrollToTopOnPageChange>
    <Switch>
      <Redirect from='/' exact to='/articles/home'/>
      <Route path="/events/:event?"     component={Events}/>
      <Route path="/articles/:article?" component={Articles}/>
      <Route component={NotFound}/>
    </Switch>
    <ToastContainer/>
  </ScrollToTopOnPageChange>