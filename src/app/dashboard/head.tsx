export default function Head() {
  return (
    <>
      <title>Dashboard - BayPadel San Francisco</title>
      <meta name="description" content="Panel de control de BayPadel San Francisco - Gestiona tus torneos, reservas y más" />
      
      {/* Open Graph / Social Media */}
      <meta property="og:title" content="Dashboard - BayPadel San Francisco" />
      <meta property="og:description" content="Panel de control de BayPadel San Francisco" />
      <meta property="og:type" content="website" />
      
      {/* Preload de recursos críticos */}
      <link
        rel="preload"
        href="/assets/recrealogo.jpeg"
        as="image"
        type="image/jpeg"
      />
      
      {/* Preconnect a servicios externos */}
      <link
        rel="preconnect"
        href="https://goipmracccjxjmhpizib.supabase.co"
      />
    </>
  )
} 