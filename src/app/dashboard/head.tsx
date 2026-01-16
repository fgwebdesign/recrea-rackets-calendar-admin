export default function Head() {
  return (
    <>
      <title>Inicio - Cordon Padel Club</title>
      <meta name="description" content="Panel de control de Cordon Padel Club - Gestiona tus torneos, reservas y más" />
      
      {/* Open Graph / Social Media */}
      <meta property="og:title" content="Inicio - Cordon Padel Club" />
      <meta property="og:description" content="Panel de control de Cordon Padel Club" />
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