import AppShell from '../src/components/AppShell'
import ClientsPage from '../src/pages/ClientsPage'

export default function App() {
  return (
    <AppShell active="clients">
      <ClientsPage />
    </AppShell>
  )
}