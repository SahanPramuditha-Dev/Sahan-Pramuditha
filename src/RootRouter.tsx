import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import ErrorBoundary from './ErrorBoundary.tsx'

const AdminDashboard = lazy(() => import('./AdminDashboard.tsx'))
const NotFound = lazy(() => import('./NotFound.tsx'))

export default function RootRouter() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen bg-bgMain flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
