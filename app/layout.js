export const metadata = {
  title: "Calendario de turnos",
  description: "Gestión de turnos semanal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#F4F3EF" }}>
        {children}
      </body>
    </html>
  );
}
