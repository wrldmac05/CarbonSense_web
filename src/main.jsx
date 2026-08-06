import {ChakraProvider, defaultSystem} from '@chakra-ui/react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// 🟢 STRICT MODE REMOVED: Your app will now only boot once per load!
createRoot(document.getElementById('root')).render(
  <ChakraProvider value={defaultSystem}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ChakraProvider>
)
