export default function Head() {
  return (
    <>
      <title>Dashboard - Matchly</title>
      <meta name="description" content="Panel de control de Matchly - Sistema integral de gestión deportiva" />
      
      {/* Open Graph / Social Media */}
      <meta property="og:title" content="Dashboard - Matchly" />
      <meta property="og:description" content="Panel de control de Matchly - Gestión de ligas, torneos y partidos" />
      <meta property="og:type" content="website" />
      
      {/* Preload de recursos críticos */}
      <link
        rel="preload"
        href="/assets/matchlylogo.png"
        as="image"
        type="image/png"
      />
      
      {/* Preconnect a servicios externos */}
      <link
        rel="preconnect"
        href="https://goipmracccjxjmhpizib.supabase.co"
      />
    </>
  )
} 