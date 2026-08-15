// components/AdminRoute.jsx
import {Navigate} from 'react-router-dom'
import {Box} from '@chakra-ui/react'

// AdminRoute trusts the `isAdmin` value computed once in App.jsx (which
// already does a fail-closed Supabase check + realtime ban/archive
// listener before Routes ever render). Re-checking here independently
// was pure redundancy: an extra DB round trip and a duplicate loading
// spinner on every visit to /admin, with no additional security benefit
// since App.jsx's loading shield guarantees isAdmin is already settled
// by the time this component mounts.
export default function AdminRoute({isAdmin, children}) {
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Box>{children}</Box>
}
