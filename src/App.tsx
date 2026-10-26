import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="center">
        <div className="hero">
        </div>
        <div>
          <h1>BIP39 tool</h1>
        </div>
      </section>
    </>
  )
}

export default App
