import "./globals.css";

export const metadata = {
  title: "Calendario de turnos",
  description: "Gestión de turnos semanal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
