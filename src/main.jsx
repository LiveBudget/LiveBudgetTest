import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css' // <- This line is crucial
import Timeline from './Timeline.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Timeline />
  </React.StrictMode>
)
