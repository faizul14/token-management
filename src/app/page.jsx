import { Suspense } from 'react'
import CheckTokenClient from './checkTokenClient'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckTokenClient />
    </Suspense>
  )
}
