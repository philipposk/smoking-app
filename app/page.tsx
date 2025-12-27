export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <h1 style={{
        fontSize: '3rem',
        marginBottom: '1rem',
        fontWeight: 'bold',
      }}>
        Welcome to Smoking App
      </h1>
      <p style={{
        fontSize: '1.25rem',
        color: '#666',
        textAlign: 'center',
      }}>
        Your web application is ready!
      </p>
    </main>
  )
}

